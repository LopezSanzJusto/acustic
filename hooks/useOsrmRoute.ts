// hooks/useOsrmRoute.ts
// Calcula la ruta real por calles usando OSRM (gratuito, sin API key, OpenStreetMap)

import { useState, useEffect } from 'react';
import { PointOfInterest } from '../data/points';

interface Coord {
  latitude: number;
  longitude: number;
}

export function useOsrmRoute(points: PointOfInterest[]) {
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (points.length < 2) {
      setRouteCoords([]);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      setLoading(true);
      try {
        // OSRM recibe coordenadas como lng,lat separadas por ;
        const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';');
        const url =
          `https://router.project-osrm.org/route/v1/foot/${coords}` +
          `?overview=full&geometries=geojson`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        const data = await res.json();

        if (data.routes?.length > 0) {
          // OSRM devuelve [lng, lat] — invertimos a { latitude, longitude }
          const coords: Coord[] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
          );
          setRouteCoords(coords);
          const km = (data.routes[0].distance / 1000).toFixed(2);
          setRouteDistance(`${km} km`);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn('OSRM route error, usando línea recta como fallback:', error);
          // Fallback: línea recta entre puntos
          setRouteCoords(points.map(p => ({ latitude: p.latitude, longitude: p.longitude })));
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
