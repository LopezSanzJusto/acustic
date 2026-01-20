// screens/homeScreen.web.tsx

import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView, Image } from "react-native";

export default function HomeScreen() {
  const openStore = (store: 'apple' | 'google') => {
    const url = store === 'apple' 
      ? 'https://www.apple.com/app-store/' 
      : 'https://play.google.com/store';
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.center}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.logo}>ACUSTIC</Text>
        <Text style={styles.title}>Audioguías en la ciudad que quieras</Text>
        <Text style={styles.subtitle}>
          Una solución inteligente para un turismo sano basada en geolocalización de precisión.
        </Text>
      </View>

      {/* Features Section */}
      <View style={styles.features}>
        <View style={styles.card}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.cardTitle}>Geofencing Preciso</Text>
          <Text style={styles.cardText}>Detección automática de puntos de interés en un radio de 30 metros.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>🔊</Text>
          <Text style={styles.cardTitle}>Audio Descripciones</Text>
          <Text style={styles.cardText}>Información detallada sobre puntos de interés turísticos mediante voz en tiempo real.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>☁️</Text>
          <Text style={styles.cardTitle}>Cloud Sync</Text>
          <Text style={styles.cardText}>Actualización instantánea de rutas desde la nube sin actualizar la app.</Text>
        </View>
      </View>

      {/* Download Section */}
      <View style={styles.downloadContainer}>
        <Text style={styles.downloadTitle}>Disponible próximamente para tu smartphone</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => openStore('google')}>
            <Text style={styles.buttonText}>Get it on Google Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={() => openStore('apple')}>
            <Text style={styles.buttonText}>Download on App Store</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 ACUSTIC - Proyecto Fin de Grado</Text>
        <Text style={styles.footerSubText}>Desarrollado con React Native, Expo y Firebase</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { alignItems: "center" },
  hero: { padding: 60, alignItems: "center", backgroundColor: "#0066CC", width: "100%" },
  logo: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginBottom: 20, letterSpacing: 2 },
  title: { fontSize: 42, fontWeight: "bold", color: "#FFF", textAlign: "center", maxWidth: 800 },
  subtitle: { fontSize: 18, color: "#E0E0E0", textAlign: "center", marginTop: 20, maxWidth: 600, lineHeight: 28 },
  features: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", padding: 40, gap: 20 },
  card: { backgroundColor: "#F8F9FA", padding: 30, borderRadius: 20, width: 300, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, elevation: 5 },
  icon: { fontSize: 40, marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#333" },
  cardText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  downloadContainer: { padding: 60, alignItems: "center" },
  downloadTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  buttonRow: { flexDirection: "row", gap: 20, flexWrap: "wrap", justifyContent: "center" },
  button: { backgroundColor: "#000", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  appleButton: { backgroundColor: "#333" },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  footer: { padding: 40, borderTopWidth: 1, borderTopColor: "#EEE", width: "100%", alignItems: "center" },
  footerText: { color: "#999", fontSize: 14 },
  footerSubText: { color: "#BBB", fontSize: 12, marginTop: 5 }
});