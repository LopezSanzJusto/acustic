// hooks/useFavorites.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

export const useFavorites = (tourId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!tourId) return;

    let unsubSnap: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnap?.();
      unsubSnap = undefined;

      if (!user) {
        setIsFavorite(false);
        return;
      }

      (async () => {
        // Sin red no montamos el listener: el SDK lanzaría "Could not load bundle"
        // como unhandled rejection. Mantenemos el último valor conocido en memoria.
        const net = await NetInfo.fetch();
        if (!(net.isConnected ?? false)) return;

        await firestoreReady;
        unsubSnap = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (!snap || !snap.exists()) return;
            const favs = snap.data()?.favoriteTours || [];
            setIsFavorite(favs.includes(tourId));
          },
          (err) => {
            if (err?.code !== 'firestore/permission-denied') {
              console.log('useFavorites onSnapshot error →', err?.code, err?.message);
            }
          }
        );
      })();
    });

    return () => {
      unsubSnap?.();
      unsubAuth();
    };
  }, [tourId]);

  const toggleFavorite = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      router.push('/welcome' as any);
      return;
    }
    const net = await NetInfo.fetch();
    if (!(net.isConnected ?? false)) {
      Alert.alert('Sin conexión', 'Necesitas conexión para cambiar tus favoritos.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        favoriteTours: isFavorite ? arrayRemove(tourId) : arrayUnion(tourId),
      });
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  return { isFavorite, toggleFavorite };
};
