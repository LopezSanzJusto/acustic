// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useFavorites } from '../../hooks/useFavorites';
import { useFirebasePoints } from '../../hooks/useFirebasePoints';
import { usePurchaseTour } from '../../hooks/usePurchaseTour'; // ✨ Importamos el nuevo hook

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
  
  const [calculatedDistance, setCalculatedDistance] = useState<string>("Calculando...");

  // Hooks de datos
  const { isFavorite, toggleFavorite } = useFavorites(id as string);
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
  
  // ✨ Hook de adquisición de ruta
  const { addTourToMyList, isProcessing } = usePurchaseTour();

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

  // ✨ Función que gestiona el botón del Footer
  const handleStartRoute = async () => {
    if (!tour) return;

    if (tour.price === 0) {
      // Si es gratis (como tu nuevo tour madrid-la-latina-gratis)
      const success = await addTourToMyList(id as string);
      if (success) {
        // Redirige al mapa activo
        router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any);
      }
    } else {
      // Si es de pago (precio mayor a 0)
      Alert.alert(
        "Ruta Premium",
        "Esta ruta es de pago. En esta versión de demostración la pasarela de pago no está habilitada, pero puedes guardarla en favoritos (❤️).",
        [{ text: "Entendido", style: "default" }]
      );
    }
  };

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
          
          {/* 1. FOTOS: Cabecera con Slider */}
          <TourHeader 
            images={tourImages} 
            title={tour.title}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onBack={() => router.back()} 
          />

          <View style={styles.content}>
            
            {/* Info y Estadísticas */}
            <TourInfo 
              title={tour.title}
              city={tour.city}
              country={tour.country}
              duration={tour.duration}
              distance={calculatedDistance !== "Calculando..." ? calculatedDistance : (tour.distance || "Calculando...")}
              points={points}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
            <TourStats 
              listens={tour.listens || 0}
              rating={tour.rating || 0}
              reviews={tour.reviews || 0}
            />
              
            {/* 2. INTRODUCCIÓN */}
            <TourIntroAudio 
              title={tour.title} 
              image={tourImages[0]} 
              audioUrl={tour.introAudioUrl}
            />

            {/* Botón Previsualización */}
            <TouchableOpacity style={styles.previewButton}>
               <Ionicons name="headset" size={20} color="white" style={{ marginRight: 8 }} />
               <Text style={styles.previewText}>Previsualización de la ruta</Text>
            </TouchableOpacity>

            {/* 3. MAPA: Mapa del tour */}
            <Text style={styles.sectionTitle}>Mapa del tour</Text>
            <TourMapPreview 
               points={points} 
               onRouteCalculated={(dist) => setCalculatedDistance(dist)}
               onPress={() => router.push({ pathname: "/tour/map/[id]", params: { id: id } } as any)}
            />

            {/* 4. PERSONALIZA: Lista de Puntos */}
            <TourPointList points={points} />

            {/* 5. VALÓRANOS: Reviews */}
            <TourReviews />

          </View>
        </ScrollView>

        {/* Footer Pegajoso con Lógica de Pago o Gratis ✨ */}
        <TourFooter 
          price={tour.price} 
          onStart={handleStartRoute}
          isLoading={isProcessing} // Pasamos el estado de carga al footer
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  previewButton: {
    backgroundColor: '#8B5CF6', 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 12, marginBottom: 30,
    shadowColor: '#8B5CF6', shadowOffset: { width:0, height:4 }, shadowOpacity:0.3, shadowRadius:5,
    marginTop: 20
  },
  previewText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
});