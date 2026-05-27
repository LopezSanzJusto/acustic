// services/storageService.ts
//
// Capa fina sobre @react-native-firebase/storage para el panel de creador.
// Centraliza:
//   - Construcción de rutas (un único sitio donde decidir cómo se organizan
//     los blobs en el bucket).
//   - Subida con progreso.
//   - Borrado tolerante a "no existe".

import {
  getStorage,
  ref as storageRef,
  putFile,
  getDownloadURL,
  deleteObject,
  type FirebaseStorageTypes,
} from '@react-native-firebase/storage';
import { getApp } from '@react-native-firebase/app';

const storage = getStorage(getApp());

// ─────────────────────────────────────────────────────────────────────────
// Rutas estándar
// ─────────────────────────────────────────────────────────────────────────
//
// Estructura del bucket:
//   tours/{creatorId}/{tourId}/cover.{ext}
//   tours/{creatorId}/{tourId}/photos/{photoId}.{ext}
//   tours/{creatorId}/{tourId}/intro-audio.{ext}
//   tours/{creatorId}/{tourId}/points/{pointId}/audio.{ext}
//   tours/{creatorId}/{tourId}/points/{pointId}/image.{ext}
//
// El `creatorId` va EN la ruta (no sólo en el doc Firestore) para que las
// reglas de Storage validen propiedad sin hacer `firestore.get`, que es
// caro y lento.

export const StoragePaths = {
  cover: (creatorId: string, tourId: string, ext: string) =>
    `tours/${creatorId}/${tourId}/cover.${ext}`,

  photo: (creatorId: string, tourId: string, photoId: string, ext: string) =>
    `tours/${creatorId}/${tourId}/photos/${photoId}.${ext}`,

  introAudio: (creatorId: string, tourId: string, ext: string) =>
    `tours/${creatorId}/${tourId}/intro-audio.${ext}`,

  pointAudio: (creatorId: string, tourId: string, pointId: string, ext: string) =>
    `tours/${creatorId}/${tourId}/points/${pointId}/audio.${ext}`,

  pointImage: (creatorId: string, tourId: string, pointId: string, ext: string) =>
    `tours/${creatorId}/${tourId}/points/${pointId}/image.${ext}`,
};

/** Genera un id corto sin dependencias externas. Suficiente para nombres de blob. */
export function randomBlobId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Extrae extensión de una URI local (`file:///...jpg`, `content://...`, etc.).
 *  Si no hay, cae al fallback. */
export function extractExtension(uri: string, fallback: string): string {
  const cleaned = uri.split('?')[0].split('#')[0];
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return fallback;
  const ext = cleaned.slice(lastDot + 1).toLowerCase();
  if (!ext || ext.length > 5) return fallback;
  return ext;
}

// ─────────────────────────────────────────────────────────────────────────
// Subida
// ─────────────────────────────────────────────────────────────────────────

export interface UploadOptions {
  /** URI local del archivo (file:// o content://). Lo da picker/manipulator. */
  localUri: string;
  /** Ruta destino dentro del bucket. Usar helpers de `StoragePaths`. */
  storagePath: string;
  /** Content-Type para que Storage lo sirva con la cabecera correcta. */
  contentType: string;
  /** Callback de progreso (0..1). Opcional. */
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  storagePath: string;
  sizeBytes: number;
  contentType: string;
}

/** Subida simple esperando el await. Para cancelable usar `uploadFileWithControl`. */
export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
  const { promise } = uploadFileWithControl(opts);
  return promise;
}

export interface UploadHandle {
  promise: Promise<UploadResult>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/** Versión con control: devuelve la promesa + métodos para cancel/pause/resume. */
export function uploadFileWithControl(opts: UploadOptions): UploadHandle {
  const { localUri, storagePath, contentType, onProgress } = opts;

  const ref = storageRef(storage, storagePath);

  // putFile en RN Firebase acepta `file://` directamente. Si viene `content://`,
  // también lo gestiona en Android (resuelve internamente).
  const task: FirebaseStorageTypes.Task = ref.putFile(localUri, { contentType });

  if (onProgress) {
    task.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0) {
        onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
      }
    });
  }

  const promise = (async (): Promise<UploadResult> => {
    const result = await task;
    const url = await getDownloadURL(ref);
    return {
      url,
      storagePath,
      sizeBytes: result.bytesTransferred,
      contentType,
    };
  })();

  return {
    promise,
    cancel: () => task.cancel(),
    pause: () => task.pause(),
    resume: () => task.resume(),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Borrado
// ─────────────────────────────────────────────────────────────────────────

/** Borra un blob por ruta. Si no existe, no lanza (idempotente). */
export async function deleteFile(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  try {
    const ref = storageRef(storage, storagePath);
    await deleteObject(ref);
  } catch (err: any) {
    if (err?.code === 'storage/object-not-found') return;
    throw err;
  }
}

/** Borra varios blobs en paralelo, tolerando individuales que no existan. */
export async function deleteFiles(paths: (string | null | undefined)[]): Promise<void> {
  await Promise.all(paths.map((p) => deleteFile(p)));
}
