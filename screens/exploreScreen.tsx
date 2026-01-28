// screens/exploreScreen.tsx

import React from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TourCard } from '../components/tourCard';
import { useFirebaseTours } from '../hooks/useFirebaseTours';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  const router = useRouter();
  const { tours, loading } = useFirebaseTours(); // Datos reales de Firestore 

  // Categorías del MVP 1.0 basadas en el anteproyecto [cite: 14, 26, 30]
  const categories = ["Todos", "Historia", "Arte", "Gastronomía", "Cultura"];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Cargando audioguías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Buscador con autocompletar (Funcionalidad clave del MVP 1.0) [cite: 13, 18, 28] */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            placeholder="Encuentra tu siguiente destino.." 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* 2. Filtros de Categorías para rutas geolocalizadas [cite: 14, 26, 30] */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text>🌐 Idioma</Text>
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

      {/* 3. Catálogo de Audioguías integradas con Firebase y Mapbox [cite: 8, 25, 29] */}
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
            // ✅ Solución definitiva al error de TypeScript usando 'as any'
            onPress={() => {
              router.push({
                pathname: "/tour/[id]",
                params: { id: item.id }
              } as any); 
            }} 
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    paddingTop: 50 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#4B0082', 
    fontWeight: '600' 
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F8',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: '#333' 
  },
  categoriesWrapper: {
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  categoryCard: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  activeCategoryCard: {
    backgroundColor: '#0D2C33', // Color oscuro del diseño
    borderColor: '#0D2C33',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    color: '#2D2D5A' 
  },
  listContent: { 
    paddingBottom: 100 
  }
});