// hooks/useDownloadUpdates.ts
// Comprueba, para un tour descargado, si el contenido remoto es más nuevo que el local.
// Si contentVersion en Firestore > contentVersion guardado en el manifest → isOutdated = true.

import { useState, useEffect } from 'react';
import { doc, getDoc } from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { db, firestoreReady } from '../services/firebaseConfig';
import { readManifest, MANIFEST_SCHEMA_VERSION } from '../services/offlineManifest';
import { useTourDownload } from './useDownloads';

export function useTourUpdateAvailable(tourId: string): boolean {
  const { isDownloaded } = useTourDownload(tourId);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    if (!isDownloaded) {
      setIsOutdated(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      // Sin red → no comprobamos
      const netState = await NetInfo.fetch();
      if (!(netState.isConnected ?? true)) return;

      try {
        await firestoreReady;
        const [manifest, snap] = await Promise.all([
          readManifest(tourId),
          getDoc(doc(db, 'tours', tourId)),
        ]);

        if (!manifest || !snap.exists() || cancelled) return;

        // Invalidar si el schema del manifest es antiguo (estructura del fichero cambió)
        if (manifest.schemaVersion < MANIFEST_SCHEMA_VERSION) {
          if (!cancelled) setIsOutdated(true);
          return;
        }

        // Invalidar si el contenido del tour se actualizó después de la descarga
        const remoteVersion: number = snap.data()?.contentVersion ?? 1;
        const localVersion: number = manifest.meta.contentVersion ?? 1;
        if (!cancelled) setIsOutdated(remoteVersion > localVersion);
      } catch {
        // Firestore no accesible → no marcamos como desactualizado
      }
    };

    check();
    return () => { cancelled = true; };
  }, [tourId, isDownloaded]);

  return isOutdated;
}
