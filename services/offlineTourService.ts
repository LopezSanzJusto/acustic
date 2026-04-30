import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PointOfInterest } from '../data/points';
import {
  TourManifest,
  buildManifest,
  saveManifest,
  readManifest,
} from './offlineManifest';
import {
  audioPath,
  introAudioPath,
  imagePath,
  ensureTourDirs,
  deleteTourDir,
  getFreeDiskBytes,
} from './offlinePaths';
import { DownloadEntry } from './offlineTypes';
import { downloadOfflineMap, deleteOfflineMap } from './offlineMapService';

// ─── Types internos ───────────────────────────────────────────────────────

interface AssetTask {
  id: string;
  remoteUri: string;
  localUri: string;
  done: boolean;
  resumeData?: string;
}

interface ResumeState {
  manifest: TourManifest;
  assets: AssetTask[];
  totalBytes: number;
  bytesDownloaded: number; // acumulado de assets ya completados antes de pause
}

// ─── Estado de módulo (en memoria) ────────────────────────────────────────

// Instancias activas de DownloadResumable por tour → por assetId
const tourResumables = new Map<
  string,
  Map<string, FileSystem.DownloadResumable>
>();

// ─── Claves de AsyncStorage ───────────────────────────────────────────────

const resumeKey = (tourId: string) => `@offline_resume:${tourId}`;

// ─── Utilidades privadas ──────────────────────────────────────────────────

// Extrae la extensión de una URL (ej: ".mp3", ".jpg"). Nunca falla.
function extFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,4})$/);
    return match ? `.${match[1].toLowerCase()}` : fallback;
  } catch {
    return fallback;
  }
}

// HEAD request para obtener el peso de un fichero. Devuelve 0 si falla.
async function getFileSize(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const cl = res.headers.get('content-length');
    return cl ? parseInt(cl, 10) : 0;
  } catch {
    return 0;
  }
}

// Ejecuta tareas async con concurrencia limitada
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
  return results;
}

// Construye la lista de assets a descargar desde el manifest
function buildAssetTasks(tourId: string, manifest: TourManifest): AssetTask[] {
  const tasks: AssetTask[] = [];

  if (manifest.introAudioUrl) {
    const ext = extFromUrl(manifest.introAudioUrl, '.mp3');
    tasks.push({
      id: 'intro',
      remoteUri: manifest.introAudioUrl,
      localUri: introAudioPath(tourId, ext),
      done: false,
    });
  }

  for (const stop of manifest.stops) {
    if (stop.audioUrl) {
      const ext = extFromUrl(stop.audioUrl, '.mp3');
      tasks.push({
        id: `audio_${stop.stopId}`,
        remoteUri: stop.audioUrl,
        localUri: audioPath(tourId, stop.stopId, ext),
        done: false,
      });
    }
    if (stop.imageUrl) {
      const ext = extFromUrl(stop.imageUrl, '.jpg');
      tasks.push({
        id: `img_${stop.stopId}`,
        remoteUri: stop.imageUrl,
        localUri: imagePath(tourId, stop.stopId, ext),
        done: false,
      });
    }
  }

  manifest.coverImageUrls.forEach((url, i) => {
    if (url) {
      const ext = extFromUrl(url, '.jpg');
      tasks.push({
        id: `cover_${i}`,
        remoteUri: url,
        localUri: imagePath(tourId, `cover_${i}`, ext),
        done: false,
      });
    }
  });

  return tasks;
}

// Descarga un lote de assets y actualiza el progreso en tiempo real
async function runDownloadBatch(
  tourId: string,
  assets: AssetTask[],
  alreadyDownloaded: number,
  totalBytes: number,
  onProgress: (patch: Partial<DownloadEntry>) => void,
): Promise<void> {
  const assetResumables =
    tourResumables.get(tourId) ?? new Map<string, FileSystem.DownloadResumable>();
  tourResumables.set(tourId, assetResumables);

  // Bytes descargados en esta sesión (fuera del acumulado previo)
  const bytesThisSession = new Map<string, number>();
  const getSessionBytes = () =>
    [...bytesThisSession.values()].reduce((a, b) => a + b, 0);

  const downloadTasks = assets
    .filter((a) => !a.done)
    .map((asset) => async () => {
      const resumable = FileSystem.createDownloadResumable(
        asset.remoteUri,
        asset.localUri,
        {},
        ({ totalBytesWritten }) => {
          bytesThisSession.set(asset.id, totalBytesWritten);
          const downloaded = alreadyDownloaded + getSessionBytes();
          onProgress({
            status: 'downloading',
            bytesDownloaded: downloaded,
            progress: totalBytes > 0 ? downloaded / totalBytes : 0,
          });
        },
        asset.resumeData,
      );

      assetResumables.set(asset.id, resumable);

      // resumeAsync si hay datos de reanudación, downloadAsync si es fresco
      asset.resumeData
        ? await resumable.resumeAsync()
        : await resumable.downloadAsync();

      assetResumables.delete(asset.id);
      asset.done = true;
      asset.resumeData = undefined;

      // Actualiza el progreso en AsyncStorage para no perder estado si la app muere
      const savedJson = await AsyncStorage.getItem(resumeKey(tourId));
      if (savedJson) {
        const state: ResumeState = JSON.parse(savedJson);
        const a = state.assets.find((x) => x.id === asset.id);
        if (a) {
          a.done = true;
          a.resumeData = undefined;
        }
        state.bytesDownloaded = alreadyDownloaded + getSessionBytes();
        await AsyncStorage.setItem(resumeKey(tourId), JSON.stringify(state));
      }
    });

  await runWithConcurrency(downloadTasks, 3);
  tourResumables.delete(tourId);
}

// ─── Utilidad de formato (solo para mensajes al usuario) ─────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── API pública ──────────────────────────────────────────────────────────

/**
 * Hace HEAD a todas las URLs del manifest y devuelve el peso total en bytes.
 * Usar antes de iniciar la descarga para informar al usuario.
 */
export async function getTotalDownloadSize(manifest: TourManifest): Promise<number> {
  const urls = [
    manifest.introAudioUrl,
    ...manifest.stops.map((s) => s.audioUrl),
    ...manifest.stops.map((s) => s.imageUrl),
    ...manifest.coverImageUrls,
  ].filter(Boolean) as string[];

  // Paralelismo 5 para no bloquear la UI con 30-40 HEAD requests seguidos
  const sizes = await runWithConcurrency(
    urls.map((url) => () => getFileSize(url)),
    5,
  );
  return sizes.reduce((sum, s) => sum + s, 0);
}

/**
 * Comprueba si hay espacio suficiente para descargar el tour.
 * Hace HEAD requests + lee el espacio libre del disco en paralelo.
 * BUFFER de 50 MB para no quedarse al límite.
 */
const DISK_BUFFER_BYTES = 50 * 1024 * 1024; // 50 MB

export async function checkDiskSpaceForTour(
  tour: any,
  points: PointOfInterest[],
): Promise<{ hasSpace: boolean; requiredBytes: number; freeBytes: number }> {
  const manifest = buildManifest(tour, points);
  const [requiredBytes, freeBytes] = await Promise.all([
    getTotalDownloadSize(manifest),
    getFreeDiskBytes(),
  ]);
  return {
    hasSpace: freeBytes >= requiredBytes + DISK_BUFFER_BYTES,
    requiredBytes,
    freeBytes,
  };
}

/**
 * Descarga completa de una audioguía.
 * Construye el manifest desde tour + points, calcula tamaño exacto con HEAD
 * requests, descarga todos los assets con concurrencia 3 y guarda meta.json.
 */
export async function downloadTour(
  tour: any,
  points: PointOfInterest[],
  onProgress: (patch: Partial<DownloadEntry>) => void,
): Promise<void> {
  const manifest = buildManifest(tour, points);
  const tourId = manifest.tourId;
  const assets = buildAssetTasks(tourId, manifest);

  // 1. Señalizar inicio y calcular tamaño
  onProgress({ status: 'downloading', progress: 0, bytesDownloaded: 0, totalBytes: 0 });
  const totalBytes = await getTotalDownloadSize(manifest);
  onProgress({ totalBytes });

  // 2. Crear estructura de carpetas
  await ensureTourDirs(tourId);

  // 3. Persistir estado de reanudación en AsyncStorage
  const resumeState: ResumeState = {
    manifest,
    assets,
    totalBytes,
    bytesDownloaded: 0,
  };
  await AsyncStorage.setItem(resumeKey(tourId), JSON.stringify(resumeState));

  // 4. Descarga de assets (audio + imágenes) con concurrencia
  onProgress({ phase: 'assets' });
  await runDownloadBatch(tourId, assets, 0, totalBytes, onProgress);

  // 5. Guardar manifest en disco
  await saveManifest(manifest);
  await AsyncStorage.removeItem(resumeKey(tourId));

  // 6. Descarga de tiles del mapa
  onProgress({ phase: 'map', progress: 0 });
  try {
    await downloadOfflineMap(tourId, manifest, (pct) => {
      onProgress({ phase: 'map', progress: pct });
    });
  } catch (e) {
    // La descarga de mapa falla silenciosamente: el tour sigue funcionando
    // offline (audio + imágenes), solo el mapa usará tiles de red si hay conexión.
    console.warn('[offline] map tiles download failed:', e);
  }

  onProgress({ status: 'completed', progress: 1, bytesDownloaded: totalBytes, phase: undefined });
}

/**
 * Pausa una descarga en curso.
 * Guarda el resumeData de cada DownloadResumable activo en AsyncStorage.
 */
export async function pauseDownload(tourId: string): Promise<void> {
  const assetResumables = tourResumables.get(tourId);
  if (!assetResumables?.size) return;

  const savedJson = await AsyncStorage.getItem(resumeKey(tourId));
  if (!savedJson) return;
  const state: ResumeState = JSON.parse(savedJson);

  await Promise.all(
    [...assetResumables.entries()].map(async ([assetId, resumable]) => {
      try {
        const pauseState = await resumable.pauseAsync();
        const asset = state.assets.find((a) => a.id === assetId);
        if (asset && pauseState.resumeData) {
          asset.resumeData = pauseState.resumeData;
        }
      } catch {
        // El asset puede haber terminado justo antes del pause — ignorar
      }
    }),
  );

  await AsyncStorage.setItem(resumeKey(tourId), JSON.stringify(state));
  tourResumables.delete(tourId);
}

/**
 * Reanuda una descarga pausada (incluyendo tras reinicio de la app).
 * Lee el estado guardado en AsyncStorage y retoma desde donde se quedó.
 */
export async function resumeDownload(
  tourId: string,
  onProgress: (patch: Partial<DownloadEntry>) => void,
): Promise<void> {
  const savedJson = await AsyncStorage.getItem(resumeKey(tourId));
  if (!savedJson) return;
  const state: ResumeState = JSON.parse(savedJson);

  const { manifest, assets, totalBytes, bytesDownloaded } = state;

  onProgress({
    status: 'downloading',
    progress: totalBytes > 0 ? bytesDownloaded / totalBytes : 0,
    bytesDownloaded,
    totalBytes,
  });

  await runDownloadBatch(tourId, assets, bytesDownloaded, totalBytes, onProgress);

  await saveManifest(manifest);
  await AsyncStorage.removeItem(resumeKey(tourId));

  onProgress({ status: 'completed', progress: 1, bytesDownloaded: totalBytes });
}

/**
 * Elimina todos los ficheros descargados del tour y limpia el estado.
 */
export async function deleteTour(tourId: string): Promise<void> {
  // Pausar si hay descarga activa antes de borrar
  await pauseDownload(tourId);
  await deleteTourDir(tourId);
  await AsyncStorage.removeItem(resumeKey(tourId));
  tourResumables.delete(tourId);
  await deleteOfflineMap(tourId);
}

/**
 * Devuelve true si el tour tiene meta.json en disco (descarga completa).
 */
export async function isTourAvailableOffline(tourId: string): Promise<boolean> {
  const manifest = await readManifest(tourId);
  return manifest !== null;
}

/**
 * Devuelve la URI local (file://) de un asset si está descargado,
 * o la URL remota como fallback. Para audio usa stopId, para cover usa 'cover_N'.
 */
export async function getLocalAssetUri(
  tourId: string,
  assetId: string,
  remoteUrl: string,
  type: 'audio' | 'image',
): Promise<string> {
  const ext = extFromUrl(remoteUrl, type === 'audio' ? '.mp3' : '.jpg');
  const localPath =
    type === 'audio'
      ? assetId === 'intro'
        ? introAudioPath(tourId, ext)
        : audioPath(tourId, assetId, ext)
      : imagePath(tourId, assetId, ext);

  const info = await FileSystem.getInfoAsync(localPath);
  return info.exists ? localPath : remoteUrl;
}
