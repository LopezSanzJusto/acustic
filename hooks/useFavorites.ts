// hooks/useFavorites.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

export const useFavorites = (tourId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || !tourId) return;

    // Escuchamos el documento del usuario para saber si esta ruta está en sus favoritos
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const favs = docSnap.data().favoriteTours || [];
        setIsFavorite(favs.includes(tourId));
      }
    });

    return () => unsubscribe();
  }, [tourId]);

  // Función para dar/quitar like
  const toggleFavorite = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favoriteTours: isFavorite ? arrayRemove(tourId) : arrayUnion(tourId)
    });
  };

  return { isFavorite, toggleFavorite };
};