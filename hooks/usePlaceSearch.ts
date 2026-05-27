// hooks/usePlaceSearch.ts
//
// Búsqueda libre de lugares (POIs, monumentos, calles, plazas…) sobre
// Nominatim de OpenStreetMap. Sigue el mismo patrón que `useCitySearch`
// pero sin filtrar por tipo de feature ni por "empieza por": devuelve
// resultados rankeados por relevancia de Nominatim tal cual.
//
// Por qué Nominatim y no Google Places:
//   - No requiere API key ni billing (Places cobra desde la primera
//     llamada con el nuevo SKU "Place Details").
//   - El proyecto ya lo usa para el buscador de ciudades.
//   - Para audioguías turísticas (que es lo que estamos creando aquí),
//     los POIs y monumentos están bien indexados en OSM.
//
// Política de uso de Nominatim: 1 req/s por IP y User-Agent identificable.
// Para respetarla, debounceamos 400ms entre teclas (igual que useCitySearch).

import { useEffect, useState } from 'react';

export interface PlaceResult {
  /** place_id de Nominatim, lo guardamos en `TourPoint.placeId` cuando el
   *  punto vino del autocomplete (null si el usuario movió el pin a mano). */
  placeId: string;
  /** Nombre corto del lugar: prioriza `name`; cae a la primera parte del
   *  display_name si no hay `name`. */
  name: string;
  /** Dirección/contexto que se muestra debajo del nombre. */
  displayName: string;
  latitude: number;
  longitude: number;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `${NOMINATIM_BASE}` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&addressdetails=1&namedetails=1&limit=8` +
          `&accept-language=es,en`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'AcusticTFGApp/1.0 (contacto@tudominio.com)',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const formatted: PlaceResult[] = data.map((item: any) => {
          // Preferimos `namedetails.name`; si no, primer trozo de display_name.
          const fallbackName = (item.display_name as string)?.split(',')[0]?.trim() ?? '';
          const name =
            item.namedetails?.name ??
            item.name ??
            fallbackName;
          return {
            placeId: String(item.place_id),
            name,
            displayName: item.display_name as string,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        });

        setResults(formatted);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Error al buscar lugares:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, loading };
}
