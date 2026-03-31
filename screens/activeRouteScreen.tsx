// screens/activeRouteScreen.tsx

import React, { useCallback, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
// ✨ NUEVO: Importación vital para que funcionen los gestos de arrastre (Bottom Sheet)
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { useGeoAudioSync } from "../hooks/useGeoAudioSync"; 
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { COLORS } from "../utils/theme";
import { useCustomRoute } from "../hooks/useCustomRoute"; 

const RADIUS = 15;

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  const { location } = useLocation(true); 
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);
  const { activeRoutePoints, setInitialPoints } = useCustomRoute();

  // Cargamos los puntos en la ruta activa al iniciar
  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  // ✅ MEJORA: Hacemos fallback a `points` si activeRoutePoints aún no se ha poblado
  // para evitar que el mapa o el audio reciban un array vacío por una fracción de segundo.
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
    // ✨ IMPORTANTE: GestureHandlerRootView debe tener flex: 1 para ocupar toda la pantalla
    // Esto es requisito obligatorio para usar @gorhom/bottom-sheet o similares
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
              points={routeToUse} // ✨ Lista de puntos para el menú de capítulos del Bottom Sheet
              onSelectAudio={setActivePointIndex} // ✨ Función para saltar a un audio concreto desde el Bottom Sheet
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