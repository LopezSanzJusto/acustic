// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
import { useFavorites } from '../../hooks/useFavorites';

// ✅ Importamos los componentes modulares
import { TourHeader } from '../../components/tourDetails/tourHeader';
import { TourInfo } from '../../components/tourDetails/tourInfo';
import { TourStats } from '../../components/tourDetails/tourStats';
import { TourFooter } from '../../components/tourDetails/tourFooter';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hook de lógica de negocio (Favoritos)
  const { isFavorite, toggleFavorite } = useFavorites(id as string);

  // Calculamos la imagen principal
  const mainImage = useMemo(() => {
    if (!tour) return null;
    return (tour.imageUrls && tour.imageUrls.length > 0) ? tour.imageUrls[0] : tour.image;
  }, [tour]);

  // Carga de datos
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
        
        {/* 1. Cabecera con Imagen */}
        <TourHeader 
          imageUrl={mainImage} 
          onBack={() => router.back()} 
        />

        {/* 2. Contenido Principal */}
        <View style={styles.content}>
          <TourInfo 
            title={tour.title}
            category={tour.category}
            city={tour.city}
            country={tour.country}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />

          <TourStats 
            duration={tour.duration}
            distance={tour.distance}
            numPoints={tour.numPoints}
          />
            
          <Text style={styles.descriptionTitle}>Sobre esta ruta</Text>
          <Text style={styles.description}>{tour.description}</Text>
        </View>

        {/* 3. Footer con Precio y Botón */}
        <TourFooter 
          price={tour.price} 
          onStart={() => router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any)}
        />

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  descriptionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: COLORS.text },
  description: { fontSize: 16, color: COLORS.muted, lineHeight: 24 },
});