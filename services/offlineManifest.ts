import * as FileSystem from 'expo-file-system/legacy';
import { PointOfInterest } from '../data/points';
import { manifestPath } from './offlinePaths';

// Versión del esquema del manifest. Incrementar si cambia la estructura
// para invalidar descargas antiguas en el paso 10.
export const MANIFEST_SCHEMA_VERSION = 1;

export interface TourMeta {
  id: string;
  title: string;
  city: string;
  country: string;
  distance?: string;
  duration?: string;
  rating?: number;
  reviews?: number;
  contentVersion: number; // bumpeado en Firestore cuando el creador actualiza el contenido
}

export interface StopAsset {
  stopId: string;
  name: string;
  order: number;
  latitude: number;
  longitude: number;
  audioUrl: string;   // URL remota original (para re-descarga)
  imageUrl: string;   // URL remota original
}

export interface TourManifest {
  schemaVersion: number;
  tourId: string;
  meta: TourMeta;
  introAudioUrl: string;
  coverImageUrls: string[];   // URLs remotas de todas las imágenes del tour
  stops: StopAsset[];
  createdAt: number;          // timestamp ms — cuándo se descargó
}

// Construye el manifest a partir de los datos que ya tenemos de Firestore.
// No hace ninguna petición de red — solo organiza lo que vino del warmup y useFirebasePoints.
export function buildManifest(tour: any, points: PointOfInterest[]): TourManifest {
  const stops: StopAsset[] = points.map((p) => ({
    stopId: p.id,
    name: p.name,
    order: p.order,
    latitude: p.latitude,
    longitude: p.longitude,
    audioUrl: p.audio,
    imageUrl: p.image,
  }));

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    tourId: tour.id,
    meta: {
      id: tour.id,
      title: tour.title ?? tour.name ?? '',
      city: tour.city ?? '',
      country: tour.country ?? '',
      distance: tour.distance,
      duration: tour.duration,
      rating: tour.rating,
      reviews: tour.reviews,
      contentVersion: tour.contentVersion ?? 1,
    },
    introAudioUrl: tour.introAudioUrl ?? '',
    coverImageUrls: tour.imageUrls?.length > 0 ? tour.imageUrls : (tour.image ? [tour.image] : []),
    stops,
    createdAt: Date.now(),
  };
}

// Guarda el manifest en disco como meta.json
export async function saveManifest(manifest: TourManifest): Promise<void> {
  const path = manifestPath(manifest.tourId);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(manifest), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

// Lee el manifest desde disco. Devuelve null si no existe.
export async function readManifest(tourId: string): Promise<TourManifest | null> {
  const path = manifestPath(tourId);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(raw) as TourManifest;
}
