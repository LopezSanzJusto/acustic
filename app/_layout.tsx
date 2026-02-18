// app/_layout.tsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme'; // Si no usas este hook, puedes quitar esta línea y el ThemeProvider

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // 1. Estados de Autenticación
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const router = useRouter();
  const segments = useSegments();

  // 2. Escuchar a Firebase (Se ejecuta una sola vez al arrancar)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 3. El Portero (Lógica de Protección)
  useEffect(() => {
    if (initializing) return;

    // Verificamos si el usuario está intentando entrar en la zona de 'auth' (login/registro)
    const inAuthGroup = segments[0] === 'auth';

    if (user && inAuthGroup) {
      // CASO A: Usuario Logueado intenta ver Login -> Lo mandamos a la App (Tabs)
      router.replace('/(tabs)' as any);
    } else if (!user && !inAuthGroup) {
      // CASO B: Usuario NO Logueado intenta ver la App -> Lo mandamos al Login
      router.replace('/auth/login' as any);
    }
  }, [user, initializing, segments]);

  // 4. Pantalla de Carga (El "Escudo")
  // Importante: Mostramos esto mientras Firebase inicializa O mientras decidimos dónde mandar al usuario.
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 5. Renderizado de la App
  // Solo llegamos aquí si el usuario está en el sitio correcto
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Pantallas Principales */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Pantallas de Autenticación */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        
        {/* Otras Pantallas */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tour/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="active-tour/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});