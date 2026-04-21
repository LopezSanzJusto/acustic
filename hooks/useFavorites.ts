// hooks/useFavorites.ts

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

export const useFavorites = (tourId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const userId = auth.currentUser?.uid;
    if (!userId || !tourId) return;

    firestoreReady.then(async () => {
      if (cancelled) return;
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!cancelled && snap.exists()) {
          const favs = snap.data().favoriteTours || [];
          setIsFavorite(favs.includes(tourId));
        }
      } catch { /* silent */ }
    });

    return () => { cancelled = true; };
  }, [tourId]);

  const toggleFavorite = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        favoriteTours: isFavorite ? arrayRemove(tourId) : arrayUnion(tourId),
      });
      setIsFavorite(prev => !prev);
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  return { isFavorite, toggleFavorite };
};
