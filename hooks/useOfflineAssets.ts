import { useState, useEffect } from 'react';
import { PointOfInterest } from '../data/points';
import { readManifest } from '../services/offlineManifest';
import { audioPath, introAudioPath, imagePath } from '../services/offlinePaths';

function extFromUrl(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]{2,4})$/);
    return match ? `.${match[1].toLowerCase()}` : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Dado un tourId + arrays de assets remotos, devuelve versiones resueltas:
 *  - Si el tour está descargado (meta.json existe): rutas file:// locales
 *  - Si no: las mismas URLs remotas que entran (sin cambios)
 *
 * Diseñado para usarse en los screens que son dueños de los datos.
 * Los componentes hijos reciben directamente las URIs ya resueltas.
 */
export function useOfflineAssets(
  tourId: string,
  points: PointOfInterest[],
  introAudioUrl?: string,
  coverImageUrls?: string[],
) {
  const [resolvedPoints, setResolvedPoints] = useState<PointOfInterest[]>(points);
  const [resolvedIntroAudioUrl, setResolvedIntroAudioUrl] = useState<string | undefined>(introAudioUrl);
  const [resolvedCoverImages, setResolvedCoverImages] = useState<string[]>(coverImageUrls ?? []);

  // Stable keys para las dependencias (evita re-renders por identidad de array)
  const pointsLen = points.length;
  const coversKey = (coverImageUrls ?? []).join('|');

  useEffect(() => {
    // Primero sincronizamos con los valores remotos que llegaron (fallback inmediato)
    setResolvedPoints(points);
    setResolvedIntroAudioUrl(introAudioUrl);
    setResolvedCoverImages(coverImageUrls ?? []);

    if (!tourId || points.length === 0) return;

    let cancelled = false;

    async function resolve() {
      const manifest = await readManifest(tourId);
      if (cancelled || !manifest) return;

      // Mapa rápido stopId → rutas locales derivadas del manifest
      const localAudio = new Map<string, string>();
      const localImage = new Map<string, string>();

      for (const stop of manifest.stops) {
        if (stop.audioUrl) {
          localAudio.set(
            stop.stopId,
            audioPath(tourId, stop.stopId, extFromUrl(stop.audioUrl, '.mp3')),
          );
        }
        if (stop.imageUrl) {
          localImage.set(
            stop.stopId,
            imagePath(tourId, stop.stopId, extFromUrl(stop.imageUrl, '.jpg')),
          );
        }
      }

      const resolved = points.map((p) => ({
        ...p,
        audio: localAudio.get(p.id) ?? p.audio,
        image: localImage.get(p.id) ?? p.image,
      }));

      const localIntro = manifest.introAudioUrl
        ? introAudioPath(tourId, extFromUrl(manifest.introAudioUrl, '.mp3'))
        : introAudioUrl;

      const localCovers = (coverImageUrls ?? []).map((url, i) =>
        imagePath(tourId, `cover_${i}`, extFromUrl(url, '.jpg')),
      );

      if (!cancelled) {
        setResolvedPoints(resolved);
        setResolvedIntroAudioUrl(localIntro);
        setResolvedCoverImages(localCovers);
      }
    }

    resolve();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, pointsLen, coversKey, introAudioUrl]);

  return { resolvedPoints, resolvedIntroAudioUrl, resolvedCoverImages };
}
