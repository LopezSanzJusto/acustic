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

  // He añadido los emojis para que se parezca más a tu Figma
  const categories = ["Todos", "🕊️ Historia", "🖼️ Arte", "🍴 Gastronomía", "🏛️ Cultura"];

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
        <ActivityIndicator size="large" color="#5636D3" />
        <Text style={styles.loadingText}>Cargando audioguías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          {/* ✨ Icono de lupa dentro de un círculo morado */}
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={16} color="#FFFFFF" />
          </View>
          <TextInput 
            placeholder="¿Dónde quieres caminar hoy?" 
            style={styles.searchInput}
            placeholderTextColor="#A894FF" // Morado clarito para el placeholder
          />
        </View>
      </View>

      {/* Categorías */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryText}>🌐 Idioma</Text>
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
          // ✨ Título actualizado para coincidir con el Figma
          <Text style={styles.sectionTitle}>Audioguías más próximas</Text>
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
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#5636D3', fontWeight: '600' },
  
  // ✨ Estilos del buscador
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderWidth: 1.5,
    borderColor: '#B09FFF', // Borde morado claro
    paddingHorizontal: 10,
    paddingVertical: 8, 
    borderRadius: 25, // Forma de píldora
  },
  searchIconContainer: {
    backgroundColor: '#8A72F6', // Círculo morado
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 15, 
    color: '#5636D3' 
  },
  
  // ✨ Estilos de las categorías
  categoriesWrapper: { marginBottom: 15 },
  categoriesContainer: { paddingHorizontal: 20, gap: 10, alignItems: 'center', paddingBottom: 5 },
  categoryCard: {
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', // Borde gris claro para los inactivos
  },
  activeCategoryCard: { 
    backgroundColor: '#5636D3', // Fondo morado para el activo ("Todos")
    borderColor: '#5636D3',
  },
  categoryText: { 
    fontSize: 14, 
    color: '#888888' // Texto gris para los inactivos
  },
  activeCategoryText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  
  // ✨ Estilo del título
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    color: '#5636D3' // Letra morada como en Figma
  },
  listContent: { paddingBottom: 100 }
});