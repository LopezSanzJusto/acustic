// hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import {
  registerForPushNotifications,
  getNotificationPermissionStatus,
} from '../services/notificationService';

export type PermStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionsState {
  locationForeground: PermStatus;
  locationBackground: PermStatus;
  notifications: PermStatus;
}

export function usePermissions() {
  const [perms, setPerms] = useState<PermissionsState>({
    locationForeground: 'undetermined',
    locationBackground: 'undetermined',
    notifications: 'undetermined',
  });

  const refresh = useCallback(async () => {
    const fg = await Location.getForegroundPermissionsAsync();

    let bgStatus: PermStatus = 'denied';
    try {
      const bg = await Location.getBackgroundPermissionsAsync();
      bgStatus = bg.status as PermStatus;
    } catch { /* manifest sin ACCESS_BACKGROUND_LOCATION */ }

    const notifStatus = await getNotificationPermissionStatus();

    setPerms({
      locationForeground: fg.status as PermStatus,
      locationBackground: bgStatus,
      notifications: notifStatus as PermStatus,
    });
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setTimeout(refresh, 300);
    });
    return () => sub.remove();
  }, [refresh]);

  const toggleForegroundLocation = async () => {
    if (perms.locationForeground === 'undetermined') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: status as PermStatus }));
    } else {
      Linking.openSettings();
    }
  };

  const toggleBackgroundLocation = async () => {
    if (perms.locationBackground === 'granted') {
      Linking.openSettings();
      return;
    }
    if (perms.locationForeground !== 'granted') {
      const fgRes = await Location.requestForegroundPermissionsAsync();
      setPerms(p => ({ ...p, locationForeground: fgRes.status as PermStatus }));
      if (fgRes.status !== 'granted') return;
    }
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') Linking.openSettings();
      setPerms(p => ({ ...p, locationBackground: status as PermStatus }));
    } catch {
      Linking.openSettings();
    }
  };

  const toggleNotifications = async () => {
    if (perms.notifications === 'granted') {
      Linking.openSettings();
      return;
    }
    const token = await registerForPushNotifications();
    const newStatus: PermStatus = token ? 'granted' : 'denied';
    setPerms(p => ({ ...p, notifications: newStatus }));
    if (!token) Linking.openSettings();
  };

  return {
    perms,
    toggleForegroundLocation,
    toggleBackgroundLocation,
    toggleNotifications,
  };
}
