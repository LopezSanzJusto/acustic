// app/creator/publish.tsx
//
// Pantalla 3 del wizard "Estás a un paso": en vez de un resumen + botón
// "Ver como en Explora", redirigimos directamente al detalle del tour en
// modo preview+publishMode. Así el creador ve EXACTAMENTE lo que verá el
// usuario final (portada, carrusel, info, mapa, paradas, etc.) y abajo
// del todo encuentra el botón "Publicar audioguía".
//
// El propio detalle del tour (app/tour/[id].tsx) gestiona la publicación
// cuando recibe `?preview=1&publishMode=1`.

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCreator } from '@/contexts/CreatorContext';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorPublishScreen() {
  const router = useRouter();
  const { draft, loading, error, creatorId } = useCreator();

  useEffect(() => {
    if (!draft?.id) return;
    // `replace` para que al volver desde el detalle el creador vuelva a la
    // pantalla 2 del wizard (points), no a una pantalla de publish vacía.
    router.replace(`/tour/${draft.id}?preview=1&publishMode=1` as any);
  }, [draft?.id, router]);

  return (
    <View style={styles.center}>
      <Stack.Screen options={{ headerShown: false }} />
      {!creatorId ? (
        <Text style={styles.errorText}>Tienes que iniciar sesión para publicar.</Text>
      ) : error ? (
        <Text style={styles.errorText}>
          {error?.message ?? 'No se pudo cargar el borrador.'}
        </Text>
      ) : (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.muted}>
            {loading ? 'Cargando…' : 'Abriendo vista previa…'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  muted: { fontFamily: FONTS.regular, color: COLORS.muted },
  errorText: {
    fontFamily: FONTS.medium,
    color: COLORS.error,
    textAlign: 'center',
  },
});
