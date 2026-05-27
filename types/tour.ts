// types/tour.ts
//
// Modelo de datos de los tours, alineado con el panel de creador.
// Mantiene los nombres de campos antiguos (city, country, imageUrls,
// numPoints, name/latitude/longitude en points, etc.) para no romper la
// UI existente que ya los consume. Los campos NUEVOS añadidos por la
// migración y por el panel de creador se marcan como opcionales/nullable
// según corresponda.

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { CategoryId } from '@/constants/categories';

export type TourStatus = 'draft' | 'published';

export type FirestoreTimestamp = FirebaseFirestoreTypes.Timestamp;

// ─────────────────────────────────────────────────────────────────────────
// /tours/{tourId}
// ─────────────────────────────────────────────────────────────────────────

export interface Tour {
  id: string;

  // Identidad / estado
  creatorId: string;
  status: TourStatus;

  // Datos básicos
  title: string;
  /** Destino tal cual lo escribe el creador. Tours antiguos no lo tienen
   *  (usan `city`+`country`); la UI debe leer `destination ?? city`. */
  destination?: string;
  /** @deprecated en favor de `destination`. Mantenido para tours antiguos. */
  city?: string;
  /** @deprecated en favor de `destination`. Mantenido para tours antiguos. */
  country?: string;
  /** `null` durante el borrador hasta que el creador elige una categoría.
   *  En tours publicados nunca debe ser null. */
  category: CategoryId | null;
  price: number;

  // Portada (slot grande tipo banner — campo nuevo)
  coverImageUrl: string | null;
  coverImageStoragePath: string | null;

  // Galería ("fotos favoritas de la ruta")
  imageUrls: string[];
  /** Paralelo a `imageUrls`. `null` cuando la foto vive fuera de Firebase
   *  Storage (caso de tours antiguos en Cloudinary). */
  imageStoragePaths: (string | null)[];

  // Audio de introducción
  introAudioUrl: string | null;
  introAudioStoragePath: string | null;
  introAudioDuration: number | null;

  // Métricas (read-only para el creador, las gestiona la app o backend)
  numPoints: number;
  /** Distancia en metros, calculada con haversine entre stops consecutivos. */
  distance: number | null;
  /** Duración total en segundos: suma de duraciones de audios + intro. */
  duration: number | null;
  listens: number;
  rating: number;
  reviews: number;
  ratingsBreakdown: {
    audioQuality: number;
    gpsAccuracy: number;
    narrative: number;
  } | null;

  // Timestamps
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  publishedAt: FirestoreTimestamp | null;
}

// ─────────────────────────────────────────────────────────────────────────
// /tours/{tourId}/points/{pointId}
// ─────────────────────────────────────────────────────────────────────────

export interface TourPoint {
  id: string;

  // Duplicados desde el tour padre para que las reglas de seguridad sean
  // baratas (sin `get()` de Firestore en cada lectura).
  creatorId: string;
  tourStatus: TourStatus;

  order: number;
  /** Mantengo `name` (no `title`) para no romper la UI actual. */
  name: string;
  description: string;

  latitude: number;
  longitude: number;
  /** Google Place ID si el punto vino del autocomplete. `null` si se
   *  añadió manualmente. */
  placeId: string | null;

  audioUrl: string | null;
  audioStoragePath: string | null;
  audioDuration: number | null;
  audioSizeBytes: number | null;

  imageUrl: string | null;
  imageStoragePath: string | null;

  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers para el panel de creador
// ─────────────────────────────────────────────────────────────────────────

/** Vista de tour en estado borrador. El wizard la maneja con setters
 *  parciales: cada campo puede aún no estar relleno. */
export type TourDraft = Tour & { status: 'draft' };

/** Lo mínimo que el creador rellena al crear un tour desde cero. El resto
 *  (métricas, timestamps, etc.) lo pone el backend / `creatorService`. */
export interface TourDraftInput {
  title?: string;
  destination?: string;
  category?: CategoryId;
  price?: number;
  coverImageUrl?: string | null;
  coverImageStoragePath?: string | null;
  imageUrls?: string[];
  imageStoragePaths?: (string | null)[];
  introAudioUrl?: string | null;
  introAudioStoragePath?: string | null;
  introAudioDuration?: number | null;
}

/** Devuelve el destino "para mostrar" tolerando tours antiguos
 *  (que sólo tienen `city`/`country`). */
export function getTourDestinationLabel(tour: Pick<Tour, 'destination' | 'city' | 'country'>): string {
  if (tour.destination && tour.destination.trim().length > 0) return tour.destination;
  const parts = [tour.city, tour.country].filter((s): s is string => !!s && s.trim().length > 0);
  return parts.join(', ');
}
