// screens/exploreScreen.tsx

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { TourCard } from '../components/tourCard';
import { useFirebaseTours } from '../hooks/useFirebaseTours';
import { useCitySearch } from '../hooks/useCitySearch'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

export default function ExploreScreen() {
  const router = useRouter();
  
  // 1. Estados para Firebase y el Buscador
  const { tours, loading } = useFirebaseTours(); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. Usamos el hook de búsqueda
  const { results: searchResults, loadingSearch } = useCitySearch(searchQuery);

  const categories = ["Todos", "Historia", "Arte", "Gastronomía", "Cultura"];

  // 3. Optimizamos la extracción de ciudades y países de nuestra BD
  const availableLocationsInDB = useMemo(() => {
    // Mapeamos los tours para extraer ciudad y país normalizados
    return tours.map(t => ({
      id: t.id,
      city: t.city ? t.city.toLowerCase().trim() : '',
      country: t.country ? t.country.toLowerCase().trim() : ''
    }));
  }, [tours]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8C77ED" />
        <Text style={styles.loadingText}>Cargando audioguías...</Text>
      </View>
    );
  }

  // Renderizado condicional: ¿Estamos buscando o explorando?
  const isSearching = searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          {/* ✨ Icono morado de Figma */}
          <Ionicons name="search" size={20} color="#8C77ED" />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="¿Dónde quieres caminar hoy?" 
            style={styles.searchInput}
            placeholderTextColor={COLORS.placeholder}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Renderizado Condicional: Si estamos buscando, mostramos la lista de ciudades */}
      {isSearching ? (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <ActivityIndicator size="small" color="#8C77ED" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled" 
              renderItem={({ item }) => {
                const apiCity = item.name.toLowerCase().trim();
                const apiCountry = item.country.toLowerCase().trim();

                const matchingTour = availableLocationsInDB.find(
                  (loc) => loc.city === apiCity
                );

                const hasAudioGuide = !!matchingTour;

                return (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    activeOpacity={hasAudioGuide ? 0.2 : 1}
                    onPress={() => {
                      if (hasAudioGuide) {
                        router.push({ 
                          pathname: "/tour/[id]", 
                          params: { id: matchingTour.id } 
                        } as any);
                      }
                    }}
                  >
                    <View style={styles.searchResultTextContainer}>
                      <Ionicons name="location-outline" size={20} color={COLORS.text} style={{ marginRight: 10 }} />
                      <Text style={styles.searchResultCity}>{item.name}</Text>
                      <Text style={styles.searchResultCountry}>, {item.country}</Text>
                    </View>
                    
                    {hasAudioGuide && (
                      <View style={styles.audioBadge}>
                        <Ionicons name="headset" size={16} color={COLORS.white} />
                        <Text style={styles.audioBadgeText}>Audioguía</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                searchQuery.length >= 3 && !loadingSearch ? (
                   <Text style={styles.noResultsText}>No se encontraron ciudades.</Text>
                ) : null
              )}
            />
          )}
        </View>
      ) : (
        /* Vista normal de Explorar */
        <>
          <View style={styles.categoriesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={{ color: COLORS.text, fontWeight: '500' }}>🌐 Idioma</Text>
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

          <FlatList
            data={tours}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <Text style={styles.sectionTitle}>Audioguías cerca de ti</Text>
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
        </>
      )}
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
    color: '#8C77ED', 
    fontWeight: '600' 
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 20, // Un poco más de margen inferior para respirar
    zIndex: 1 
  },
  // ✨ Buscador estilo Cuadrangular (Squircle) con sombra sutil
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Blanco puro
    paddingHorizontal: 15,
    paddingVertical: 14, // Ligeramente más alto
    borderRadius: 12, // Forma cuadrangular
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3, // Sombra en Android
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: COLORS.text 
  },
  
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultCity: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchResultCountry: {
    fontSize: 16,
    color: COLORS.muted,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C77ED', // Morado Figma
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8, // Cuadrangular pequeño
  },
  audioBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.muted,
    fontSize: 14,
  },

  categoriesWrapper: {
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
    paddingBottom: 5,
  },
  // ✨ Botón de Filtro (Idioma) - Cuadrangular
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10, // Squircle
    borderWidth: 1,
    borderColor: '#EAEAEA', 
    backgroundColor: '#FFFFFF',
  },
  // ✨ Categorías - Cuadrangular
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10, // Squircle
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA', 
  },
  // ✨ Categoría Activa - Morado Figma
  activeCategoryCard: {
    backgroundColor: '#8C77ED', 
    borderColor: '#8C77ED',
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // ✨ Título "Audioguías cerca de ti"
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginHorizontal: 20, 
    marginBottom: 16, 
    marginTop: 10,
    color: COLORS.textDark 
  },
  listContent: { 
    paddingBottom: 100 
  }
});