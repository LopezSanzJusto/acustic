// app/_layout.tsx

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RouteProvider } from '../hooks/useCustomRoute';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  
  const router = useRouter();
  const segments = useSegments();
  const notifListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Escucha notificaciones en primer plano
    notifListener.current = Notifications.addNotificationReceivedListener(_notification => {
      // notificación recibida — el handler en notificationService ya la muestra
    });
    // Escucha tap en notificación
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
    // Rutas que un invitado también puede visitar sin sesión (solo salta el welcome al pulsar "Comenzar" o "Comprar")
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
    // ✨ NUEVO: Envolvemos TODO con el GestureHandler (OBLIGATORIO para Drag & Drop)
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