// screens/activeRouteScreen.tsx

import React, { useCallback, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { useGeoAudioSync } from "../hooks/useGeoAudioSync"; 
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { COLORS } from "../utils/theme";
import { useCustomRoute } from "../hooks/useCustomRoute"; 
// ✨ NUEVO: Importación para habilitar gestos del Bottom Sheet
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const RADIUS = 15;

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  const { location } = useLocation(true); 
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);
  const { activeRoutePoints, setInitialPoints } = useCustomRoute();

  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  const routeToUse = activeRoutePoints.length > 0 ? activeRoutePoints : [];

  const {
    activePoint,
    isPlaying,
    isPreloading,
    positionMillis,
    durationMillis,
    setActivePointIndex, // Ya lo exporta tu hook
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    playbackRate,
    toggleSpeed
  } = useAudio(routeToUse); 

  useGeoAudioSync({
    location,
    points: routeToUse, 
    radius: RADIUS,
    isPreloading,
    pointsLoading,
    setActivePointIndex
  });

  const handleMarkerPress = useCallback((pointId: string) => {
    const pointIndex = routeToUse.findIndex((p) => p.id === pointId);
    if (pointIndex !== -1) {
      setActivePointIndex(pointIndex);
    }
  }, [routeToUse, setActivePointIndex]);

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
    // ✨ IMPORTANTE: Envolvemos en GestureHandlerRootView
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

          {activePoint && (
            <AudioMiniPlayer
              activePoint={activePoint}
              isPlaying={isPlaying}
              positionMillis={positionMillis}
              durationMillis={durationMillis}
              playbackRate={playbackRate}
              points={routeToUse} // ✨ AHORA DESCOMENTADO
              onSelectAudio={setActivePointIndex} // ✨ AHORA DESCOMENTADO
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
});