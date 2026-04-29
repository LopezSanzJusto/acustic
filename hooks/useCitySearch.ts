// hooks/useCitySearch.ts
import { useState, useEffect } from 'react';

export interface CityResult {
  id: string;
  name: string;
  region: string;
  country: string;
}

export function useCitySearch(query: string) {
  const [results, setResults] = useState<CityResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    // AbortController para cancelar la petición anterior si el usuario sigue escribiendo
    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        // Usamos q= (búsqueda libre) en lugar de city= para que Nominatim
        // devuelva resultados rankeados por relevancia global, y luego
        // filtramos nosotros que el nombre empiece por lo que escribió el usuario.
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&addressdetails=1&limit=20` +
          `&featuretype=city` +
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

        const normalize = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const queryNorm = normalize(query);

        const formattedResults: CityResult[] = data
          .map((item: any) => ({
            id: item.place_id.toString(),
            name: item.address?.city || item.address?.town || item.address?.village || item.name,
            region: item.address?.state || item.address?.county || '',
            country: item.address?.country || '',
          }))
          // El nombre de la ciudad tiene que EMPEZAR por lo que escribió el usuario
          .filter((item: CityResult) => normalize(item.name).startsWith(queryNorm))
          // Sin duplicados
          .filter((item: CityResult, index: number, self: CityResult[]) =>
            index === self.findIndex((t) => t.name === item.name && t.country === item.country)
          )
          .slice(0, 6);

        setResults(formattedResults);
      } catch (error: any) {
        // Ignoramos el error de abort (usuario siguió escribiendo)
        if (error.name !== 'AbortError') {
          console.error("Error al buscar ciudades:", error);
        }
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort(); // cancela la petición en vuelo si el query cambia
    };
  }, [query]);

  return { results, loadingSearch };
}