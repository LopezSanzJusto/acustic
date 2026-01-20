import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAudio } from "../hooks/useAudio";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { isWithinRadius } from "../services/proximityService";

const RADIUS = 30;

export default function HomeScreen() {
  const { location, errorMsg } = useLocation(true); // Simulación web activa
  const { points, loading: pointsLoading } = useFirebasePoints();
  const { isPlaying, isPreloading } = useAudio();

  const activePoint = useMemo(() => {
    if (!location || points.length === 0) return null;
    return points.find((p) =>
      isWithinRadius(location, { latitude: p.latitude, longitude: p.longitude }, RADIUS)
    );
  }, [location, points]);

  if (pointsLoading || isPreloading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text>Cargando entorno de simulación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.webBanner}>
        <Text style={styles.webTitle}>🌐 Panel de Control - Simulación Web</Text>
        <Text style={styles.webSubtitle}>El mapa nativo solo se renderiza en dispositivos móviles.</Text>
      </View>

      <View style={styles.infoPanel}>
        <View style={styles.statusCard}>
          <Text style={styles.label}>Punto: <Text style={styles.bold}>{activePoint ? activePoint.name : "Ninguno"}</Text></Text>
          <Text style={styles.label}>Audio: <Text style={styles.bold}>{isPlaying ? "Reproduciendo 🔊" : "Pausado ⏸️"}</Text></Text>
        </View>
        
        {location && (
          <Text style={styles.debugText}>Simulando GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  webBanner: { height: "40%", backgroundColor: "#E9ECEF", justifyContent: "center", alignItems: "center", padding: 20 },
  webTitle: { fontSize: 20, fontWeight: "bold", color: "#343A40" },
  webSubtitle: { fontSize: 14, color: "#6C757D", marginTop: 10, textAlign: 'center' },
  infoPanel: { flex: 1, padding: 30, alignItems: "center" },
  statusCard: { backgroundColor: "#FFF", padding: 25, borderRadius: 20, width: "100%", maxWidth: 400, shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
  label: { fontSize: 18, marginVertical: 10 },
  bold: { color: "#0066CC", fontWeight: "bold" },
  debugText: { marginTop: 20, fontSize: 12, color: "#ADB5BD", fontFamily: "monospace" }
});