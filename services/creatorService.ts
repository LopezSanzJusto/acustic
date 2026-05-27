// services/creatorService.ts
//
// Lógica del panel de creador:
//   - Buscar / crear / descartar el único draft activo del usuario.
//   - Autosave del draft (updateDraft).
//   - Publicación con cascada a points.
//   - Listado de tours del usuario (draft + publicados) para "Mis audioguías".
//
// Toda la interacción con Firestore + Storage vive aquí. Las pantallas/hooks
// llaman a estas funciones; nunca tocan Firestore directamente.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  limit,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp,
} from '@react-native-firebase/firestore';

import { db, firestoreReady } from './firebaseConfig';
import { deleteFile, deleteFiles } from './storageService';
import type {
  Tour,
  TourPoint,
  TourDraft,
  TourDraftInput,
} from '@/types/tour';
import { getDistanceInMeters } from '@/utils/geo';

// ─────────────────────────────────────────────────────────────────────────
// Lectura
// ─────────────────────────────────────────────────────────────────────────

/** Devuelve el único draft activo del usuario, o null si no tiene. */
export async function findActiveDraft(creatorId: string): Promise<TourDraft | null> {
  await firestoreReady;
  const q = query(
    collection(db, 'tours'),
    where('creatorId', '==', creatorId),
    where('status', '==', 'draft'),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<TourDraft, 'id'>) };
}

/** Lee un tour por id. Lanza si no existe. */
export async function getTour(tourId: string): Promise<Tour> {
  await firestoreReady;
  const ref = doc(db, 'tours', tourId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Tour ${tourId} no existe`);
  return { id: snap.id, ...(snap.data() as Omit<Tour, 'id'>) };
}

/** Lista todos los tours del usuario (draft + publicados), más recientes primero. */
export async function listMyTours(creatorId: string): Promise<Tour[]> {
  await firestoreReady;
  const q = query(
    collection(db, 'tours'),
    where('creatorId', '==', creatorId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tour, 'id'>) }));
}

/** Lista los points de un tour, ordenados por `order`. */
export async function listTourPoints(tourId: string): Promise<TourPoint[]> {
  await firestoreReady;
  const q = query(collection(db, 'tours', tourId, 'points'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TourPoint, 'id'>) }));
}

// ─────────────────────────────────────────────────────────────────────────
// Crear / continuar draft
// ─────────────────────────────────────────────────────────────────────────

/** Crea un draft vacío para el usuario. No comprueba si ya tiene otro: para eso
 *  usar `getOrCreateActiveDraft`. */
async function createEmptyDraft(creatorId: string): Promise<TourDraft> {
  await firestoreReady;
  const now = serverTimestamp();
  const draftData = {
    creatorId,
    status: 'draft' as const,
    title: '',
    destination: '',
    category: null,
    price: 0,
    coverImageUrl: null,
    coverImageStoragePath: null,
    imageUrls: [],
    imageStoragePaths: [],
    introAudioUrl: null,
    introAudioStoragePath: null,
    introAudioDuration: null,
    numPoints: 0,
    distance: null,
    duration: null,
    listens: 0,
    rating: 0,
    reviews: 0,
    ratingsBreakdown: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
  const ref = await addDoc(collection(db, 'tours'), draftData);
  const snap = await getDoc(ref);
  return { id: snap.id, ...(snap.data() as Omit<TourDraft, 'id'>) };
}

/** Garantiza que el usuario tenga un draft activo: lo crea si no existe. */
export async function getOrCreateActiveDraft(creatorId: string): Promise<TourDraft> {
  const existing = await findActiveDraft(creatorId);
  if (existing) return existing;
  return createEmptyDraft(creatorId);
}

// ─────────────────────────────────────────────────────────────────────────
// Actualizar draft (autosave)
// ─────────────────────────────────────────────────────────────────────────

/** Aplica un patch parcial al draft + bump de `updatedAt`. Pensado para autosave
 *  con debounce desde el hook del wizard. */
export async function updateDraft(tourId: string, patch: TourDraftInput): Promise<void> {
  await firestoreReady;
  const ref = doc(db, 'tours', tourId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

// ─────────────────────────────────────────────────────────────────────────
// Descartar draft (con limpieza de blobs)
// ─────────────────────────────────────────────────────────────────────────

/** Borra un draft, sus points y todos sus blobs en Storage.
 *  Idempotente y tolerante a fallos parciales (intenta borrar todo lo posible).
 *  Sólo se permite borrar drafts del propio usuario; las reglas lo refuerzan. */
export async function discardDraft(tour: Tour): Promise<void> {
  if (tour.status !== 'draft') {
    throw new Error('discardDraft: sólo se pueden descartar tours en estado draft');
  }

  await firestoreReady;

  // 1) Recuperar points para borrar sus blobs.
  const points = await listTourPoints(tour.id);

  // 2) Borrar blobs en paralelo (Storage es independiente de Firestore).
  const pointBlobPaths = points.flatMap((p) => [p.audioStoragePath, p.imageStoragePath]);
  const tourBlobPaths = [
    tour.coverImageStoragePath,
    tour.introAudioStoragePath,
    ...(tour.imageStoragePaths ?? []),
  ];
  await deleteFiles([...pointBlobPaths, ...tourBlobPaths]);

  // 3) Borrar docs de points (batch: hasta 500 por commit).
  if (points.length > 0) {
    const batch = writeBatch(db);
    for (const p of points) {
      batch.delete(doc(db, 'tours', tour.id, 'points', p.id));
    }
    await batch.commit();
  }

  // 4) Borrar el doc del tour.
  await deleteDoc(doc(db, 'tours', tour.id));
}

// ─────────────────────────────────────────────────────────────────────────
// Publicar
// ─────────────────────────────────────────────────────────────────────────

export interface PublishValidationError {
  field: string;
  message: string;
}

/** Validación previa a publicar. Devuelve array de errores (vacío si todo OK). */
export function validateForPublish(tour: Tour, points: TourPoint[]): PublishValidationError[] {
  const errors: PublishValidationError[] = [];

  if (!tour.title?.trim()) errors.push({ field: 'title', message: 'Falta el título' });
  if (!tour.destination?.trim()) errors.push({ field: 'destination', message: 'Falta el destino' });
  if (!tour.category) errors.push({ field: 'category', message: 'Falta la categoría' });
  if (!tour.coverImageUrl) errors.push({ field: 'coverImage', message: 'Falta la portada' });

  if (points.length < 2) {
    errors.push({ field: 'points', message: 'Necesitas al menos 2 paradas' });
  }

  points.forEach((p, idx) => {
    if (!p.name?.trim()) errors.push({ field: `points[${idx}].name`, message: `Parada ${idx + 1}: falta el nombre` });
    if (!p.audioUrl) errors.push({ field: `points[${idx}].audio`, message: `Parada ${idx + 1}: falta el audio` });
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') {
      errors.push({ field: `points[${idx}].coords`, message: `Parada ${idx + 1}: falta la ubicación` });
    }
  });

  return errors;
}

/** Calcula la distancia total del tour en metros con haversine, sumando
 *  segmentos consecutivos en el orden de `points`. */
function calculateTotalDistance(points: TourPoint[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += getDistanceInMeters(
      points[i].latitude, points[i].longitude,
      points[i + 1].latitude, points[i + 1].longitude,
    );
  }
  return total;
}

/** Calcula la duración total en segundos: suma de audios de cada point + intro. */
function calculateTotalDuration(tour: Tour, points: TourPoint[]): number {
  let total = tour.introAudioDuration ?? 0;
  for (const p of points) total += p.audioDuration ?? 0;
  return total;
}

/** Publica el tour. Valida primero; si falla, lanza error con la lista.
 *  En lote: actualiza el tour Y todos los points (cambia `tourStatus` duplicado). */
export async function publishTour(tourId: string): Promise<void> {
  await firestoreReady;

  const tour = await getTour(tourId);
  if (tour.status === 'published') return; // ya está publicado, no-op

  const points = await listTourPoints(tourId);
  const errors = validateForPublish(tour, points);
  if (errors.length > 0) {
    const message = errors.map((e) => `• ${e.message}`).join('\n');
    const err: Error & { errors?: PublishValidationError[] } = new Error(`No se puede publicar:\n${message}`);
    err.errors = errors;
    throw err;
  }

  const distance = Math.round(calculateTotalDistance(points));
  const duration = Math.round(calculateTotalDuration(tour, points));

  const batch = writeBatch(db);
  batch.update(doc(db, 'tours', tourId), {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    distance,
    duration,
    numPoints: points.length,
  });
  for (const p of points) {
    batch.update(doc(db, 'tours', tourId, 'points', p.id), {
      tourStatus: 'published',
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
