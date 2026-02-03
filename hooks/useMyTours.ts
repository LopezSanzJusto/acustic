// hooks/useMyTours.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

export function useMyTours() {
  const [purchasedTours, setPurchasedTours] = useState<any[]>([]);
  const [favoriteTours, setFavoriteTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Escuchamos el perfil del usuario en tiempo real
    const unsubscribe = onSnapshot(doc(db, 'users', userId), async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const purchasedIds = userData.purchasedTours || [];
        const favoriteIds = userData.favoriteTours || [];

        // Función para traer los tours completos usando sus IDs
        const fetchToursByIds = async (ids: string[]) => {
          if (ids.length === 0) return [];
          // Firestore permite buscar múltiples IDs a la vez con "in"
          const q = query(collection(db, "tours"), where(documentId(), "in", ids));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        // Cargamos los datos de las rutas
        const [purchases, favorites] = await Promise.all([
          fetchToursByIds(purchasedIds),
          fetchToursByIds(favoriteIds)
        ]);

        setPurchasedTours(purchases);
        setFavoriteTours(favorites);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { purchasedTours, favoriteTours, loading };
}