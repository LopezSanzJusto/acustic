import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineManager } from '@maplibre/maplibre-react-native';
import { TourManifest } from './offlineManifest';

// Fuente de tiles gratuita sin API key — OpenFreeMap (datos OSM)
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const packIdKey = (tourId: string) => `@offline_map_pack:${tourId}`;

// LngLatBounds = [west, south, east, north]
function tourBounds(manifest: TourManifest): [number, number, number, number] {
  const lons = manifest.stops.map((s) => s.longitude);
  const lats = manifest.stops.map((s) => s.latitude);
  const pad = 0.008; // ~800 m de margen
  return [
    Math.min(...lons) - pad,
    Math.min(...lats) - pad,
    Math.max(...lons) + pad,
    Math.max(...lats) + pad,
  ];
}

/**
 * Descarga los tiles del mapa para el área del tour.
 * onProgress recibe un valor 0-1 mientras descarga.
 * Resuelve cuando el pack está al 100 %.
 */
export function downloadOfflineMap(
  tourId: string,
  manifest: TourManifest,
  onProgress: (progress: number) => void,
): Promise<void> {
  const bounds = tourBounds(manifest);

  return new Promise((resolve, reject) => {
    OfflineManager.createPack(
      {
        mapStyle: MAP_STYLE_URL,
        bounds,
        minZoom: 14,
        maxZoom: 18,
        metadata: { tourId },
      },
      async (pack, status) => {
        const pct: number = status?.percentage ?? 0;
        onProgress(pct / 100);
        if (pct >= 100) {
          // Guardar el UUID del pack para poder borrarlo después (deletePack toma id, no tourId)
          await AsyncStorage.setItem(packIdKey(tourId), pack.id);
          resolve();
        }
      },
      (_pack, error) => {
        reject(new Error(error?.message ?? 'Map tile download failed'));
      },
    );
  });
}

/**
 * Borra el pack offline de tiles. No lanza si el pack no existe.
 */
export async function deleteOfflineMap(tourId: string): Promise<void> {
  try {
    const packId = await AsyncStorage.getItem(packIdKey(tourId));
    if (packId) {
      await OfflineManager.deletePack(packId);
      await AsyncStorage.removeItem(packIdKey(tourId));
    }
  } catch {
    // Pack inexistente o error nativo — ignorar
  }
}
