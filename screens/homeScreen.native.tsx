// screens/homeScreen.native.tsx

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { isWithinRadius } from "../services/proximityService";
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { PointOfInterest } from "../data/points";

const RADIUS = 30; // Radio de detección en metros [cite: 121]

// ✅ Definimos la interfaz para recibir el tourId de forma dinámica
interface HomeScreenProps {
  tourId: string;
}

export default function HomeScreen({ tourId }: HomeScreenProps) {
  // Simulación de movimiento para pruebas o ubicación real [cite: 28]
  const { location } = useLocation(false); 
  
  // ✅ El hook ahora consume el tourId que viene desde la navegación
  const { points, loading: pointsLoading } = useFirebasePoints(tourId);

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
    skipBy,
  } = useAudio(points);

  /* =========================
   * 📍 Punto activo por GPS
   * ========================= */
  const gpsActivePoint = useMemo(() => {
    if (!location || points.length === 0) return null;

    return (
      points.find((p: PointOfInterest) =>
        isWithinRadius(
          location,
          { latitude: p.latitude, longitude: p.longitude },
          RADIUS
        )
      ) || null
    );
  }, [location, points]);

  /* =========================
   * 🔁 Sincronizar GPS → Audio [cite: 25]
   * ========================= */
  useEffect(() => {
    if (isPreloading || pointsLoading) return;

    // 🚫 Hemos salido de cualquier punto de interés
    if (!gpsActivePoint) {
      setActivePointIndex(null);
      return;
    }

    // ✅ Hemos entrado en el radio de un punto: activamos audio
    const index = points.findIndex(p => p.id === gpsActivePoint.id);
    if (index !== -1) {
      setActivePointIndex(index);
    }
  }, [gpsActivePoint?.id, isPreloading, pointsLoading]);

  // Visualización de carga para mejorar la UX del usuario
  if (pointsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Cargando tour...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, position: "relative" }}>
        {/* Renderizado del mapa con los pines de interés del tour seleccionado [cite: 28, 123] */}
        <MapDisplay location={location} points={points} radius={RADIUS} />

        {/* Reproductor de audio geolocalizado [cite: 121] */}
        {activePoint && (
          <AudioMiniPlayer
            activePoint={activePoint}
            isPlaying={isPlaying}
            positionMillis={positionMillis}
            durationMillis={durationMillis}
            onPlayPause={togglePlayPause}
            onNext={playNext}
            onPrevious={playPrevious}
            onSeek={seekTo}
            onSkip={skipBy}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
});