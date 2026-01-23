// hooks/useFirebaseTours.ts

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function useFirebaseTours() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTours() {
      try {
        const querySnapshot = await getDocs(collection(db, "tours"));
        const toursArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTours(toursArray);
      } catch (error) {
        console.error("Error cargando tours:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  return { tours, loading };
}