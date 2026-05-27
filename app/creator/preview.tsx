// app/creator/preview.tsx
//
// Vista previa del audio tour en construcción: muestra el mapa con
// las paradas conectadas (ruta OSRM por calzada), igual que la vista
// real del tour publicado. Sólo entra el creador desde el botón
// "Preview" de la pantalla 2 del wizard.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreator } from '@/contexts/CreatorContext';
import { MapDisplay } from '@/components/mapDisplay';
import { COLORS, FONTS } from '@/utils/theme';
import type { PointOfInterest } from '@/data/points';
import type { TourPoint } from '@/types/tour';

// Considera "sin ubicación" cuando lat y lng son ambos 0 (sentinel del
// creator) o cuando no son números válidos.
function hasValidCoords(p: TourPoint) {
  const { latitude: la, longitude: lo } = p;
  if (typeof la !== 'number' || typeof lo !== 'number') return false;
  if (Number.isNaN(la) || Number.isNaN(lo)) return false;
  if (la === 0 && lo === 0) return false;
  return true;
}

function toPOI(p: TourPoint, idx: number): PointOfInterest {
  return {
    id: p.id,
    name: p.name?.trim() || `Parada ${idx + 1}`,
    latitude: p.latitude,
    longitude: p.longitude,
    audio: p.audioUrl ?? '',
    image: p.imageUrl ?? '',
    order: typeof p.order === 'number' ? p.order : idx,
  };
}

export default function CreatorPreviewScreen() {
  const router = useRouter();
  const { points } = useCreator();

  // Filtramos paradas sin coordenadas y las ordenamos por `order` (los
  // points del draft ya vienen ordenados desde el context, pero el sort
  // explícito es barato y nos protege ante posibles desincronías).
  const mapPoints = useMemo<PointOfInterest[]>(() => {
    return [...points]
      .filter(hasValidCoords)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(toPOI);
  }, [points]);

  const totalPoints = points.length;
  const validPoints = mapPoints.length;
  const missingCoords = totalPoints - validPoints;

  return (
    <SafeAreaView style={styles.flex}>
      {/* El layout del wizard pinta un header global; lo ocultamos aquí
          porque queremos el mapa fullscreen. */}
      <Stack.Screen options={{ headerShown: false }} />

      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.mapWrapper}>
        {validPoints === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={56} color={COLORS.placeholder} />
            <Text style={styles.emptyTitle}>Aún no hay paradas con ubicación</Text>
            <Text style={styles.emptySubtitle}>
              Añade al menos una parada con coordenadas para ver la vista previa
              del recorrido en el mapa.
            </Text>
          </View>
        ) : (
          <MapDisplay
            location={null}
            points={mapPoints}
            showGeofence
            markerType="number"
            fitPadding={{ top: 140, right: 60, bottom: 200, left: 60 }}
          />
        )}
      </View>

      {/* ─── Top bar flotante ─── */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={26} color={COLORS.primary} />
        </Pressable>

        <View style={styles.titlePill}>
          <Ionicons name="eye-outline" size={16} color={COLORS.white} />
          <Text style={styles.titleText}>Vista previa</Text>
        </View>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      {/* ─── Bottom info card ─── */}
      <View style={styles.bottomCard} pointerEvents="box-none">
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {validPoints} {validPoints === 1 ? 'parada' : 'paradas'} en el mapa
          </Text>
        </View>
        {missingCoords > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={[styles.infoText, { color: COLORS.error }]}>
              {missingCoords} sin ubicación todavía
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const TOP_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 12;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  mapWrapper: { flex: 1 },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },

  topBar: {
    position: 'absolute',
    top: TOP_OFFSET,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconBtnPlaceholder: { width: 40, height: 40 },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  titleText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'android' ? 24 : 32,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
});
