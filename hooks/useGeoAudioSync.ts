// hooks/useGeoAudioSync.ts

import { useEffect, useMemo } from 'react';
import { PointOfInterest } from '../data/points';
import { isWithinRadius } from '../services/proximityService';

interface UseGeoAudioSyncProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
  // Estados de carga para evitar disparar lógica antes de tiempo
  isPreloading: boolean;
  pointsLoading: boolean;
  // Función para controlar el audio
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

  // 1. Lógica Pura: Determinar si estamos cerca de algún punto
  // Esto ahora es fácil de testear unitariamente
  const gpsActivePoint = useMemo(() => {
    if (!location || points.length === 0) return null;

    // Buscamos el primer punto que cumpla la condición de radio
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

  // 2. Efecto Secundario: Sincronizar con el Reproductor de Audio
  useEffect(() => {
    // Si todavía estamos cargando datos o audios, no hacemos nada
    if (isPreloading || pointsLoading) return;

    // Caso A: Si no estamos en la zona de ningún punto, NO hacemos nada.
    // Esto evita que el reproductor se oculte o cambie a null.
    if (!gpsActivePoint) {
      return;
    }

    // Caso B: Estamos dentro de una zona, buscamos el índice y activamos
    const index = points.findIndex(p => p.id === gpsActivePoint.id);
    if (index !== -1) {
      setActivePointIndex(index);
    }
  }, [gpsActivePoint, isPreloading, pointsLoading, points, setActivePointIndex]);

  // Devolvemos el punto activo por si la UI necesita mostrar algo específico (ej: una notificación)
  return { gpsActivePoint };
};