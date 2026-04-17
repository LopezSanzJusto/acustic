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
  ActivityIndicator,
  Image
} from 'react-native';
import { TourCard } from '../components/tourCard';
import { useFirebaseTours } from '../hooks/useFirebaseTours';
import { useCitySearch } from '../hooks/useCitySearch'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

// ✨ NUEVO: Función para limpiar tildes, acentos y mayúsculas
const normalizeText = (text?: string) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD") // Separa las letras de sus acentos
    .replace(/[\u0300-\u036f]/g, ""); // Borra los acentos
};

export default function ExploreScreen() {
  const router = useRouter();
  
  const { tours, loading } = useFirebaseTours(); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guardamos tanto la ciudad como el país para un filtrado exacto (normalizados)
  const [selectedLocation, setSelectedLocation] = useState<{city: string, country: string} | null>(null);
  
  const { results: searchResults, loadingSearch } = useCitySearch(searchQuery);

  const categories = ["Todos", "Historia", "Arte", "Gastronomía", "Cultura"];

  // ✨ ACTUALIZADO: Optimizamos la extracción usando textos normalizados
  const availableLocationsInDB = useMemo(() => {
    return tours.map(t => ({
      id: t.id,
      city: normalizeText(t.city),
      country: normalizeText(t.country),
      originalCity: t.city,
      originalCountry: t.country
    }));
  }, [tours]);

  // ✨ ACTUALIZADO: Filtramos comprobando ciudad Y país con la validación flexible
  const displayedTours = useMemo(() => {
    if (selectedLocation) {
      return tours.filter(t => {
        const tCity = normalizeText(t.city);
        const tCountry = normalizeText(t.country);
        
        const cityMatch = tCity === selectedLocation.city;
        
        const countryMatch = 
          !tCountry || 
          tCountry === selectedLocation.country || 
          selectedLocation.country.includes(tCountry) || 
          tCountry.includes(selectedLocation.country) || 
          (tCountry === 'espana' && selectedLocation.country === 'spain') || 
          (tCountry === 'spain' && selectedLocation.country === 'espana');
        
        return cityMatch && countryMatch;
      });
    }
    return tours; 
  }, [tours, selectedLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8C77ED" />
        <Text style={styles.loadingText}>Cargando audioguías...</Text>
      </View>
    );
  }

  // Actualizado para usar selectedLocation
  const showAutocomplete = searchQuery.length > 0 && !selectedLocation;

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconWrapper}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (selectedLocation) setSelectedLocation(null);
            }}
            placeholder="¿Dónde quieres caminar hoy?"
            style={styles.searchInput}
            placeholderTextColor={COLORS.placeholder}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { 
              setSearchQuery(''); 
              setSelectedLocation(null); // Limpiamos filtro
            }}>
              <Ionicons name="close-circle" size={20} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Renderizado Condicional */}
      {showAutocomplete ? (
        <View style={styles.searchResultsContainer}>
          {loadingSearch ? (
            <ActivityIndicator size="small" color="#8C77ED" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled" 
              renderItem={({ item }) => {
                // ✨ ACTUALIZADO: Normalizamos los datos que vienen de la API (Search)
                const apiCity = normalizeText(item.name);
                const apiCountry = normalizeText(item.country);

                // ✨ ACTUALIZADO: Validación flexible para detectar las guías en base de datos
                const hasAudioGuide = availableLocationsInDB.some((loc) => {
                  const cityMatch = loc.city === apiCity;
                  const countryMatch = 
                    !loc.country || 
                    loc.country === apiCountry || 
                    apiCountry.includes(loc.country) || 
                    loc.country.includes(apiCountry) ||
                    (loc.country === 'espana' && apiCountry === 'spain') ||
                    (loc.country === 'spain' && apiCountry === 'espana');

                  return cityMatch && countryMatch;
                });

                return (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    activeOpacity={hasAudioGuide ? 0.2 : 1}
                    onPress={() => {
                      if (hasAudioGuide) {
                        // Guardamos el par ciudad/país normalizado en el estado
                        setSelectedLocation({ city: apiCity, country: apiCountry });
                        setSearchQuery(item.name);
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
                        <Image 
                          source={require('../assets/images/logo.png')} 
                          style={styles.badgeLogo} 
                          resizeMode="contain" 
                        />
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
            data={displayedTours} 
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <Text style={styles.sectionTitle}>
                {selectedLocation ? `Resultados en ${searchQuery}` : 'Audioguías más próximas'}
              </Text>
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
    marginBottom: 20, 
    zIndex: 1 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#DDD8F5',
  },
  searchIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8C77ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    backgroundColor: '#8C77ED', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8, 
  },
  audioBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  badgeLogo: {
    width: 16,  // Ajusta este tamaño según lo grande que quieras el logo
    height: 16,
    tintColor: COLORS.white, // 💡 IMPORTANTE: Si tu logo original es negro/color, pero el fondo del badge es oscuro y quieres que el logo se vuelva blanco puro (como el icono de antes), descomenta esta línea.
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
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10, 
    borderWidth: 1,
    borderColor: '#EAEAEA', 
    backgroundColor: '#FFFFFF',
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10, 
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA', 
  },
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
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginHorizontal: 20, 
    marginBottom: 16, 
    marginTop: 10,
    color: COLORS.primary
  },
  listContent: { 
    paddingBottom: 100 
  }
});