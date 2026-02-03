// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router'; // ✅ AÑADIDO: useRouter y useSegments
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react'; // ✅ AÑADIDO: Hooks de React
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // ✅ AÑADIDO: Componentes UI

// ✅ AÑADIDO: Importaciones de Firebase
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme'; 

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // --- 🔒 NUEVO: ESTADOS DE AUTENTICACIÓN ---
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  const segments = useSegments();

  // 1. Escuchar los cambios de sesión en Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; 
  }, [initializing]);

  // 2. Tomar decisiones de navegación (El "Portero")
  useEffect(() => {
    if (initializing) return;

    // ✅ CORRECCIÓN 1: Convertimos segments[0] a String genérico para que TS no se queje
    const inAuthGroup = String(segments[0]) === 'auth';

    if (!user && !inAuthGroup) {
      // ✅ CORRECCIÓN 2: Forzamos el tipo con "as any" mientras Expo indexa el nuevo archivo
      router.replace('/auth/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [user, initializing, segments]);

  // 3. Pantalla de Carga Inicial (mientras Firebase comprueba)
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- 📱 TU CÓDIGO ORIGINAL (ahora protegido) ---
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* ✅ AÑADIDO: Pantalla de Login sin cabecera nativa */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} /> 
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// ✅ AÑADIDO: Estilos para la pantalla de carga
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});