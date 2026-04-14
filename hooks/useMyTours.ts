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

        // ✨ AQUÍ RECUPERAMOS EL PROGRESO: Extraemos el diccionario de Firebase
        // Tendrá una forma así: { "id_ruta_1": 45.6, "id_ruta_2": 12.3 }
        const userProgressMap = userData.progress || {};

        // Función para traer los tours completos
        const fetchToursByIds = async (ids: string[]) => {
          if (ids.length === 0) return [];
          const q = query(collection(db, "tours"), where(documentId(), "in", ids));
          const snapshot = await getDocs(q);
          
          return snapshot.docs.map(doc => {
            const tourId = doc.id;
            return { 
              id: tourId, 
              ...doc.data(),
              // ✨ INYECCIÓN VITAL: Le pasamos a la tarjeta el porcentaje guardado.
              // Si el usuario nunca ha empezado esta ruta, le pasamos un 0.
              progressPercentage: userProgressMap[tourId] || 0
            };
          });
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