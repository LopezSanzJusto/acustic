// hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

export type PermStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionsState {
  locationForeground: PermStatus;
  locationBackground: PermStatus;
}

export function usePermissions() {
  const [perms, setPerms] = useState<PermissionsState>({
    locationForeground: 'undetermined',
    locationBackground: 'undetermined',
  });

  const refresh = async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    setPerms({
      locationForeground: fg.status as PermStatus,
      locationBackground: bg.status as PermStatus,
    });
  };

  // Lee permisos al montar y cada vez que el usuario vuelve de Ajustes del sistema
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  const toggleForegroundLocation = async () => {
    if (perms.locationForeground === 'undetermined') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: status as PermStatus }));
    } else {
      // granted o denied: no se puede revocar desde la app → abrimos Ajustes
      Linking.openSettings();
    }
  };

  const toggleBackgroundLocation = async () => {
    if (perms.locationBackground === 'granted') {
      Linking.openSettings();
      return;
    }
    // Necesita foreground primero
    if (perms.locationForeground !== 'granted') {
      const fgRes = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: fgRes.status as PermStatus }));
      if (fgRes.status !== 'granted') return;
    }
    if (perms.locationBackground === 'denied') {
      Linking.openSettings();
      return;
    }
    const { status } = await Location.requestBackgroundPermissionsAsync();
    setPerms(p => ({ ...p, locationBackground: status as PermStatus }));
  };

  return { perms, toggleForegroundLocation, toggleBackgroundLocation };
}
