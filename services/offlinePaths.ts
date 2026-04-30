import * as FileSystem from 'expo-file-system/legacy';

// documentDirectory persiste hasta que el usuario desinstala la app
const TOURS_ROOT = FileSystem.documentDirectory + 'tours/';

// tours/{tourId}/
export function tourDir(tourId: string): string {
  return TOURS_ROOT + tourId + '/';
}

// tours/{tourId}/meta.json
export function manifestPath(tourId: string): string {
  return tourDir(tourId) + 'meta.json';
}

// tours/{tourId}/audios/{stopId}{ext}   (ext incluye el punto, ej: ".mp3")
export function audioPath(tourId: string, stopId: string, ext = '.mp3'): string {
  return tourDir(tourId) + 'audios/' + stopId + ext;
}

// tours/{tourId}/audios/intro{ext}
export function introAudioPath(tourId: string, ext = '.mp3'): string {
  return tourDir(tourId) + 'audios/intro' + ext;
}

// tours/{tourId}/images/{assetId}{ext}
export function imagePath(tourId: string, assetId: string, ext = '.jpg'): string {
  return tourDir(tourId) + 'images/' + assetId + ext;
}

// Crea la estructura de carpetas del tour si no existe
export async function ensureTourDirs(tourId: string): Promise<void> {
  const base = tourDir(tourId);
  await FileSystem.makeDirectoryAsync(base + 'audios', { intermediates: true });
  await FileSystem.makeDirectoryAsync(base + 'images', { intermediates: true });
}

// Borra toda la carpeta del tour (descarga completa)
export async function deleteTourDir(tourId: string): Promise<void> {
  const dir = tourDir(tourId);
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }
}

// Espacio libre en bytes
export async function getFreeDiskBytes(): Promise<number> {
  const free = await FileSystem.getFreeDiskStorageAsync();
  return free;
}
