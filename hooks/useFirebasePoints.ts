// hooks/useFirebasePoints.ts

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { db, firestoreReady } from '../services/firebaseConfig';
import { PointOfInterest } from '../data/points';
import { readManifest, type StopAsset } from '../services/offlineManifest';

function stopsToPoints(stops: StopAsset[]): PointOfInterest[] {
  return stops.map((s) => ({
    id: s.stopId,
    name: s.name,
    order: s.order,
    latitude: s.latitude,
    longitude: s.longitude,
    audio: s.audioUrl,
    image: s.imageUrl,
  } as unknown as PointOfInterest));
}

export function useFirebasePoints(tourId: string) {
  const [points, setPoints] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPoints() {
      if (!tourId) return;

      // Comprueba conexión en el momento del fetch (no reactivo para evitar re-renders)
      const netState = await NetInfo.fetch();
      const offline = !(netState.isConnected ?? true);

      if (offline) {
        // Sin red → leer del manifest si el tour está descargado
        const manifest = await readManifest(tourId);
        if (manifest) setPoints(stopsToPoints(manifest.stops));
        setLoading(false);
        return;
      }

      // Con red → Firestore
      await firestoreReady;
      try {
        const pointsRef = collection(db, 'tours', tourId, 'points');
        const q = query(pointsRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const pointsArray: PointOfInterest[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: String(data.name),
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            audio: String(data.audioUrl),
            image: String(data.imageUrl),
            order: Number(data.order),
          } as unknown as PointOfInterest;
        });
        setPoints(pointsArray);
      } catch (error) {
        // Firestore falló (sin caché disponible) → último recurso: manifest
        console.error('Error cargando puntos:', error);
        const manifest = await readManifest(tourId);
        if (manifest) setPoints(stopsToPoints(manifest.stops));
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [tourId]);

  return { points, loading };
}
