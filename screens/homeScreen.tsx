// screens/homeScreen.tsx

import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAudio } from "../hooks/useAudio";
import { useLocation } from "../hooks/useLocation";
import { isWithinRadius } from "../services/proximityService";
import { POINTS, PointOfInterest } from "../data/points";

const RADIUS = 30;

export default function HomeScreen() {
  const { location, errorMsg } = useLocation(true); // true para simulación web
  const { playPointAudio, stopAll, isPlaying, isPreloading } = useAudio();

  const activePoint = useMemo(() => {
    if (!location) return null;
    return POINTS.find((p: PointOfInterest) =>
      isWithinRadius(location, { latitude: p.latitude, longitude: p.longitude }, RADIUS)
    );
  }, [location]);

  useEffect(() => {
    const handleAudio = async () => {
      if (activePoint) {
        await playPointAudio(activePoint.id); 
      } else {
        await stopAll();
      }
    };

    if (!isPreloading) {
      handleAudio();
    }
  }, [activePoint?.id, isPreloading]);

  if (isPreloading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.status}>Cargando Guía Local...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ACUSTIC - Versión Local (v1.0)</Text>

      {location && (
        <View style={styles.card}>
          <Text style={styles.coords}>Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.coords}>Lon: {location.longitude.toFixed(6)}</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.status}>Punto: <Text style={styles.bold}>{activePoint ? activePoint.name : "Ninguno"}</Text></Text>
        <Text style={styles.status}>Audio: <Text style={styles.bold}>{isPlaying ? "Reproduciendo 🔊" : "Pausado ⏸️"}</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#FFF", padding: 15, borderRadius: 10, width: "100%", marginBottom: 20, alignItems: "center", boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" },
  coords: { fontSize: 16, fontFamily: "monospace" },
  infoBox: { backgroundColor: "#FFF", padding: 20, borderRadius: 15, width: "100%", boxShadow: "0px 4px 10px rgba(0,0,0,0.15)" },
  status: { fontSize: 18, marginVertical: 8, textAlign: "center" },
  bold: { color: "#0066CC", fontWeight: "bold" },
});