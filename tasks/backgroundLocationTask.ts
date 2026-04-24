// tasks/backgroundLocationTask.ts
// Tarea de fondo registrada con expo-task-manager.
// Este fichero DEBE importarse en _layout.tsx (fuera de cualquier componente)
// para que la tarea quede registrada antes de que el SO la invoque.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyPointReached } from '../services/notificationService';

export const BACKGROUND_LOCATION_TASK = 'bg-location-task';
export const ACTIVE_POIS_KEY = 'bg_active_pois';
export const BG_PLAYED_POINTS_KEY = 'bg_played_points';
export const BG_NOTIF_ENABLED_KEY = 'bg_notif_enabled';

const RADIUS_M = 15;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.warn('[BgTask] error:', error.message);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const { latitude, longitude } = locations[0].coords;

  try {
    const poisJson = await AsyncStorage.getItem(ACTIVE_POIS_KEY);
    if (!poisJson) return;

    const pois: Array<{ id: string; name: string; latitude: number; longitude: number }> =
      JSON.parse(poisJson);

    const playedJson = await AsyncStorage.getItem(BG_PLAYED_POINTS_KEY);
    const played: string[] = playedJson ? JSON.parse(playedJson) : [];

    const notifEnabled = await AsyncStorage.getItem(BG_NOTIF_ENABLED_KEY);
    const shouldNotify = notifEnabled !== 'false';

    for (const poi of pois) {
      if (played.includes(poi.id)) continue;
      const dist = haversineMeters(latitude, longitude, poi.latitude, poi.longitude);
      if (dist <= RADIUS_M) {
        played.push(poi.id);
        await AsyncStorage.setItem(BG_PLAYED_POINTS_KEY, JSON.stringify(played));
        if (shouldNotify) await notifyPointReached(poi.name);
        break; // una notificación por tick de localización
      }
    }
  } catch (e) {
    console.warn('[BgTask] proximity check failed:', e);
  }
});
