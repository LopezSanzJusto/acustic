// screens/activeRouteScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { db, firestoreReady } from '../services/firebaseConfig';
import NetInfo from '@react-native-community/netinfo';
import { readManifest } from '../services/offlineManifest';

import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { useGeoAudioSync } from "../hooks/useGeoAudioSync";
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { COLORS } from "../utils/theme";
import { useCustomRoute } from "../hooks/useCustomRoute";
import { useOfflineAssets } from "../hooks/useOfflineAssets";

import { RouteProgressBar } from "../components/routeProgressBar";
import { calculateRealTimeProgress } from "../utils/geo";
import { useTourProgress } from "../hooks/useTourProgress";
import { PointReachedModal } from "../components/pointReachedModal";
import { notifyPointReached, ensureNotificationPermission } from "../services/notificationService";
import { PointOfInterest } from "../data/points";
import { useUserPreferences } from "../hooks/useUserPreferences";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  BACKGROUND_LOCATION_TASK,
  ACTIVE_POIS_KEY,
  BG_PLAYED_POINTS_KEY,
  BG_NOTIF_ENABLED_KEY,
} from "../tasks/backgroundLocationTask";

const RADIUS = 15;

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location } = useLocation(true);
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);
  const { activeRoutePoints, setInitialPoints } = useCustomRoute(tourId);

  const [tourName, setTourName] = useState('');
  useEffect(() => {
    async function fetchTourName() {
      const netState = await NetInfo.fetch();
      const offline = !(netState.isConnected ?? true);

      if (offline) {
        const manifest = await readManifest(tourId);
        if (manifest) setTourName(manifest.meta.title);
        return;
      }

      try {
        await firestoreReady;
        const docSnap = await getDoc(doc(db, 'tours', tourId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTourName(data?.name || data?.title || '');
        }
      } catch {
        // Red disponible pero Firestore falló — intentar manifest como fallback
        const manifest = await readManifest(tourId);
        if (manifest) setTourName(manifest.meta.title);
      }
    }
    fetchTourName();
  }, [tourId]);
  
  // ✨ Instanciamos el hook que guarda en Firebase
  const { saveProgress } = useTourProgress();
  const { prefs } = useUserPreferences();

  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  const routeToUse = activeRoutePoints.length > 0 ? activeRoutePoints : (points || []);

  // Si el tour está descargado, sustituye las URLs remotas por rutas file:// locales.
  // Solo se usa para reproducción de audio e imágenes; GPS/mapa siguen con routeToUse.
  const { resolvedPoints: resolvedRoutePoints } = useOfflineAssets(tourId, routeToUse);

  // ── Background location task ────────────────────────────────────────────────
  // Persiste los POIs en AsyncStorage para que la tarea pueda leerlos incluso
  // cuando el proceso de React esté suspendido (pantalla apagada).
  useEffect(() => {
    if (!routeToUse || routeToUse.length === 0) return;

    const slimPois = routeToUse.map(({ id, name, latitude, longitude, image, order }) => ({
      id, name, latitude, longitude, imageUrl: image, order,
    }));

    const startBgTask = async () => {
      await AsyncStorage.setItem(ACTIVE_POIS_KEY, JSON.stringify(slimPois));
      await AsyncStorage.setItem(BG_PLAYED_POINTS_KEY, JSON.stringify([]));
      await AsyncStorage.setItem(BG_NOTIF_ENABLED_KEY, String(prefs.bgNotifications));

      // En dev, expo-task-manager pierde el Context de Android en cada hot-reload
      // y SharedPreferences queda null → NPE inevitable. El foreground tracking
      // ya cubre la detección de proximidad cuando la app está abierta.
      if (__DEV__) {
        console.log('[BgTask] dev mode — background task omitida (foreground tracking activo)');
        return;
      }

      const { status } = await Location.getBackgroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      if (status !== 'granted') {
        console.warn('[BgTask] no background location permission — task not started');
        return;
      }

      const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
      if (running) return;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 15000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Acustic',
          notificationBody: 'Guiándote por la ruta',
          notificationColor: '#7B5EA7',
        },
      });
      console.log('[BgTask] started OK ✓');
    };

    startBgTask().catch((e) => console.warn('[BgTask] startBgTask failed:', e));
  }, [routeToUse]);

  // Para la tarea y limpia AsyncStorage al salir del tour
  useEffect(() => {
    return () => {
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .then((running) => {
          if (running) Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        })
        .catch(() => {});
      AsyncStorage.multiRemove([ACTIVE_POIS_KEY, BG_PLAYED_POINTS_KEY, BG_NOTIF_ENABLED_KEY]).catch(() => {});
    };
  }, []);
  // ── Fin background location task ────────────────────────────────────────────

  const {
    activePoint,
    isPlaying,
    isPreloading,
    positionMillis,
    durationMillis,
    setActivePointIndex, 
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    playbackRate,
    toggleSpeed
  } = useAudio(resolvedRoutePoints);

  // Popup state
  const [pendingPoint, setPendingPoint] = useState<{ index: number; point: PointOfInterest } | null>(null);

  // Pedimos permiso de notificaciones al abrir la ruta
  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  const handlePointReached = useCallback((index: number, point: PointOfInterest) => {
    if (prefs.popupNearPoi) {
      setPendingPoint({ index, point });
    }
    if (prefs.autoPlayNearPoi) {
      setActivePointIndex(index);
    }
    notifyPointReached({ name: point.name, imageUrl: point.image, order: point.order });
  }, [prefs.popupNearPoi, prefs.autoPlayNearPoi, setActivePointIndex]);

  const { gpsActivePoint } = useGeoAudioSync({
    location,
    points: routeToUse,
    radius: RADIUS,
    isPreloading,
    pointsLoading,
    onPointReached: handlePointReached
  });

  const confirmPlayPoint = useCallback(() => {
    if (pendingPoint) setActivePointIndex(pendingPoint.index);
    setPendingPoint(null);
  }, [pendingPoint, setActivePointIndex]);

  const dismissPoint = useCallback(() => setPendingPoint(null), []);

  // ✨ Índice máximo alcanzado FÍSICAMENTE (por GPS). Nunca retrocede,
  // y es independiente del audio que el usuario esté escuchando.
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);

  useEffect(() => {
    if (!gpsActivePoint) return;
    const idx = routeToUse.findIndex(p => p.id === gpsActivePoint.id);
    if (idx > maxReachedIndex) {
      setMaxReachedIndex(idx);
    }
  }, [gpsActivePoint, routeToUse, maxReachedIndex]);

  const handleMarkerPress = useCallback((pointId: string) => {
    const pointIndex = routeToUse.findIndex((p) => p.id === pointId);
    if (pointIndex !== -1) {
      setActivePointIndex(pointIndex);
    }
  }, [routeToUse, setActivePointIndex]);

  // ✨ PROGRESO EN TIEMPO REAL: basado en el punto máximo alcanzado por GPS,
  // no en el audio que el usuario esté escuchando. Así, aunque el usuario
  // haga tap en el último audio del mini-player, el progreso no sube al 100%
  // hasta que llegue físicamente al último punto de interés.
  const currentProgressData = useMemo(() => {
    if (!routeToUse || routeToUse.length === 0) return { percentage: 0 };
    return calculateRealTimeProgress(routeToUse, maxReachedIndex, location);
  }, [routeToUse, maxReachedIndex, location]);

  const currentProgress = currentProgressData.percentage;

  // ✨ GUARDADO EN FIREBASE: solo cuando se alcanza un nuevo punto por GPS,
  // evitando escrituras masivas y garantizando que el % guardado refleja
  // avance físico real.
  useEffect(() => {
    if (routeToUse.length > 0) {
      saveProgress(tourId, currentProgress);
    }
  }, [maxReachedIndex]);

  if (pointsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.text }}>
          Cargando ruta...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flex: 1, position: "relative" }}>
          
          <MapDisplay 
            location={location} 
            points={routeToUse}
            radius={RADIUS}
            showGeofence={true} 
            markerType="number" 
            dashedRoute={true}  
            onMarkerPress={handleMarkerPress} 
          />

          <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
            <View style={styles.topHeader}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  if (currentProgress >= 100) {
                    router.replace({
                      pathname: '/tour/rate/[id]',
                      params: { id: tourId, completed: 'true' },
                    } as any);
                  } else {
                    router.back();
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1}>{tourName}</Text>
              <View style={styles.headerButton} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{Math.round(currentProgress)}%</Text>
              <View style={styles.barWrapper}>
                <RouteProgressBar percentage={currentProgress} />
              </View>
            </View>
          </View>

          <PointReachedModal
            visible={!!pendingPoint}
            point={pendingPoint?.point ?? null}
            pointIndex={pendingPoint != null ? pendingPoint.index + 1 : undefined}
            totalPoints={routeToUse.length}
            onConfirm={confirmPlayPoint}
            onDismiss={dismissPoint}
          />

          {activePoint && (
            <AudioMiniPlayer
              activePoint={activePoint}
              isPlaying={isPlaying}
              positionMillis={positionMillis}
              durationMillis={durationMillis}
              playbackRate={playbackRate}
              points={resolvedRoutePoints}
              onSelectAudio={setActivePointIndex}
              onToggleSpeed={toggleSpeed}
              onPlayPause={togglePlayPause}
              onNext={playNext}
              onPrevious={playPrevious}
              onSeek={seekTo}
            />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBarWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 4 },
  topHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 'bold', color: COLORS.primary },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  progressText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, width: 42, textAlign: 'left' },
  barWrapper: { flex: 1, marginLeft: 6 },
});