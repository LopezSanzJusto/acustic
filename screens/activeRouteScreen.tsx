// screens/activeRouteScreen.tsx

import React from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { useGeoAudioSync } from "../hooks/useGeoAudioSync"; 
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { COLORS } from "../utils/theme";

const RADIUS = 15; // Radio de detección en metros

interface ActiveRouteScreenProps {
  tourId: string;
}

export default function ActiveRouteScreen({ tourId }: ActiveRouteScreenProps) {
  // 1. Capa de Datos (GPS + Firebase)
  const { location } = useLocation(true); // true = modo simulación
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);

  // 2. Capa de Audio (Lógica del reproductor)
  const {
    activePoint,
    isPlaying,
    isPreloading,
    positionMillis,
    durationMillis,
    setActivePointIndex, // Necesitamos pasar esto al sync hook
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    // ✨ EXTRAEMOS LAS NUEVAS FUNCIONES DE VELOCIDAD
    playbackRate,
    toggleSpeed
  } = useAudio(points); 
  // 🗑️ Hemos borrado 'skipBy' de aquí porque ya no lo usamos en el nuevo reproductor

  // 3. Capa de Lógica de Negocio (Sincronización GPS -> Audio)
  useGeoAudioSync({
    location,
    points,
    radius: RADIUS,
    isPreloading,
    pointsLoading,
    setActivePointIndex
  });

  // 4. Renderizado condicional de carga
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

  // 5. Renderizado de UI Principal
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, position: "relative" }}>
        
        {/* Mapa */}
        <MapDisplay location={location} points={points} radius={RADIUS} />

        {/* Reproductor (Solo aparece si hay un punto activo) */}
        {activePoint && (
          <AudioMiniPlayer
            activePoint={activePoint}
            isPlaying={isPlaying}
            positionMillis={positionMillis}
            durationMillis={durationMillis}
            // ✨ PASAMOS LAS NUEVAS PROPIEDADES AL COMPONENTE
            playbackRate={playbackRate}
            onToggleSpeed={toggleSpeed}
            // ----------------------------------------------
            onPlayPause={togglePlayPause}
            onNext={playNext}
            onPrevious={playPrevious}
            onSeek={seekTo}
            // 🗑️ onSkip={skipBy} eliminado porque ya no existe en el componente hijo
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});