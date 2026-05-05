// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db, firestoreReady } from '../../services/firebaseConfig';
import NetInfo from '@react-native-community/netinfo';
import { readManifest } from '../../services/offlineManifest';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useFavorites } from '../../hooks/useFavorites';
import { useOfflineAssets } from '../../hooks/useOfflineAssets';
import { useFirebasePoints } from '../../hooks/useFirebasePoints';
import { usePurchaseTour } from '../../hooks/usePurchaseTour';
import { useMyTours } from '../../hooks/useMyTours';
import TrackPlayer from 'react-native-track-player';

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
  const { id, fromTrips } = useLocalSearchParams();
  const router = useRouter();
  
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculatedDistance, setCalculatedDistance] = useState<string>("Calculando...");
  const [calculatedDuration, setCalculatedDuration] = useState<string>('');

  const handleRouteCalculated = (distText: string) => {
    setCalculatedDistance(distText);
    const km = parseFloat(distText.replace(',', '.'));
    if (!isNaN(km) && km > 0) {
      const totalMinutes = (km / 4.5) * 60;
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.round(totalMinutes % 60);
      setCalculatedDuration(hours > 0 ? `${hours}h ${mins < 10 ? '0' : ''}${mins}m` : `${mins}m`);
    }
  };

  const { isFavorite, toggleFavorite } = useFavorites(id as string);
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
  const { addTourToMyList, isProcessing } = usePurchaseTour();
  const { purchasedTours } = useMyTours(); 

  const tourImages = useMemo(() => {
    if (!tour) return [];
    if (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) {
      return tour.imageUrls;
    }
    return tour.image ? [tour.image] : [];
  }, [tour]);

  useEffect(() => {
    if (!id) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const buildTourFromManifest = async () => {
      const manifest = await readManifest(id as string);
      if (!cancelled && manifest) {
        setTour({
          id: manifest.tourId,
          title: manifest.meta.title,
          city: manifest.meta.city,
          country: manifest.meta.country,
          duration: manifest.meta.duration,
          distance: manifest.meta.distance,
          rating: manifest.meta.rating,
          reviews: manifest.meta.reviews,
          introAudioUrl: manifest.introAudioUrl,
          imageUrls: manifest.coverImageUrls,
          // Si hay manifest descargado el usuario ya tiene acceso
          price: 0,
        });
      }
      if (!cancelled) setLoading(false);
    };

    const init = async () => {
      const netState = await NetInfo.fetch();
      const offline = !(netState.isConnected ?? true);

      if (offline) {
        await buildTourFromManifest();
        return;
      }

      await firestoreReady;
      if (cancelled) return;

      unsubscribe = onSnapshot(
        doc(db, 'tours', id as string),
        (snap) => {
          if (!cancelled) {
            if (snap.exists()) setTour({ id: snap.id, ...snap.data() });
            setLoading(false);
          }
        },
        async (error) => {
          console.error('Error al obtener detalles del tour:', error);
          await buildTourFromManifest();
        },
      );
    };

    init();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id]);

  const { resolvedPoints, resolvedIntroAudioUrl, resolvedCoverImages } = useOfflineAssets(
    id as string,
    points,
    tour?.introAudioUrl,
    tourImages,
  );

  const isFree = tour?.price === 0 || tour?.price === "0" || String(tour?.price).toLowerCase() === 'gratis';
  const isPurchased = purchasedTours.some((t: any) => t.id === id);
  const hasAccess = isFree || isPurchased;

  const handleStartRoute = async () => {
    if (!tour) return;

    // Invitado → al welcome, tanto si es gratis como si es de pago
    const { auth } = await import('../../services/firebaseConfig');
    if (!auth.currentUser) {
      void TrackPlayer.reset();
      router.push('/welcome' as any);
      return;
    }

    if (hasAccess) {
      // Si la ruta es gratuita y aún no está en "mis rutas", la añadimos antes de navegar
      if (isFree && !isPurchased) {
        const ok = await addTourToMyList(tour.id);
        if (!ok) return;
      }
      router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any);
      return;
    }
    Alert.alert(
      "Ruta Premium",
      "Esta ruta es de pago. Adquiérela para desbloquear la personalización y la experiencia completa.",
      [{ text: "Entendido", style: "default" }]
    );
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

  // ✅ 1. Extraemos todo el contenido SUPERIOR a una función
  const renderHeader = () => (
    <>
      <ImageSlider images={resolvedCoverImages.length > 0 ? resolvedCoverImages : tourImages} height={280} width={width} />
      <View style={styles.content}>
        <TourInfo title={tour.title} city={tour.city} country={tour.country} duration={calculatedDuration || tour.duration} distance={calculatedDistance !== "Calculando..." ? calculatedDistance : (tour.distance || "Calculando...")} points={points} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
        <TourStats listens={tour.listens || 0} rating={tour.rating || 0} reviews={tour.reviews || 0} />
        <TourIntroAudio
            title={tour.title}
            image={resolvedCoverImages[0] ?? tourImages[0]}
            audioUrl={resolvedIntroAudioUrl}
          />

        <Text style={styles.sectionTitle}>Mapa del tour</Text>
        <TourMapPreview tourId={id as string} points={points} onRouteCalculated={handleRouteCalculated} onPress={() => {
            router.push({ pathname: "/tour/map/[id]", params: { id: id } } as any);
          }}
        />

        <TourAudioPreview points={resolvedPoints} price={tour.price || 0} />

        {!hasAccess && (
          <TouchableOpacity style={styles.premiumButton} onPress={handleStartRoute}>
            <Ionicons name="lock-closed" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.premiumText}>Personaliza tu ruta (Premium)</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  // ✅ 2. Extraemos todo el contenido INFERIOR a otra función
  const renderFooter = () => (
    <View style={styles.content}>
      <TourReviews tourId={id as string} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        
        <TourHeader title={tour.title} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onBack={() => router.back()} />

        {/* ✅ AÑADIDO: Envolvemos la lista en un View con flex: 1. 
            Esto obliga a la lista a quedarse en el centro y respetar el espacio del footer */}
        <View style={{ flex: 1 }}>
          <TourPointList
            tourId={id as string}
            points={resolvedPoints}
            hasAccess={hasAccess}
            headerComponent={renderHeader()} 
            footerComponent={renderFooter()} 
          />
        </View>

        <TourFooter price={tour.price} hasAccess={hasAccess} onStart={handleStartRoute} isLoading={isProcessing} />
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
  premiumButton: {
    backgroundColor: '#D4AF37', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 10, marginBottom: 25,
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  },
  premiumText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});