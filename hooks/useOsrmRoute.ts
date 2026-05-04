// hooks/useOsrmRoute.ts
// Calcula la ruta por calles usando OSRM, segmento a segmento (A→B, B→C, …)
// para evitar desvíos por optimización global del grafo peatonal.

import { useState, useEffect } from 'react';
import { PointOfInterest } from '../data/points';

interface Coord {
  latitude: number;
  longitude: number;
}

async function fetchSegment(
  from: PointOfInterest,
  to: PointOfInterest,
  signal: AbortSignal,
): Promise<Coord[]> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();

  if (!data.routes?.length) return [];
  return data.routes[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
  );
}

export function useOsrmRoute(points: PointOfInterest[]) {
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (points.length < 2) {
      setRouteCoords([]);
      setRouteDistance(null);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // Lanzamos todos los segmentos en paralelo
        const segments = await Promise.all(
          points.slice(0, -1).map((p, i) =>
            fetchSegment(p, points[i + 1], controller.signal),
          ),
        );

        const allCoords = segments.flat();
        if (allCoords.length > 0) {
          setRouteCoords(allCoords);
          // Distancia aproximada sumando vuelo entre puntos (solo para el label)
          let totalKm = 0;
          for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].longitude - points[i].longitude;
            const dy = points[i + 1].latitude - points[i].latitude;
            totalKm += Math.sqrt(dx * dx + dy * dy) * 111;
          }
          setRouteDistance(`${totalKm.toFixed(2)} km`);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn('[OSRM] error:', error?.message ?? error);
          setRouteCoords([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
    return () => controller.abort();
  }, [points]);

  return { routeCoords, routeDistance, loading };
}
