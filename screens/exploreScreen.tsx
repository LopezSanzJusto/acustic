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

  const categories = [
    { label: 'Todos',       icon: null },
    { label: 'Historia',    icon: '🏛' },
    { label: 'Arte',        icon: '🎨' },
    { label: 'Gastronomía', icon: '🍽' },
    { label: 'Cultura',     icon: '🎭' },
  ];

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

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
  };

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchRow}>
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        )}
        <View style={[styles.searchBar, searchQuery.length > 0 && styles.searchBarActive]}>
          <Ionicons name="search" size={18} color="#8C77ED" style={styles.searchIcon} />
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
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={COLORS.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Renderizado Condicional */}
      {showAutocomplete ? (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.suggestionsTitle}>Sugerencias para tu búsqueda</Text>
          {loadingSearch ? (
            <ActivityIndicator size="small" color="#8C77ED" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const apiCity = normalizeText(item.name);
                const apiCountry = normalizeText(item.country);

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

                const label = [item.name, item.region, item.country].filter(Boolean).join(', ');

                return (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    activeOpacity={hasAudioGuide ? 0.2 : 0.6}
                    onPress={() => {
                      if (hasAudioGuide) {
                        setSelectedLocation({ city: apiCity, country: apiCountry });
                        setSearchQuery(item.name);
                      }
                    }}
                  >
                    <Ionicons name="search" size={18} color="#8C77ED" style={styles.resultSearchIcon} />
                    <Text style={styles.searchResultText} numberOfLines={1}>{label}</Text>
                    {hasAudioGuide && (
                      <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.audioIcon}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() =>
                searchQuery.length >= 3 && !loadingSearch ? (
                  <Text style={styles.noResultsText}>No se encontraron ciudades.</Text>
                ) : null
              }
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
                  style={[styles.categoryCard, cat.label === 'Todos' && styles.activeCategoryCard]}
                >
                  <Text style={[styles.categoryText, cat.label === 'Todos' && styles.activeCategoryText]}>
                    {cat.icon ? `${cat.icon} ${cat.label}` : cat.label}
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
                {selectedLocation ? `Audioguías en ${searchQuery}` : 'Audioguías más próximas'}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
    zIndex: 1,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#DDD8F5',
  },
  searchBarActive: {
    borderColor: '#8C77ED',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  resultSearchIcon: {
    marginRight: 14,
  },
  searchResultText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.muted,
  },
  audioIcon: {
    width: 20,
    height: 20,
    tintColor: '#8C77ED',
    marginLeft: 8,
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
    paddingHorizontal: 13,
    paddingVertical: 7,
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
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
    color: COLORS.primary,
  },
  listContent: { 
    paddingBottom: 100 
  }
});