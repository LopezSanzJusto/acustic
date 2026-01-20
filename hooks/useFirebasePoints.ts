// hooks/useFirebasePoints.ts

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { PointOfInterest } from '../data/points';

export function useFirebasePoints() {
  const [points, setPoints] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPoints() {
      try {
        const querySnapshot = await getDocs(collection(db, "points"));
        const pointsArray: PointOfInterest[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          pointsArray.push({
            id: data.id,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            // Por ahora usamos el nombre del archivo, luego usaremos URL de Storage
            audio: data.audio 
          } as PointOfInterest);
        });

        setPoints(pointsArray);
      } catch (error) {
        console.error("Error cargando puntos desde Firebase:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, []);

  return { points, loading };
}