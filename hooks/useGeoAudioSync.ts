// hooks/useGeoAudioSync.ts

import { useEffect, useMemo, useRef } from 'react';
import { PointOfInterest } from '../data/points';
import { isWithinRadius } from '../services/proximityService';

interface UseGeoAudioSyncProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
  isPreloading: boolean;
  pointsLoading: boolean;
  setActivePointIndex: (index: number | null) => void;
}

export const useGeoAudioSync = ({
  location,
  points,
  radius,
  isPreloading,
  pointsLoading,
  setActivePointIndex
}: UseGeoAudioSyncProps) => {

  // ✅ 1. "Memoria" para no disparar el mismo punto múltiples veces
  const playedPoints = useRef<Set<string>>(new Set());

  const gpsActivePoint = useMemo(() => {
    if (!location || points.length === 0) return null;

    return (
      points.find((p) =>
        isWithinRadius(
          location,
          { latitude: p.latitude, longitude: p.longitude },
          radius
        )
      ) || null
    );
  }, [location, points, radius]);

  useEffect(() => {
    if (isPreloading || pointsLoading) return;

    // ✅ 2. CORRECCIÓN CRÍTICA: Si el GPS no detecta nada cerca, NO hacemos setActivePointIndex(null).
    // Simplemente ignoramos la acción. Esto evita pelearnos con el autoSelectFirst de useAudio.
    if (!gpsActivePoint) {
      return;
    }

    // ✅ 3. Si ya pasamos por aquí y activamos el audio, no lo volvemos a hacer.
    if (playedPoints.current.has(gpsActivePoint.id)) {
      return;
    }

    const index = points.findIndex(p => p.id === gpsActivePoint.id);
    if (index !== -1) {
      // Registramos que este punto ya disparó el evento
      playedPoints.current.add(gpsActivePoint.id);
      setActivePointIndex(index);
    }
  }, [gpsActivePoint, isPreloading, pointsLoading, points, setActivePointIndex]);

  return { gpsActivePoint };
};