// hooks/useFirebasePoints.ts

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from '@react-native-firebase/firestore'; 
import { db, firestoreReady } from '../services/firebaseConfig';
import { PointOfInterest } from '../data/points';

export function useFirebasePoints(tourId: string) { 
  const [points, setPoints] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPoints() {
      if (!tourId) return;
      await firestoreReady;
      try {
        // Accedemos a la ruta: tours -> {tourId} -> points
        const pointsRef = collection(db, "tours", tourId, "points");
        // Ordenamos por el campo 'order' que configuraste en Firestore
        const q = query(pointsRef, orderBy("order", "asc")); 
        
        const querySnapshot = await getDocs(q);
        const pointsArray: PointOfInterest[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          pointsArray.push({
            id: doc.id, 
            name: String(data.name),
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            audio: String(data.audioUrl), // Mapeamos audioUrl de Firestore a 'audio'
            image: String(data.imageUrl),
            order: Number(data.order),
          } as unknown as PointOfInterest);
        });

        setPoints(pointsArray);
      } catch (error) {
        console.error("Error cargando puntos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [tourId]); 

  return { points, loading };
}