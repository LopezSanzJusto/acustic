// hooks/useFavorites.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
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

      firestoreReady.then(() => {
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
      });
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
