// app/tour/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'; // Importamos Stack para controlar el Header
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTourDetails() {
      if (!id) return;
      try {
        const docRef = doc(db, "tours", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTour({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error al obtener detalles del tour:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTourDetails();
  }, [id]);

  if (loading) return (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color="#4B0082" />
    </View>
  );

  if (!tour) return (
    <View style={styles.loadingCenter}>
      <Text>No se encontró la audioguía.</Text>
    </View>
  );

  return (
    <>
      {/* ✅ Esta línea elimina el texto "tour/[id]" de la parte superior */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container}>
        {/* Cabecera con Imagen y Botón Volver */}
        <View style={styles.imageHeader}>
        <Image 
            source={{ 
            // Verificamos si existe el arrayimageUrl o el campo image
            uri: (tour.imageUrls && tour.imageUrls.length > 0) 
                ? tour.imageUrls[0] 
                : tour.image 
            }} 
            style={styles.headerImage} 
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        </View>

        {/* Cuerpo de la Información del Tour [cite: 13, 26] */}
        <View style={styles.content}>
          <Text style={styles.category}>{tour.category?.toUpperCase() || 'TURISMO'}</Text>
          <Text style={styles.title}>{tour.title}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#FF4D4D" />
            <Text style={styles.location}>{tour.city}, {tour.country || 'España'}</Text>
          </View>

          {/* Estadísticas de la ruta: duración, distancia y POIs [cite: 16, 33] */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.statText}>{tour.duration || 'N/A'}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={18} color="#666" />
              <Text style={styles.statText}>{tour.distance || 'N/A'}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="musical-notes-outline" size={18} color="#666" />
              <Text style={styles.statText}>{tour.numPoints || 0} puntos</Text>
            </View>
          </View>

            <Text style={styles.descriptionTitle}>Sobre esta ruta</Text>
            <Text style={styles.description}>
            {/* ✅ Ahora lee directamente lo que pongas en Firestore */}
            {tour.description || "No hay descripción disponible para esta ruta."}
            </Text>
        </View>

        {/* Footer con Precio y Acción de comenzar [cite: 35] */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Precio total</Text>
            <Text style={styles.price}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => {
              // Navegación dinámica al mapa activo pasando el tourId
              router.push({
                pathname: "/active-tour/[id]",
                params: { id: id }
              } as any);
            }}
          >
            <Text style={styles.ctaText}>Comenzar Ruta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageHeader: { height: 320, position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 10, 
    borderRadius: 25 
  },
  content: { padding: 20 },
  category: { color: '#6A5ACD', fontWeight: 'bold', fontSize: 13, marginBottom: 5, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  location: { color: '#666', marginLeft: 5, fontSize: 16 },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 20, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#F2F2F2', 
    marginBottom: 25 
  },
  statItem: { alignItems: 'center', flex: 1 },
  statText: { fontSize: 14, color: '#333', marginTop: 6, fontWeight: '500' },
  descriptionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#2D2D5A' },
  description: { fontSize: 16, color: '#555', lineHeight: 24 },
  footer: { 
    padding: 25, 
    borderTopWidth: 1, 
    borderColor: '#F2F2F2', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#FFF' 
  },
  priceLabel: { color: '#999', fontSize: 13, marginBottom: 2 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  ctaButton: { 
    backgroundColor: '#4B0082', 
    paddingHorizontal: 35, 
    paddingVertical: 16, 
    borderRadius: 18,
    shadowColor: '#4B0082',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  ctaText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 }
});