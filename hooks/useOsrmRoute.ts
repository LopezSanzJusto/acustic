// hooks/useOsrmRoute.ts
// Calcula la ruta por calles entre los puntos. Si el tour está descargado
// y el orden de los stops coincide con el guardado en el manifest, usa
// directamente la polyline cacheada (offline-friendly). Si no, hace fetch
// a OSRM siempre que haya conexión.

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { PointOfInterest } from '../data/points';
import { Coord, readManifest } from '../services/offlineManifest';
import { fetchFullRoute } from '../services/osrmService';

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function approxKm(points: PointOfInterest[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].longitude - points[i].longitude;
    const dy = points[i + 1].latitude - points[i].latitude;
    total += Math.sqrt(dx * dx + dy * dy) * 111;
  }
  return total;
}

export function useOsrmRoute(points: PointOfInterest[], tourId?: string) {
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
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      // 1. Intentar leer la polyline del manifest si el tour está descargado.
      if (tourId) {
        try {
          const manifest = await readManifest(tourId);
          if (!cancelled && manifest?.routeCache) {
            const currentIds = points.map((p) => p.id);
            if (arraysEqual(currentIds, manifest.routeCache.stopIds)) {
              setRouteCoords(manifest.routeCache.coords);
              setRouteDistance(`${approxKm(points).toFixed(2)} km`);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Sigue al fetch online
        }
      }

      // 2. Sin cache válida → fetch OSRM, pero solo si hay red.
      const net = await NetInfo.fetch();
      if (!(net.isConnected ?? false)) {
        if (!cancelled) {
          setRouteCoords([]);
          setRouteDistance(null);
          setLoading(false);
        }
        return;
      }

      const coords = await fetchFullRoute(points, controller.signal);
      if (cancelled) return;

      if (coords.length > 0) {
        setRouteCoords(coords);
        setRouteDistance(`${approxKm(points).toFixed(2)} km`);
      } else {
        setRouteCoords([]);
      }
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [points, tourId]);

  return { routeCoords, routeDistance, loading };
}
