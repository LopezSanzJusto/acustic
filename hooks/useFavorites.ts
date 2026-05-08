// hooks/useFavorites.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

export const useFavorites = (tourId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || !tourId) return;

    let unsubscribe: (() => void) | undefined;

    firestoreReady.then(() => {
      unsubscribe = onSnapshot(doc(db, 'users', userId), (snap) => {
        if (snap.exists()) {
          const favs = snap.data().favoriteTours || [];
          setIsFavorite(favs.includes(tourId));
        }
      });
    });

    return () => { unsubscribe?.(); };
  }, [tourId]);

  const toggleFavorite = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
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
