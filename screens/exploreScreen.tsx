import React from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ScrollView } from 'react-native';
import { TourCard } from '../components/tourCard';

// Datos de prueba (luego vendrán de Firestore)
const TOURS_DATA = [
  { id: '1', title: 'El barrio de La Latina', city: 'Madrid', country: 'España', price: '4.95€', duration: '2:00h', distance: '4.5km', audioCount: 9, rating: 4.8, reviews: 18, image: 'https://via.placeholder.com/400', category: 'Historia' },
  { id: '2', title: 'Un paseo por el Cairo', city: 'Giza', country: 'Egipto', price: 'Gratis', duration: '3:30h', distance: '6km', audioCount: 12, rating: 4.9, reviews: 32, image: 'https://via.placeholder.com/400', category: 'Historia' },
];

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      {/* Buscador - Funcionalidad clave MVP 1.0 */}
      <View style={styles.searchContainer}>
        <TextInput 
          placeholder="Encuentra tu siguiente destino..." 
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={TOURS_DATA}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.sectionTitle}>Audioguías más escuchadas</Text>
        )}
        renderItem={({ item }) => (
          <TourCard 
            tour={item} 
            onPress={() => console.log("Navegar al mapa de", item.title)} 
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchInput: { backgroundColor: '#EEE', padding: 15, borderRadius: 15, fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15, color: '#4B0082' }
});