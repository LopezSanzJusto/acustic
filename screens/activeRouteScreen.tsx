// screens/activeRouteScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { useGeoAudioSync } from "../hooks/useGeoAudioSync"; 
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { COLORS } from "../utils/theme";
import { useCustomRoute } from "../hooks/useCustomRoute"; 

// ✨ IMPORTAMOS LOS HOOKS DE GUARDADO Y LA FUNCIÓN EN TIEMPO REAL
import { RouteProgressBar } from "../components/routeProgressBar";
import { calculateRealTimeProgress } from "../utils/geo"; 
import { useTourProgress } from "../hooks/useTourProgress"; 

const RADIUS = 15;

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  const insets = useSafeAreaInsets();
  const { location } = useLocation(true); 
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);
  const { activeRoutePoints, setInitialPoints } = useCustomRoute(tourId);
  
  // ✨ Instanciamos el hook que guarda en Firebase
  const { saveProgress } = useTourProgress();

  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  const routeToUse = activeRoutePoints.length > 0 ? activeRoutePoints : (points || []);

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
  } = useAudio(routeToUse); 

  const { gpsActivePoint } = useGeoAudioSync({
    location,
    points: routeToUse,
    radius: RADIUS,
    isPreloading,
    pointsLoading,
    setActivePointIndex
  });

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

          <View style={[styles.topUiOverlay, { top: insets.top + 10 }]}>
            <View style={styles.minimalPill}>
              <Text style={styles.progressText}>
                {Math.round(currentProgress)}%
              </Text>
              <View style={styles.barWrapper}>
                <RouteProgressBar percentage={currentProgress} />
              </View>
            </View>
          </View>

          {activePoint && (
            <AudioMiniPlayer
              activePoint={activePoint}
              isPlaying={isPlaying}
              positionMillis={positionMillis}
              durationMillis={durationMillis}
              playbackRate={playbackRate}
              points={routeToUse} 
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
  topUiOverlay: { position: 'absolute', alignSelf: 'center', width: '65%', zIndex: 10 },
  minimalPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.92)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, width: 38, textAlign: 'left' },
  barWrapper: { flex: 1, marginLeft: 4 }
});