// hooks/useTourProgress.ts

import { useEffect } from 'react';
import { setDoc, doc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

const PENDING_KEY = '@pending_progress';

type PendingMap = Record<string, number>;

async function readPending(): Promise<PendingMap> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingMap) : {};
  } catch {
    return {};
  }
}

async function writePending(map: PendingMap): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(map));
}

// Vuelca a Firestore todo el progreso encolado en AsyncStorage. Si alguna
// escritura falla, mantiene esa entrada para reintentar más adelante.
async function flushPendingProgress(): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const pending = await readPending();
  const ids = Object.keys(pending);
  if (ids.length === 0) return;

  const net = await NetInfo.fetch();
  if (!(net.isConnected ?? false)) return;

  await firestoreReady;

  const remaining: PendingMap = {};
  for (const tourId of ids) {
    try {
      await setDoc(
        doc(db, 'users', userId),
        { progress: { [tourId]: pending[tourId] } },
        { merge: true },
      );
    } catch (e) {
      remaining[tourId] = pending[tourId];
      console.warn('[progress] flush falló para', tourId, e);
    }
  }
  await writePending(remaining);
}

export const useTourProgress = () => {
  // Flush oportunista: al montar, si hay red, intentamos vaciar la cola.
  useEffect(() => {
    flushPendingProgress().catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) flushPendingProgress().catch(() => {});
    });
    return unsubscribe;
  }, []);

  const saveProgress = async (tourId: string, percentage: number) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Sin red → encolar y salir. Nunca tocamos Firestore offline porque
    // el SDK lanza "LoadBundleFromServerRequestError" como unhandled rejection.
    const net = await NetInfo.fetch();
    if (!(net.isConnected ?? false)) {
      const pending = await readPending();
      pending[tourId] = percentage;
      await writePending(pending);
      return;
    }

    try {
      await firestoreReady;
      await setDoc(
        doc(db, 'users', userId),
        { progress: { [tourId]: percentage } },
        { merge: true },
      );

      // Si esta escritura fue OK y había una pendiente para este tour, límpiala.
      const pending = await readPending();
      if (pending[tourId] !== undefined) {
        delete pending[tourId];
        await writePending(pending);
      }
    } catch (error) {
      // Falló aunque NetInfo dijera "online" → encolar para reintentar
      const pending = await readPending();
      pending[tourId] = percentage;
      await writePending(pending);
      console.warn('[progress] setDoc falló, encolado:', error);
    }
  };

  return { saveProgress };
};
