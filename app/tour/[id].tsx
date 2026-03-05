// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useFavorites } from '../../hooks/useFavorites';
import { useFirebasePoints } from '../../hooks/useFirebasePoints';

// Componentes Modulares
import { TourHeader } from '../../components/tourDetails/tourHeader';
import { TourInfo } from '../../components/tourDetails/tourInfo';
import { TourStats } from '../../components/tourDetails/tourStats';
import { TourFooter } from '../../components/tourDetails/tourFooter';
import { TourIntroAudio } from '../../components/tourDetails/tourIntroAudio';
import { TourPointList } from '../../components/tourDetails/tourPointList';
import { TourReviews } from '../../components/tourDetails/tourReviews';
import { TourMapPreview } from '../../components/tourDetails/tourMapPreview';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADO PARA LA DISTANCIA CALCULADA
  const [calculatedDistance, setCalculatedDistance] = useState<string>("Calculando...");

  // Hooks de datos
  const { isFavorite, toggleFavorite } = useFavorites(id as string);
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);

  // Calculamos el ARRAY de imágenes para el Slider
  const tourImages = useMemo(() => {
    if (!tour) return [];
    if (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) {
      return tour.imageUrls;
    }
    return tour.image ? [tour.image] : [];
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

  if (loading || pointsLoading) return (
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
      
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* 1. Cabecera con Slider */}
          <TourHeader 
            images={tourImages} 
            onBack={() => router.back()} 
          />

          <View style={styles.content}>
            
            {/* 2. Info Principal */}
            <TourInfo 
              title={tour.title}
              city={tour.city}
              country={tour.country}
              duration={tour.duration}
              // ✅ Pasamos la distancia calculada (o un respaldo)
              distance={calculatedDistance !== "Calculando..." ? calculatedDistance : (tour.distance || "Calculando...")}
              // ✅ Usamos los puntos del hook directamente
              points={points}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />

            {/* 3. Estadísticas */}
            <TourStats 
              listens={tour.listens || 0}
              rating={tour.rating || 0}
              reviews={tour.reviews || 0}
            />
              
            {/* 4. Descripción */}
            <Text style={styles.description}>{tour.description}</Text>

            {/* 5. Botón Previsualización */}
            <TouchableOpacity style={styles.previewButton}>
               <Ionicons name="headset" size={20} color="white" style={{ marginRight: 8 }} />
               <Text style={styles.previewText}>Previsualización de la ruta</Text>
            </TouchableOpacity>

            {/* 6. Mapa del tour */}
            <Text style={styles.sectionTitle}>Mapa del tour</Text>
            
            <TourMapPreview 
               points={points} 
               // ✅ Recibimos la distancia y actualizamos el estado
               onRouteCalculated={(dist) => setCalculatedDistance(dist)}
               onPress={() => router.push({ pathname: "/tour/map/[id]", params: { id: id } } as any)}
            />

            {/* 7. Audio Intro */}
            <TourIntroAudio 
              title={tour.title} 
              image={tourImages[0]} 
              audioUrl={tour.introAudioUrl}
            />

            {/* 8. Lista de Puntos */}
            <TourPointList points={points} />

            {/* 9. Reviews */}
            <TourReviews />

          </View>
        </ScrollView>

        {/* Footer Pegajoso */}
        <TourFooter 
          price={tour.price} 
          onStart={() => router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  description: { fontSize: 15, color: COLORS.muted, lineHeight: 24, marginBottom: 20 },
  previewButton: {
    backgroundColor: '#8B5CF6', 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 12, marginBottom: 30,
    shadowColor: '#8B5CF6', shadowOffset: { width:0, height:4 }, shadowOpacity:0.3, shadowRadius:5
  },
  previewText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
});