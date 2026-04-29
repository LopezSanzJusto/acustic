// app/_layout.tsx

// Registra la tarea de localización en segundo plano ANTES de que el SO la invoque
import '../tasks/backgroundLocationTask';

import React, { useEffect, useState, useRef } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RouteProvider } from '../hooks/useCustomRoute';
import * as Notifications from 'expo-notifications';
import { ensureProximityChannel } from '../services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PlaybackService } from '../services/playbackService';

// Registra el servicio de reproducción antes de que el SO lo invoque en segundo plano
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const router = useRouter();
  const segments = useSegments();
  const notifListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    const initPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
      } catch (e: any) {
        // "already been initialized" es esperado en hot-reloads — no es un error real
        if (!e?.message?.includes('already been initialized')) {
          console.warn('[RNTP] setup failed:', e);
          return;
        }
      }
      // updateOptions siempre se ejecuta, tanto en primera carga como en re-init
      try {
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
          progressUpdateEventInterval: 1,
        });
      } catch (e) {
        console.warn('[RNTP] updateOptions failed:', e);
      }
    };
    initPlayer();
  }, []);

  useEffect(() => {
    ensureProximityChannel();
    notifListener.current = Notifications.addNotificationReceivedListener(_notification => {
      // notificación recibida — el handler en notificationService ya la muestra
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(_response => {
      // aquí se podría navegar a una ruta según el payload
    });
    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';
    const inTabGroup = segments[0] === '(tabs)';
    const isGuestAllowed = segments[0] === 'tour' || segments[0] === 'modal';

    if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    } else if (!user && !inAuthGroup && !inTabGroup && !isGuestAllowed) {
      router.replace('/welcome' as any);
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RouteProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/user-info" options={{ headerShown: false }} />
            <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="auth/email-sent" options={{ headerShown: false }} />
            <Stack.Screen name="profile/change-password" options={{ headerShown: false }} />
            <Stack.Screen name="profile/password-sent" options={{ headerShown: false }} />
            <Stack.Screen name="profile/privacy" options={{ headerShown: false }} />
            <Stack.Screen name="profile/faq" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="tour/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="active-tour/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          </Stack>
        </RouteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
