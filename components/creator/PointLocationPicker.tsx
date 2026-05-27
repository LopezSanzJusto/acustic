// components/creator/PointLocationPicker.tsx
//
// Preview compacto de la ubicación de una parada dentro del editor del
// punto. El selector real (mapa fullscreen + buscador integrado) vive
// en la pantalla `app/creator/point-map/[id].tsx`.
//
// Responsabilidades de este componente:
//   - Mostrar un mini-mapa (no interactivo) con el pin actual.
//   - Si todavía no hay coordenadas, mostrar un placeholder.
//   - Al pulsar el card, navegar a la pantalla del mapa fullscreen.
//
// La persistencia de las coordenadas la hace la pantalla del mapa
// (escribe directo a Firestore al pulsar "Confirmar"); aquí solo
// renderizamos el estado actual.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/utils/theme';

interface PointLocationPickerProps {
  pointId: string;
  latitude: number;
  longitude: number;
  /** Nombre del lugar elegido por el creador (o derivado del buscador).
   *  Sólo se usa como subtítulo del card; no se modifica desde aquí. */
  placeLabel?: string | null;
}

export function PointLocationPicker({
  pointId,
  latitude,
  longitude,
  placeLabel,
}: PointLocationPickerProps) {
  const router = useRouter();
  const hasCoords = !(latitude === 0 && longitude === 0);

  const handleOpen = () => {
    router.push(`/creator/point-map/${pointId}` as any);
  };

  return (
    <Pressable
      onPress={handleOpen}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.mapWrapper} pointerEvents="none">
        {hasCoords ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            // Mapa solo decorativo: desactivamos todo gesto.
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              pinColor={COLORS.primary}
            />
          </MapView>
        ) : (
          <View style={styles.placeholderInner}>
            <Ionicons name="map-outline" size={28} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.openBadge}>
          <Ionicons name="expand-outline" size={14} color={COLORS.white} />
          <Text style={styles.openBadgeText}>Abrir mapa</Text>
        </View>
      </View>

      <View style={styles.info}>
        {hasCoords ? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              Ubicación seleccionada
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {placeLabel?.trim().length ? placeLabel : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Selecciona la ubicación</Text>
            <Text style={styles.subtitle}>
              Toca para abrir el mapa y elegir el lugar
            </Text>
          </>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    padding: 10,
    marginBottom: 16,
  },
  mapWrapper: {
    width: 78,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: { width: '100%', height: '100%' },
  placeholderInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  openBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  openBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
});
