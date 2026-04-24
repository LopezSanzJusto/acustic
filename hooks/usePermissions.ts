// hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
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

  const refresh = useCallback(async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    let bgStatus: PermStatus = 'denied';
    try {
      const bg = await Location.getBackgroundPermissionsAsync();
      bgStatus = bg.status as PermStatus;
    } catch {
      // ACCESS_BACKGROUND_LOCATION no está en el manifest actual.
      // Estará disponible tras el próximo rebuild con app.json actualizado.
    }
    setPerms({
      locationForeground: fg.status as PermStatus,
      locationBackground: bgStatus,
    });
  }, []);

  useEffect(() => {
    refresh();

    // Android tarda ~200-300 ms en actualizar el estado del permiso tras volver de Ajustes,
    // por eso el setTimeout. Sin él el refresh lee el estado anterior.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setTimeout(refresh, 300);
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const toggleForegroundLocation = async () => {
    if (perms.locationForeground === 'undetermined') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: status as PermStatus }));
    } else {
      // granted o denied: no se puede cambiar desde la app → abrimos Ajustes
      Linking.openSettings();
    }
  };

  const toggleBackgroundLocation = async () => {
    if (perms.locationBackground === 'granted') {
      // Ya concedido → Ajustes para revocarlo
      Linking.openSettings();
      return;
    }
    // Necesita foreground concedido primero
    if (perms.locationForeground !== 'granted') {
      const fgRes = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: fgRes.status as PermStatus }));
      if (fgRes.status !== 'granted') return;
    }
    // Intentamos pedir el permiso siempre — Android decide si muestra diálogo o manda a Ajustes
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        // Android denegó o requiere ir a Ajustes → "Permitir siempre"
        Linking.openSettings();
      }
      setPerms(p => ({ ...p, locationBackground: status as PermStatus }));
    } catch {
      Linking.openSettings();
    }
  };

  return { perms, toggleForegroundLocation, toggleBackgroundLocation };
}
