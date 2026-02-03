// app/(tabs)/trips.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { TourCard } from '../../components/tourCard';
import { TripSlider } from '../../components/tripSlider';
import { EmptyState } from '../../components/emptyState';

import { useMyTours } from '../../hooks/useMyTours';
import { COLORS } from '../../utils/theme';

export default function TripsScreen() {
  const router = useRouter();
  const { purchasedTours, favoriteTours, loading } = useMyTours();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'purchased' | 'favorites'>('purchased');

  // Lógica: ¿Qué datos mostramos ahora?
  const dataToShow = activeTab === 'purchased' ? purchasedTours : favoriteTours;

  // Lógica: Textos dinámicos para cuando no hay resultados
  const emptyStateConfig = activeTab === 'purchased' 
    ? { icon: "map-outline" as const, title: "No tienes audioguías", desc: "Explora el catálogo y añade tu primer destino." }
    : { icon: "heart-dislike-outline" as const, title: "Aún no hay favoritos", desc: "Guarda las rutas que más te gusten para verlas luego." };

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
      <View style={styles.header}>
        <Text style={styles.title}>Mis Viajes</Text>
      </View>

      {/* 1. Componente del Slider */}
      <TripSlider activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2. Lista o Estado Vacío */}
      {dataToShow.length === 0 ? (
        <EmptyState 
          icon={emptyStateConfig.icon}
          title={emptyStateConfig.title}
          description={emptyStateConfig.desc}
          buttonText="Ir a Explora"
          onButtonPress={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TourCard tour={item} onPress={() => router.push({ pathname: "/tour/[id]", params: { id: item.id } } as any)} />
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
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: '600' }
});