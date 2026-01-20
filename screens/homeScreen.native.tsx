// screens/homeScreen.native.tsx

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useAudio } from "../hooks/useAudio";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { isWithinRadius } from "../services/proximityService";
import { MapDisplay } from "../components/mapDisplay";
import { InfoPanel } from "../components/infoPanel";
import { PointOfInterest } from '../data/points';

const RADIUS = 30;

export default function HomeScreen() {
  const { location } = useLocation(true);
  const { points, loading: pointsLoading } = useFirebasePoints();
  const { playPointAudio, stopAll, isPlaying, isPreloading } = useAudio(points);


  const activePoint = useMemo(() => {
    if (!location || points.length === 0) return null;
    
    const found = points.find((p: PointOfInterest) =>
      isWithinRadius(location, { latitude: p.latitude, longitude: p.longitude }, RADIUS)
    );

    return found ? found : null;
  }, [location, points]);

  // 🔥 SOLUCIÓN AL PUNTO A: 
  // Añadimos isPreloading y pointsLoading a las dependencias.
  useEffect(() => {
    const handleAudio = async () => {
      // Si el sistema está cargando, esperamos. 
      // Cuando isPreloading pase a false, este efecto se disparará de nuevo automáticamente.
      if (isPreloading || pointsLoading) return;

      if (activePoint) {
        await playPointAudio(activePoint.id);
      } else {
        await stopAll();
      }
    };

    handleAudio();
  }, [activePoint?.id, isPreloading, pointsLoading]); 

  if (pointsLoading || isPreloading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Sincronizando sistema...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: "75%" }}>
        <MapDisplay location={location} points={points} radius={RADIUS} />
      </View>
      {/* Pasamos 'points' también para poder calcular distancias dentro */}
      <InfoPanel 
        activePoint={activePoint} 
        isPlaying={isPlaying} 
        location={location}
        points={points} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" }
});