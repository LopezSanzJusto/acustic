// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
// Importamos tu tema centralizado
import { COLORS, COMMON_STYLES } from '../../utils/theme';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Mejora de Lógica: Centralizamos la decisión de la imagen
  const mainImage = useMemo(() => {
    if (!tour) return null;
    return (tour.imageUrls && tour.imageUrls.length > 0) ? tour.imageUrls[0] : tour.image;
  }, [tour]);

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

  // 2. Uso de estilos comunes para estados de carga/error
  if (loading) return (
    <View style={COMMON_STYLES.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (!tour) return (
    <View style={COMMON_STYLES.centerContainer}>
      <Text style={{ color: COLORS.muted }}>No se encontró la audioguía.</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cabecera */}
        <View style={styles.imageHeader}>
          <Image source={{ uri: mainImage }} style={styles.headerImage} />
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.category}>{tour.category?.toUpperCase() || 'TURISMO'}</Text>
          <Text style={styles.title}>{tour.title}</Text>
          
          <View style={styles.locationRow}>
            {/* Usamos el color de error para el pin, o podrías agregar un color 'red' al theme */}
            <Ionicons name="location-sharp" size={16} color="#FF4D4D" />
            <Text style={styles.location}>{tour.city}, {tour.country || 'España'}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem icon="time-outline" text={tour.duration || 'N/A'} />
            <StatItem icon="walk-outline" text={tour.distance || 'N/A'} />
            <StatItem icon="musical-notes-outline" text={`${tour.numPoints || 0} puntos`} />
          </View>

          <Text style={styles.descriptionTitle}>Sobre esta ruta</Text>
          <Text style={styles.description}>
            {tour.description || "No hay descripción disponible para esta ruta."}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Precio total</Text>
            <Text style={styles.price}>
              {tour.price === 0 ? "Gratis" : `${tour.price}€`}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any)}
          >
            <Text style={styles.ctaText}>Comenzar Ruta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// Pequeño componente local para no repetir código en los Stats
const StatItem = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={18} color={COLORS.muted} />
    <Text style={styles.statText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  imageHeader: { 
    height: 320, 
    position: 'relative' 
  },
  headerImage: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'cover'
  },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 10, 
    borderRadius: 25,
    zIndex: 10
  },
  content: { 
    padding: 20 
  },
  category: { 
    color: COLORS.primary, // Antes #6A5ACD, unificado al primario
    fontWeight: 'bold', 
    fontSize: 13, 
    marginBottom: 5, 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.text, // Antes #1A1A1A
    marginBottom: 10 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  location: { 
    color: COLORS.muted, // Antes #666
    marginLeft: 5, 
    fontSize: 16 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 20, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#F2F2F2', // Podrías añadir un color 'border' a tu theme
    marginBottom: 25 
  },
  statItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  statText: { 
    fontSize: 14, 
    color: COLORS.text, // Antes #333
    marginTop: 6, 
    fontWeight: '500' 
  },
  descriptionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: COLORS.text // Antes #2D2D5A (Azul oscuro), unificado a texto
  },
  description: { 
    fontSize: 16, 
    color: '#555', // Un gris intermedio, podrías usar COLORS.muted
    lineHeight: 24 
  },
  footer: { 
    padding: 25, 
    borderTopWidth: 1, 
    borderColor: '#F2F2F2', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginBottom: 20 // Espacio extra para móviles con notch inferior
  },
  priceLabel: { 
    color: '#999', 
    fontSize: 13, 
    marginBottom: 2 
  },
  price: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.text 
  },
  ctaButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 35, 
    paddingVertical: 16, 
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  ctaText: { 
    color: COLORS.white, 
    fontWeight: 'bold', 
    fontSize: 17 
  }
});