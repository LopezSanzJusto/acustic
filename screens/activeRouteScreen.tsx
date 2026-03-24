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
// ✨ NUEVO: Importamos nuestro custom hook
import { useCustomRoute } from "../hooks/useCustomRoute"; 

const RADIUS = 15;

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  // 1. Capa de Datos
  const { location } = useLocation(true); 
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);

  // ✨ NUEVO: Extraemos el estado local y la ruta activa filtrada
  const { activeRoutePoints, setInitialPoints } = useCustomRoute();

  // Alimentamos el contexto con los puntos de Firebase en cuanto cargan
  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  // Usaremos activeRoutePoints como fuente de la verdad. Si está vacío (porque está cargando), usamos un array vacío.
  const routeToUse = activeRoutePoints.length > 0 ? activeRoutePoints : [];

  // 2. Capa de Audio (¡Alimentada por routeToUse!)
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
  } = useAudio(routeToUse); // ✨ PASAMOS LOS PUNTOS FILTRADOS

  // 3. Capa de Lógica de Negocio (¡Alimentada por routeToUse!)
  useGeoAudioSync({
    location,
    points: routeToUse, // ✨ PASAMOS LOS PUNTOS FILTRADOS
    radius: RADIUS,
    isPreloading,
    pointsLoading,
    setActivePointIndex
  });

  // 4. Toque en el mapa optimizado
  const handleMarkerPress = useCallback((pointId: string) => {
    // ✨ Buscamos en el array filtrado, no en el de Firebase
    const pointIndex = routeToUse.findIndex((p) => p.id === pointId);
    
    if (pointIndex !== -1) {
      setActivePointIndex(pointIndex);
    }
  }, [routeToUse, setActivePointIndex]);

  // Renderizado de carga
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

  // Renderizado principal
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, position: "relative" }}>
        
        {/* ✨ MAPA CON PUNTOS FILTRADOS */}
        <MapDisplay 
          location={location} 
          points={routeToUse} // ✨ PASAMOS LOS PUNTOS FILTRADOS
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
            onToggleSpeed={toggleSpeed}
            onPlayPause={togglePlayPause}
            onNext={playNext}
            onPrevious={playPrevious}
            onSeek={seekTo}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});