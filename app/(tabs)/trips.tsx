// app/(tabs)/trips.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ActiveTourCard } from '../../components/activeTourCard';
import { TourCard } from '../../components/tourCard';
import { TripSlider } from '../../components/tripSlider';
import { EmptyState } from '../../components/emptyState';

import { useMyTours } from '../../hooks/useMyTours';
import { COLORS, FONTS } from '../../utils/theme';
import { auth } from '../../services/firebaseConfig';
import { findActiveDraft, discardDraft } from '../../services/creatorService';

const LogoAcustic = require('../../assets/images/logo.png');

export default function TripsScreen() {
  const router = useRouter();
  const { purchasedTours, favoriteTours, loading } = useMyTours();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'purchased' | 'favorites'>('purchased');
  const [creatingDraft, setCreatingDraft] = useState(false);

  const handleCreateAudioguide = async () => {
    if (creatingDraft) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      router.push('/auth/login' as any);
      return;
    }
    setCreatingDraft(true);
    try {
      const existing = await findActiveDraft(uid);
      if (existing) {
        Alert.alert(
          'Borrador en curso',
          'Tienes una audioguía a medio crear. ¿Qué quieres hacer?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar y empezar de cero',
              style: 'destructive',
              onPress: async () => {
                try {
                  await discardDraft(existing);
                  router.push('/creator/basics' as any);
                } catch {
                  Alert.alert('Error', 'No se pudo descartar el borrador.');
                }
              },
            },
            { text: 'Continuar borrador', onPress: () => router.push('/creator/basics' as any) },
          ],
        );
      } else {
        router.push('/creator/basics' as any);
      }
    } catch {
      Alert.alert('Error', 'No se pudo comprobar si tienes un borrador.');
    } finally {
      setCreatingDraft(false);
    }
  };

  // Lógica: ¿Qué datos mostramos ahora?
  const dataToShow = activeTab === 'purchased' ? purchasedTours : favoriteTours;

  // Lógica: Textos y Logo dinámicos
  const emptyStateConfig = activeTab === 'purchased' 
    ? { imageSource: LogoAcustic, title: "No tienes audioguías", desc: "Explora el catálogo y añade tu primer destino." } 
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

      {/* 1. Componente del Slider */}
      <TripSlider activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2. Lista o Estado Vacío */}
      {dataToShow.length === 0 ? (
        <EmptyState 
          icon={emptyStateConfig.icon}
          imageSource={emptyStateConfig.imageSource} 
          title={emptyStateConfig.title}
          description={emptyStateConfig.desc}
          buttonText="Ir a Explora"
          onButtonPress={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          // ✅ CORREGIDO: Usamos dataToShow, que es la variable de esta pantalla
          data={dataToShow}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const handlePress = () => router.push({
              pathname: "/tour/[id]",
              params: { id: item.id, fromTrips: 'true' }
            } as any);

            const handleStartRoute = () => router.push({
              pathname: '/active-tour/[id]',
              params: { id: item.id },
            } as any);

            // Compradas → tarjeta con progreso (ActiveTourCard)
            // Favoritas → misma tarjeta que Explora (TourCard, con intro y favorito)
            return activeTab === 'purchased'
              ? <ActiveTourCard tour={item} onPress={handlePress} onStartRoute={handleStartRoute} />
              : <TourCard tour={item} onPress={handlePress} />;
          }}
        />
      )}

      {/* FAB para entrar al Panel de creador */}
      <Pressable
        onPress={handleCreateAudioguide}
        disabled={creatingDraft}
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          creatingDraft && { opacity: 0.6 },
        ]}
      >
        {creatingDraft ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="add" size={22} color={COLORS.white} />
            <Text style={styles.fabLabel}>Crear audioguía</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabLabel: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});