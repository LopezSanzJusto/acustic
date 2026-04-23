// app/tour/map/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { db, firestoreReady } from '../../../services/firebaseConfig';
import { useFirebasePoints } from '../../../hooks/useFirebasePoints';
import { MapDisplay } from '../../../components/mapDisplay';
import { TourFooter } from '../../../components/tourDetails/tourFooter';
import { FloatingButton } from '../../../components/floatingButton';
import { COLORS, COMMON_STYLES } from '../../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePurchaseTour } from '../../../hooks/usePurchaseTour';
import { stopActiveAudio } from '../../../utils/audioRegistry';

export default function TourMapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
  
  // ✅ Usamos undefined en vez de null para alinear con el tipado de TypeScript
  const [tourPrice, setTourPrice] = useState<number | undefined>(undefined);
  const { addTourToMyList, isProcessing } = usePurchaseTour();

  useEffect(() => {
    let isMounted = true;
    const fetchPrice = async () => {
      try {
        await firestoreReady;
        const docRef = doc(db, "tours", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          // Obtenemos los datos de forma segura
          const data = snap.data();
          // Si data o price son undefined, asignamos 0
          setTourPrice(data?.price ?? 0); 
        }
      } catch(e) { 
        console.error("Error fetching price for map:", e);
      }
    };
    fetchPrice();
    return () => { isMounted = false; }
  }, [id]);

  const handleStartRoute = async () => {
    if (tourPrice === undefined) return;

    const { auth } = await import('../../../services/firebaseConfig');
    if (!auth.currentUser) {
      stopActiveAudio();
      router.push('/welcome' as any);
      return;
    }

    if (tourPrice === 0) {
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

  // ✅ Solo renderizamos si ya tenemos los puntos y el precio
  if (pointsLoading || tourPrice === undefined) {
    return (
        <View style={COMMON_STYLES.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapContainer}>
        <MapDisplay
            location={null}
            points={points}
            showGeofence={false}
        />
      </View>

      <View 
        style={[styles.uiLayer, { paddingTop: insets.top + 10 }]} 
        pointerEvents="box-none"
      >
        <View style={styles.headerRow}>
          <FloatingButton 
             icon="arrow-back" 
             onPress={() => router.back()} 
             style={{ position: 'relative', top: 0, left: 0 }} 
          />
          
          <View style={styles.titlePill}>
            <Text style={styles.titleText}>Mapa del recorrido</Text>
          </View>
          
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
        <TourFooter 
            price={tourPrice} 
            onStart={handleStartRoute}
            isLoading={isProcessing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { ...StyleSheet.absoluteFillObject }, 
  
  uiLayer: {
    position: 'absolute', 
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titlePill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  titleText: {
    fontWeight: 'bold',
    color: COLORS.textDark,
    fontSize: 16
  },
  footerContainer: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, 
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  }
});