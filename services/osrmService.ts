// services/osrmService.ts
// Cliente OSRM compartido entre el hook de visualización y el flujo de descarga.

import { Coord } from './offlineManifest';

interface OsrmPoint {
  latitude: number;
  longitude: number;
}

// Calcula un segmento (A → B) en modo peatonal.
async function fetchSegment(
  from: OsrmPoint,
  to: OsrmPoint,
  signal?: AbortSignal,
): Promise<Coord[]> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();

  if (!data.routes?.length) return [];
  return data.routes[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
  );
}

// Calcula la polyline completa de la ruta (A→B, B→C, …) y la devuelve plana.
// Si algún segmento falla, devuelve [] (mejor sin ruta que con ruta incompleta).
export async function fetchFullRoute(
  points: OsrmPoint[],
  signal?: AbortSignal,
): Promise<Coord[]> {
  if (points.length < 2) return [];

  try {
    const segments = await Promise.all(
      points.slice(0, -1).map((p, i) =>
        fetchSegment(p, points[i + 1], signal),
      ),
    );
    return segments.flat();
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.warn('[OSRM] fetchFullRoute error:', e?.message ?? e);
    }
    return [];
  }
}
