// app/(tabs)/trips.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TourCard } from '../../components/tourCard';
import { useMyTours } from '../../hooks/useMyTours';
import { COLORS } from '../../utils/theme';

export default function TripsScreen() {
  const router = useRouter();
  const { purchasedTours, favoriteTours, loading } = useMyTours();
  
  // Estado para controlar el slider: 'purchased' o 'favorites'
  const [activeTab, setActiveTab] = useState<'purchased' | 'favorites'>('purchased');

  // Elegimos qué lista mostrar según la pestaña activa
  const dataToShow = activeTab === 'purchased' ? purchasedTours : favoriteTours;

  // Pantalla de Carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tus viajes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Viajes</Text>
      </View>

      {/* 🎚️ Custom Slider Toggle */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderBackground}>
          <TouchableOpacity 
            style={[styles.sliderButton, activeTab === 'purchased' && styles.sliderButtonActive]}
            onPress={() => setActiveTab('purchased')}
            activeOpacity={0.8}
          >
            <Ionicons name="headset" size={16} color={activeTab === 'purchased' ? COLORS.white : COLORS.muted} />
            <Text style={[styles.sliderText, activeTab === 'purchased' && styles.sliderTextActive]}>
              Mis Audioguías
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sliderButton, activeTab === 'favorites' && styles.sliderButtonActiveAlt]}
            onPress={() => setActiveTab('favorites')}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={16} color={activeTab === 'favorites' ? COLORS.white : COLORS.muted} />
            <Text style={[styles.sliderText, activeTab === 'favorites' && styles.sliderTextActive]}>
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📜 Listado de Tours o Estado Vacío */}
      {dataToShow.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'purchased' ? "map-outline" : "heart-dislike-outline"} 
            size={60} 
            color={COLORS.placeholder} 
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'purchased' ? "No tienes audioguías" : "Aún no hay favoritos"}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'purchased' 
              ? "Explora el catálogo y añade tu primer destino."
              : "Guarda las rutas que más te gusten para verlas más tarde."}
          </Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.exploreButtonText}>Ir a Explora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TourCard 
              tour={item} 
              onPress={() => {
                // Redirige al detalle de la ruta
                router.push({ pathname: "/tour/[id]", params: { id: item.id } } as any);
              }} 
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: '600' },

  // --- Estilos del Slider ---
  sliderContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sliderBackground: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.inputBackground, 
    borderRadius: 25, 
    padding: 4 
  },
  sliderButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 20, 
    gap: 6
  },
  sliderButtonActive: { 
    backgroundColor: COLORS.primary, // Color original para "Mis Audioguías"
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3
  },
  sliderButtonActiveAlt: { 
    backgroundColor: COLORS.error, // Color Rojo/Corazón para "Favoritos"
    shadowColor: COLORS.error, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3
  },
  sliderText: { fontWeight: '600', color: COLORS.muted, fontSize: 14 },
  sliderTextActive: { color: COLORS.white },

  // --- Estilos del Estado Vacío ---
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -50 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginTop: 15, marginBottom: 5 },
  emptyText: { textAlign: 'center', color: COLORS.muted, lineHeight: 22, marginBottom: 20 },
  exploreButton: { backgroundColor: COLORS.textDark, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  exploreButtonText: { color: COLORS.white, fontWeight: 'bold' },

  listContent: { paddingBottom: 100 }
});