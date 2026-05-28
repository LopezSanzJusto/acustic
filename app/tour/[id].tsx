// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../../services/firebaseConfig';
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
import { publishTour } from '../../services/creatorService';

const { width } = Dimensions.get('window');

export default function TourDetailScreen() {
  const { id, fromTrips, preview, publishMode } = useLocalSearchParams();
  const router = useRouter();
  const previewRequested = preview === '1';
  const publishModeRequested = publishMode === '1';

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
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
    const cover: string | null = tour.coverImageUrl ?? tour.image ?? null;
    // El carrusel se compone de la portada (primero) + la imagen de cada
    // parada en el orden definido por el creador. `points` ya viene
    // ordenado por `order` desde el hook.
    const pointImages: string[] = (points ?? [])
      .map((p: any) => p.image)
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
    const ordered = cover ? [cover, ...pointImages.filter((u) => u !== cover)] : pointImages;
    if (ordered.length > 0) return ordered;
    // Fallback final para tours antiguos sin nada de lo anterior.
    if (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) {
      return tour.imageUrls;
    }
    return [];
  }, [tour, points]);

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

  // El parámetro `?preview=1` por sí solo NO desbloquea nada: solo
  // funciona si el usuario autenticado es el creador real de este tour
  // (comparado contra `creatorId` ya cargado de Firestore). Así un
  // atacante no puede pintar `?preview=1` en una URL de un tour de pago
  // y verlo gratis. Las reglas de Storage/audio premium deben hacer la
  // misma comprobación server-side; aquí sólo controlamos la UI.
  const currentUid = auth.currentUser?.uid ?? null;
  const isCreatorOfThisTour = !!(
    currentUid && tour?.creatorId && tour.creatorId === currentUid
  );
  const isPreview = previewRequested && isCreatorOfThisTour;
  const isPublishPreview = isPreview && publishModeRequested;

  const hasAccess = isPreview || isFree || isPurchased;

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      await publishTour(id as string);
      router.replace('/(tabs)/trips' as any);
      Alert.alert('¡Publicado!', 'Tu audioguía ya está disponible.');
    } catch (e: any) {
      Alert.alert(
        'No se puede publicar todavía',
        e?.message ?? 'Inténtalo de nuevo en unos minutos.',
      );
    } finally {
      setPublishing(false);
    }
  };

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

  // El modelo nuevo guarda un único `destination`; el viejo, `city`+`country`.
  // TourInfo pinta "{city}, {country}", así que partimos `destination` por la
  // primera coma para que la cabecera siga teniendo el mismo formato.
  let tourCityLabel: string = tour.city ?? '';
  let tourCountryLabel: string = tour.country ?? '';
  if (!tourCityLabel && !tourCountryLabel && typeof tour.destination === 'string') {
    const parts = tour.destination.split(',').map((s: string) => s.trim()).filter(Boolean);
    tourCityLabel = parts[0] ?? '';
    tourCountryLabel = parts.slice(1).join(', ');
  }

  // ✅ 1. Extraemos todo el contenido SUPERIOR a una función
  const renderHeader = () => (
    <>
      <ImageSlider images={tourImages.length > 0 ? tourImages : resolvedCoverImages} height={280} width={width} />
      <View style={styles.content}>
        <TourInfo title={tour.title} city={tourCityLabel} country={tourCountryLabel} duration={calculatedDuration || tour.duration} distance={calculatedDistance !== "Calculando..." ? calculatedDistance : (tour.distance || "Calculando...")} points={points} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
        {isFree && <TourStats listens={tour.listens || 0} rating={tour.rating || 0} reviews={tour.reviews || 0} />}
        <TourIntroAudio
            title={tour.title}
            image={tourImages[0] ?? resolvedCoverImages[0]}
            audioUrl={resolvedIntroAudioUrl}
          />

        <Text style={styles.sectionTitle}>Mapa del tour</Text>
        <TourMapPreview tourId={id as string} points={points} onRouteCalculated={handleRouteCalculated} onPress={() => {
            router.push({ pathname: "/tour/map/[id]", params: { id: id } } as any);
          }}
        />

        <TourAudioPreview points={resolvedPoints} price={tour.price || 0} />

      </View>
    </>
  );

  // ✅ 2. Extraemos todo el contenido INFERIOR a otra función
  const renderFooter = () => (
    <View style={styles.content}>
      {isFree && <TourReviews tourId={id as string} hasAccess={hasAccess} previewMode={isPreview} />}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>

        <TourHeader title={tour.title} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onBack={() => router.back()} />

        {isPreview && (
          <View style={styles.previewBanner}>
            <Ionicons name="eye-outline" size={16} color={COLORS.white} />
            <Text style={styles.previewBannerText}>
              {isPublishPreview
                ? 'Estás a un paso — así verán los usuarios tu audioguía'
                : 'Vista previa — así verán los usuarios tu audioguía'}
            </Text>
          </View>
        )}

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

        {isPublishPreview ? (
          <View style={styles.previewFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePublish}
              disabled={publishing}
              style={[styles.previewFooterBtn, publishing && { opacity: 0.6 }]}
            >
              {publishing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color={COLORS.white} />
                  <Text style={styles.previewFooterBtnText}>Publicar audioguía</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : isPreview ? (
          <View style={styles.previewFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={styles.previewFooterBtn}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.white} />
              <Text style={styles.previewFooterBtnText}>Volver al editor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TourFooter price={tour.price} hasAccess={hasAccess} onStart={handleStartRoute} isLoading={isProcessing} />
        )}
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },

  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  previewBannerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  previewFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  previewFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  previewFooterBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});