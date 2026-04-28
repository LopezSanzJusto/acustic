// services/notificationService.ts

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import { db, auth } from './firebaseConfig';

const PROXIMITY_CHANNEL_ID = 'proximity';

const EAS_PROJECT_ID = 'ed2edee7-8731-4647-af8b-d3b988bb050f';

// Muestra la notificación aunque la app esté en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    const user = auth.currentUser;
    if (user) {
      await saveTokenToFirestore(user.uid, token);
    }

    return token;
  } catch (e) {
    console.warn('registerForPushNotifications error:', e);
    return null;
  }
}

export async function getNotificationPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function saveTokenToFirestore(userId: string, token: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { pushToken: token });
  } catch { /* ignora si el doc no existe aún */ }
}

// Alias de compatibilidad — usado por activeRouteScreen
export async function ensureNotificationPermission(): Promise<boolean> {
  const token = await registerForPushNotifications();
  return token !== null;
}

export async function ensureProximityChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(PROXIMITY_CHANNEL_ID, {
    name: 'Puntos de interés cercanos',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7B5EA7',
    showBadge: false,
  });
}

export async function notifyPointReached(pointName: string): Promise<void> {
  try {
    await ensureProximityChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Punto de interés cercano',
        body: `Estás cerca de ${pointName}. ¡Escucha la audioguía!`,
        sound: true,
      },
      trigger: Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(Date.now() + 100),
            channelId: PROXIMITY_CHANNEL_ID,
          }
        : null,
    });
  } catch { /* no-op si no hay permiso */ }
}
