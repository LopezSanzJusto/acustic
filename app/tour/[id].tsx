// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { COLORS, COMMON_STYLES } from '../../utils/theme';

// Hooks
import { useFavorites } from '../../hooks/useFavorites';
import { useFirebasePoints } from '../../hooks/useFirebasePoints';
import { usePurchaseTour } from '../../hooks/usePurchaseTour';

// Componentes Modulares
import { TourHeader } from '../../components/tourDetails/tourHeader';
import { TourInfo } from '../../components/tourDetails/tourInfo';
import { TourStats } from '../../components/tourDetails/tourStats';
import { TourFooter } from '../../components/tourDetails/tourFooter';
import { TourIntroAudio } from '../../components/tourDetails/tourIntroAudio';
import { TourPointList } from '../../components/tourDetails/tourPointList';
import { TourReviews } from '../../components/tourDetails/tourReviews';
import { TourMapPreview } from '../../components/tourDetails/tourMapPreview';
import { TourAudioPreview } from '../../components/tourDetails/tourAudioPreview';
import { ImageSlider } from '../../components/imageSlider'; 

const { width } = Dimensions.get('window');

export default function TourDetailScreen() {
  // ✨ EXTRAEMOS 'fromTrips' DE LOS PARÁMETROS
  const { id, fromTrips } = useLocalSearchParams();
  const router = useRouter();
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculatedDistance, setCalculatedDistance] = useState<string>("Calculando...");

  const { isFavorite, toggleFavorite } = useFavorites(id as string);
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
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

  // ✨ LÓGICA PARA OCULTAR PREVISUALIZACIÓN DE AUDIO
  const isFromTrips = fromTrips === 'true';
  const isFree = tour?.price === 0 || tour?.price === "0" || String(tour?.price).toLowerCase() === 'gratis';
  const shouldHideAudioPreview = isFromTrips && isFree;

  const handleStartRoute = async () => {
    if (!tour) return;
    if (tour.price === 0) {
      const success = await addTourToMyList(id as string);
      if (success) {
        router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any);
      }
    } else {
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
        
        <TourHeader
          title={tour.title}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onBack={() => router.back()}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <ImageSlider
            images={tourImages}
            height={280}
            width={width}
          />

          <View style={styles.content}>
            
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
              
            <TourIntroAudio
              title={tour.title}
              image={tourImages[0]}
              audioUrl={tour.introAudioUrl}
            />

            {/* ✨ RENDERIZADO CONDICIONAL DE LA PREVISUALIZACIÓN DE AUDIO */}
            {!shouldHideAudioPreview && (
              <TourAudioPreview points={points} price={tour.price || 0} />
            )}

            <Text style={styles.sectionTitle}>Mapa del tour</Text>
            
            <TourMapPreview
               points={points}
               onRouteCalculated={(dist) => setCalculatedDistance(dist)}
               onPress={() => router.push({ pathname: "/tour/map/[id]", params: { id: id } } as any)}
            />

            <TourPointList points={points} />

            <TourReviews />

          </View>
        </ScrollView>

        <TourFooter
          price={tour.price}
          onStart={handleStartRoute}
          isLoading={isProcessing}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
});