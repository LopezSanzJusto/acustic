// app/creator/_layout.tsx
//
// Layout anidado del Panel de creador.
//   - Envuelve todas las pantallas `/creator/*` en `<CreatorProvider>` para
//     que compartan el mismo draft activo.
//   - Define un header común con título "Panel de creador" y flecha atrás
//     en color primary (estilo del Figma).

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreatorProvider } from '@/contexts/CreatorContext';
import { COLORS, FONTS } from '@/utils/theme';

function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/trips' as any))}
      hitSlop={12}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 12 })}
    >
      <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
    </Pressable>
  );
}

export default function CreatorLayout() {
  return (
    <CreatorProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: 'Panel de creador',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: COLORS.primary,
            fontFamily: FONTS.bold,
            fontSize: 18,
          },
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.primary,
          headerLeft: () => <BackButton />,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="basics" />
        <Stack.Screen name="points" />
      </Stack>
    </CreatorProvider>
  );
}
