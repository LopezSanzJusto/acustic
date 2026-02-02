// screens/exploreScreen.tsx

import React from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TourCard } from '../components/tourCard';
import { useFirebaseTours } from '../hooks/useFirebaseTours';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme'; // ✅ Importamos el tema actualizado

export default function ExploreScreen() {
  const router = useRouter();
  const { tours, loading } = useFirebaseTours(); 

  const categories = ["Todos", "Historia", "Arte", "Gastronomía", "Cultura"];

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
    backgroundColor: COLORS.background, 
    paddingTop: 50 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    color: COLORS.primary, 
    fontWeight: '600' 
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground, // ✅ Usando tema
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: COLORS.text 
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
    borderColor: COLORS.border, // ✅ Usando tema
    backgroundColor: COLORS.surface,
  },
  categoryCard: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border, // ✅ Usando tema
  },
  activeCategoryCard: {
    backgroundColor: COLORS.textDark, // ✅ Usando tema
    borderColor: COLORS.textDark,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  activeCategoryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    color: COLORS.textDark // ✅ Usando tema
  },
  listContent: { 
    paddingBottom: 100 
  }
});