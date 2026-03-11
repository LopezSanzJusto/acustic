// hooks/useCitySearch.ts
import { useState, useEffect } from 'react';

export interface CityResult {
  id: string;
  name: string;
  country: string;
}

export function useCitySearch(query: string) {
  const [results, setResults] = useState<CityResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    // Si la búsqueda es muy corta, limpiamos resultados y no hacemos llamada
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    // Implementación de Debounce
    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
            query
          )}&format=json&addressdetails=1&limit=8`,
          {
            // ✅ AÑADIMOS LAS CABECERAS AQUÍ
            headers: {
              // Nominatim exige un User-Agent identificativo.
              'User-Agent': 'AcusticTFGApp/1.0 (contacto@tudominio.com)', 
              'Accept': 'application/json'
            }
          }
        );

        // ✅ BUENA PRÁCTICA: Comprobamos que el servidor devolvió un 200 OK antes de parsear
        if (!response.ok) {
          const textError = await response.text();
          throw new Error(`Error de API: ${response.status} - ${textError}`);
        }

        const data = await response.json();

        // Mapeamos los datos para quedarnos solo con lo que nos importa
        const formattedResults: CityResult[] = data.map((item: any) => ({
          id: item.place_id.toString(),
          name: item.address?.city || item.address?.town || item.address?.village || item.name,
          country: item.address?.country || '',
        }))
        // Filtramos para evitar duplicados exactos
        .filter((item: CityResult, index: number, self: CityResult[]) =>
          index === self.findIndex((t) => t.name === item.name && t.country === item.country)
        );

        setResults(formattedResults);
      } catch (error) {
        console.error("Error al buscar ciudades:", error);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return { results, loadingSearch };
}