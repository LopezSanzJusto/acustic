// hooks/useMapLogic.ts

import { useMemo } from 'react';
import { PointOfInterest } from '../data/points';

/**
 * Hook para ordenar los puntos de interés según su campo 'order'.
 * Evita reordenar en cada render si los puntos no han cambiado.
 */
export const useSortedPoints = (points: PointOfInterest[]) => {
  return useMemo(() => {
    // Creamos una copia con [...points] para no mutar el array original
    return [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [points]);
};

/**
 * Hook para preparar la estructura de datos que necesita MapViewDirections.
 * Separa Origen, Destino y Waypoints intermedios.
 */
export const useRouteDirections = (sortedPoints: PointOfInterest[]) => {
  return useMemo(() => {
    if (sortedPoints.length < 2) return null;

    const origin = sortedPoints[0];
    const destination = sortedPoints[sortedPoints.length - 1];
    
    // Los waypoints son todos los puntos MENOS el primero y el último
    const waypoints = sortedPoints.slice(1, -1).map(p => ({
      latitude: p.latitude, 
      longitude: p.longitude
    }));

    return { origin, destination, waypoints };
  }, [sortedPoints]);
};