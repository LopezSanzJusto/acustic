import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { useAudio } from "../hooks/useAudio";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { isWithinRadius } from "../services/proximityService";
import { PointOfInterest } from "../data/points";

const RADIUS = 30; // Radio definido en el anteproyecto

export default function HomeScreen() {
  const { location, errorMsg } = useLocation(true); // Simulación activa
  const { points, loading: pointsLoading } = useFirebasePoints();
  const { playPointAudio, stopAll, isPlaying, isPreloading: audioLoading } = useAudio();

  // Cálculo de geofencing con datos de Firebase
  const activePoint = useMemo(() => {
    if (!location || points.length === 0) return null;
    return points.find((p: PointOfInterest) =>
      isWithinRadius(location, { latitude: p.latitude, longitude: p.longitude }, RADIUS)
    );
  }, [location, points]);

  // Controlador de audio automático
  useEffect(() => {
    const handleAudio = async () => {
      if (activePoint) {
        await playPointAudio(activePoint.id);
      } else {
        await stopAll();
      }
    };

    if (!audioLoading && !pointsLoading) {
      handleAudio();
    }
  }, [activePoint?.id, audioLoading, pointsLoading]);

  if (pointsLoading || audioLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.status}>Sincronizando con la nube...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAPA NATIVO */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 40.4167,
            longitude: -3.7037,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          region={location ? { ...location, latitudeDelta: 0.002, longitudeDelta: 0.002 } : undefined}
        >
          {location && <Marker coordinate={location} title="Tu posición" pinColor="blue" />}
          
          {points.map((p) => (
            <React.Fragment key={p.id}>
              <Marker coordinate={{ latitude: p.latitude, longitude: p.longitude }} title={p.name} />
              <Circle
                center={{ latitude: p.latitude, longitude: p.longitude }}
                radius={RADIUS}
                fillColor="rgba(0, 102, 204, 0.15)"
                strokeColor="rgba(0, 102, 204, 0.4)"
              />
            </React.Fragment>
          ))}
        </MapView>
      </View>

      {/* PANEL DE INFORMACIÓN */}
      <View style={styles.infoPanel}>
        <Text style={styles.title}>ACUSTIC - Guía Activa</Text>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Punto: <Text style={styles.bold}>{activePoint ? activePoint.name : "Buscando..."}</Text>
          </Text>
          <Text style={styles.statusText}>
            Audio: <Text style={styles.bold}>{isPlaying ? "Reproduciendo 🔊" : "En pausa ⏸️"}</Text>
          </Text>
        </View>

        {location && (
          <Text style={styles.coords}>
            GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  mapContainer: { height: "55%", width: "100%", borderBottomLeftRadius: 25, borderBottomRightRadius: 25, overflow: "hidden" },
  map: { width: "100%", height: "100%" },
  infoPanel: { flex: 1, padding: 20, alignItems: "center", justifyContent: "space-around" },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A" },
  statusCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 15, width: "100%", elevation: 3 },
  statusText: { fontSize: 16, marginVertical: 4 },
  bold: { color: "#0066CC", fontWeight: "bold" },
  status: { marginTop: 10, fontSize: 14, color: "#666" },
  coords: { fontSize: 12, color: "#AAA", fontFamily: "monospace" }
});