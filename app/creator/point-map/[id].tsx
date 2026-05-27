// app/creator/point-map/[id].tsx
//
// Selector de ubicación a pantalla completa, estilo Google Maps.
//   - MapView ocupando toda la pantalla.
//   - Buscador flotante arriba (sobre el mapa) con resultados de Nominatim.
//   - Tap en el mapa coloca/mueve el pin; el pin también es arrastrable.
//   - Botón "Confirmar" abajo persiste lat/lon/placeId en Firestore y
//     vuelve atrás. Salir sin confirmar (botón X) descarta los cambios.

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
  type MapPressEvent,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreator } from '@/contexts/CreatorContext';
import { usePlaceSearch, type PlaceResult } from '@/hooks/usePlaceSearch';
import { getPoint, updatePoint } from '@/services/creatorService';
import { COLORS, FONTS } from '@/utils/theme';
import type { TourPoint } from '@/types/tour';

const DEFAULT_REGION: Region = {
  latitude: 40.41677,
  longitude: -3.70379,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function CreatorPointMapScreen() {
  const router = useRouter();
  const { id: pointId } = useLocalSearchParams<{ id: string }>();
  const { draft } = useCreator();
  const tourId = draft?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [point, setPoint] = useState<TourPoint | null>(null);

  // Estado local de coords (lo que se confirmará al pulsar el botón).
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  /** Nombre asociado al placeId, sólo si vino del buscador (sirve para
   *  pre-rellenar el nombre del point si todavía no tenía uno). */
  const [pickedName, setPickedName] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Buscador
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { results, loading: searching } = usePlaceSearch(query);

  const mapRef = React.useRef<MapView>(null);

  // ───── Carga inicial ─────
  useEffect(() => {
    if (!tourId || !pointId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await getPoint(tourId, pointId);
        if (cancelled) return;
        setPoint(p);
        const hasRealCoords = !(p.latitude === 0 && p.longitude === 0);
        if (hasRealCoords) {
          setCoords({ latitude: p.latitude, longitude: p.longitude });
        }
        setPlaceId(p.placeId ?? null);
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'No se pudo cargar la parada.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tourId, pointId]);

  const initialRegion: Region = useMemo(() => {
    if (point && !(point.latitude === 0 && point.longitude === 0)) {
      return {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_REGION;
  }, [point]);

  // ───── Handlers ─────
  const handlePickResult = (place: PlaceResult) => {
    Keyboard.dismiss();
    setShowResults(false);
    setQuery(place.name);
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    setPlaceId(place.placeId);
    setPickedName(place.name);
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      400,
    );
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    // El usuario marcó manualmente: ya no estamos en un Place del buscador.
    setPlaceId(null);
    setPickedName(null);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const handleMarkerDragEnd = (e: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    setPlaceId(null);
    setPickedName(null);
  };

  const handleConfirm = async () => {
    if (!tourId || !pointId || !coords || saving) return;
    setSaving(true);
    try {
      // Si el creador no tenía nombre puesto y eligió un resultado del
      // buscador, lo pre-rellenamos también. Si ya tenía nombre, lo
      // respetamos.
      const shouldPrefillName =
        !!pickedName &&
        (point?.name ?? '').trim().length === 0;
      await updatePoint(tourId, pointId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        placeId,
        ...(shouldPrefillName ? { name: pickedName! } : {}),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error al guardar', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  // ───── Render ─────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!tourId || !point) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar la parada.</Text>
      </View>
    );
  }

  const hasCoords = !!coords;
  const canConfirm = hasCoords && !saving;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.flex}>
        <StatusBar barStyle="dark-content" />

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {hasCoords && (
            <Marker
              coordinate={coords!}
              draggable
              onDragEnd={handleMarkerDragEnd}
              pinColor={COLORS.primary}
            />
          )}
        </MapView>

        {/* ─── Cabecera flotante: cerrar + buscador estilo Google Maps ─── */}
        <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.searchBar}>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </Pressable>
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setShowResults(t.trim().length >= 3);
              }}
              onFocus={() => {
                if (query.trim().length >= 3) setShowResults(true);
              }}
              placeholder="Busca un lugar (calle, monumento, plaza…)"
              placeholderTextColor={COLORS.placeholder}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setShowResults(false);
                }}
                hitSlop={8}
                style={styles.searchClearBtn}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          {showResults && (
            <View style={styles.resultsCard}>
              {searching && results.length === 0 ? (
                <View style={styles.resultsLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.resultsLoadingText}>Buscando…</Text>
                </View>
              ) : results.length === 0 ? (
                <Text style={styles.noResults}>Sin resultados</Text>
              ) : (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  style={styles.resultsScroll}
                >
                  {results.map((item, idx) => (
                    <Pressable
                      key={item.placeId}
                      onPress={() => handlePickResult(item)}
                      style={({ pressed }) => [
                        styles.resultItem,
                        pressed && { backgroundColor: COLORS.inputBackground },
                      ]}
                    >
                      <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                      <View style={styles.resultText}>
                        <Text style={styles.resultName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultAddress} numberOfLines={1}>
                          {item.displayName}
                        </Text>
                      </View>
                      {idx < results.length - 1 && <View style={styles.separator} />}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </SafeAreaView>

        {/* ─── Hint inferior + botón Confirmar ─── */}
        <SafeAreaView edges={['bottom']} style={styles.bottomOverlay} pointerEvents="box-none">
          {hasCoords ? (
            <View style={styles.coordsHint} pointerEvents="none">
              <Ionicons name="pin" size={14} color={COLORS.white} />
              <Text style={styles.coordsHintText}>
                {coords!.latitude.toFixed(5)}, {coords!.longitude.toFixed(5)}
              </Text>
            </View>
          ) : (
            <View style={styles.coordsHint} pointerEvents="none">
              <Ionicons name="hand-left-outline" size={14} color={COLORS.white} />
              <Text style={styles.coordsHintText}>
                Toca el mapa o busca un lugar para colocar el pin
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleConfirm}
            disabled={!canConfirm}
            style={({ pressed }) => [
              styles.confirmBtn,
              !canConfirm && styles.confirmBtnDisabled,
              pressed && canConfirm && { opacity: 0.85 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.confirmBtnText}>Confirmar ubicación</Text>
            )}
          </Pressable>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorText: { fontFamily: FONTS.medium, color: COLORS.error, textAlign: 'center' },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 8,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  searchBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
    marginLeft: 4,
  },
  searchClearBtn: {
    paddingHorizontal: 8,
  },
  resultsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  resultsScroll: {
    maxHeight: 320,
  },
  resultsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  resultsLoadingText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
  },
  noResults: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
    padding: 12,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  resultText: { flex: 1, minWidth: 0 },
  resultName: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
  },
  resultAddress: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12,
    gap: 10,
  },
  coordsHint: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  coordsHintText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
