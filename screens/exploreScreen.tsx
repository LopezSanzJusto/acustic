// screens/exploreScreen.tsx

import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TourCard } from '../components/tourCard';
import { useFirebaseTours } from '../hooks/useFirebaseTours';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme'; 
// ✨ INTRO: Importamos tu hook de audio para una sola pista
import { useSingleAudio } from '../hooks/useSingleAudio'; 

export default function ExploreScreen() {
  const router = useRouter();
  const { tours, loading } = useFirebaseTours(); 

  const categories = ["Todos", "Historia", "Arte", "Gastronomía", "Cultura"];

  // ✨ INTRO: Estados para controlar qué intro está sonando globalmente en esta lista
  const [playingTourId, setPlayingTourId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(undefined);

  // ✨ INTRO: Inicializamos el hook de audio de forma global para la pantalla
  const { isPlaying, togglePlayPause } = useSingleAudio(currentAudioUrl);

  // ✨ INTRO: Función que se ejecuta cuando el usuario toca el botón de auriculares en cualquier tarjeta
  const handleToggleIntro = async (audioUrl: string, tourId: string) => {
    // Si toca el mismo tour que ya está sonando, simplemente pausamos/reanudamos
    if (playingTourId === tourId) {
      await togglePlayPause();
    } else {
      // Si toca un tour diferente, actualizamos los estados. 
      // El hook useSingleAudio detectará el cambio de URL y cargará el nuevo audio automáticamente.
      setPlayingTourId(tourId);
      setCurrentAudioUrl(audioUrl);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando audioguías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.placeholder} />
          <TextInput 
            placeholder="Encuentra tu siguiente destino.." 
            style={styles.searchInput}
            placeholderTextColor={COLORS.placeholder}
          />
        </View>
      </View>

      {/* Categorías */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={{ color: COLORS.text }}>🌐 Idioma</Text>
          </TouchableOpacity>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryCard, cat === "Todos" && styles.activeCategoryCard]}
            >
              <Text style={[styles.categoryText, cat === "Todos" && styles.activeCategoryText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.sectionTitle}>Audioguías más escuchadas</Text>
        )}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TourCard 
            tour={item} 
            onPress={() => {
              // Si el usuario entra al detalle del tour, probablemente deberíamos parar la intro (opcional)
              if (isPlaying) togglePlayPause();
              
              router.push({
                pathname: "/tour/[id]",
                params: { id: item.id }
              } as any); 
            }} 
            // ✨ INTRO: Pasamos las nuevas propiedades a la tarjeta
            isIntroPlaying={playingTourId === item.id && isPlaying}
            onToggleIntro={handleToggleIntro}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.primary, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBackground, paddingHorizontal: 15,
    paddingVertical: 12, borderRadius: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.text },
  categoriesWrapper: { marginBottom: 10 },
  categoriesContainer: { paddingHorizontal: 20, gap: 10, alignItems: 'center', paddingBottom: 10 },
  filterButton: {
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  categoryCard: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  activeCategoryCard: { backgroundColor: COLORS.textDark, borderColor: COLORS.textDark },
  categoryText: { fontSize: 14, color: COLORS.muted },
  activeCategoryText: { color: COLORS.white, fontWeight: 'bold' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 20, color: COLORS.textDark },
  listContent: { paddingBottom: 100 }
});