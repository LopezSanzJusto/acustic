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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <Ionicons name="search" size={20} color={COLORS.placeholder} />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery} // Actualiza el estado al escribir
            placeholder="Encuentra tu siguiente destino.." 
            style={styles.searchInput}
            placeholderTextColor={COLORS.placeholder}
            autoCorrect={false}
          />
          {/* Botón para limpiar la búsqueda rápidamente */}
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
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled" // Permite pulsar resultados sin que el teclado lo bloquee
              renderItem={({ item }) => {
                // Normalizamos los datos de la API para compararlos
                const apiCity = item.name.toLowerCase().trim();
                const apiCountry = item.country.toLowerCase().trim();

                // Buscamos si hay un "match" exacto en nuestra base de datos (Ciudad + País)
                const matchingTour = availableLocationsInDB.find(
                  (loc) => loc.city === apiCity
                  // Descomenta la siguiente línea si quieres ser estricto también con el país:
                  // && loc.country === apiCountry 
                );

                const hasAudioGuide = !!matchingTour;

                return (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    activeOpacity={hasAudioGuide ? 0.2 : 1} // Si no hay guía, que no haga efecto de pulsado
                    onPress={() => {
                      if (hasAudioGuide) {
                        // Viajamos a la pantalla del tour usando el ID que encontramos
                        router.push({ 
                          pathname: "/tour/[id]", 
                          params: { id: matchingTour.id } 
                        } as any);
                      }
                      // Si no tiene guía, no hace nada al pulsar
                    }}
                  >
                    <View style={styles.searchResultTextContainer}>
                      <Ionicons name="location-outline" size={20} color={COLORS.text} style={{ marginRight: 10 }} />
                      <Text style={styles.searchResultCity}>{item.name}</Text>
                      <Text style={styles.searchResultCountry}>, {item.country}</Text>
                    </View>
                    
                    {/* La Marquita: Si tiene audioguía, mostramos el icono */}
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
        /* Vista normal de Explorar (Categorías y Tours) - Se oculta al buscar */
        <>
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
    color: COLORS.primary, 
    fontWeight: '600' 
  },
  searchContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 15,
    zIndex: 1 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground, 
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    borderColor: COLORS.border, 
    backgroundColor: COLORS.surface,
  },
  categoryCard: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border, 
  },
  activeCategoryCard: {
    backgroundColor: COLORS.textDark, 
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
    color: COLORS.textDark 
  },
  listContent: { 
    paddingBottom: 100 
  }
});