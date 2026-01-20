// components/infoPanel.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PointOfInterest } from "../data/points";

interface InfoPanelProps {
  activePoint: PointOfInterest | null;
  isPlaying: boolean;
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
}

export const InfoPanel = ({ activePoint, isPlaying, location }: InfoPanelProps) => {
  return (
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
  );
};

const styles = StyleSheet.create({
  infoPanel: { flex: 1, padding: 20, alignItems: "center", justifyContent: "space-around" },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A" },
  statusCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 15, width: "100%", elevation: 3 },
  statusText: { fontSize: 16, marginVertical: 4 },
  bold: { color: "#0066CC", fontWeight: "bold" },
  coords: { fontSize: 12, color: "#AAA", fontFamily: "monospace" }
});