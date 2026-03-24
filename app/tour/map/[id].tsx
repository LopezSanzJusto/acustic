import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { useFirebasePoints } from '../../../hooks/useFirebasePoints';
import { useFavorites } from '../../../hooks/useFavorites'; 
import { MapDisplay } from '../../../components/mapDisplay';
import { TourFooter } from '../../../components/tourDetails/tourFooter';
import { COLORS, COMMON_STYLES } from '../../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✨ NUEVO: Importamos nuestro hook global
import { useCustomRoute } from '../../../hooks/useCustomRoute'; 

export default function TourMapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
  const { isFavorite, toggleFavorite } = useFavorites(id as string); 
  const [tourPrice, setTourPrice] = useState<number | null>(null);

  // ✨ NUEVO: Extraemos la ruta filtrada y la función para inicializarla
  const { activeRoutePoints, setInitialPoints } = useCustomRoute();

  // Sincronizamos por si el usuario entra directo a este mapa (por ejemplo, vía Deep Link)
  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  // Si ya tenemos la ruta filtrada, la usamos. Si no, esperamos con un array vacío.
  const routeToUse = activeRoutePoints.length > 0 ? activeRoutePoints : [];

  useEffect(() => {
    const fetchPrice = async () => {
        try {
          const docRef = doc(db, "tours", id as string);
          const snap = await getDoc(docRef);
          if(snap.exists()) setTourPrice(snap.data().price);
        } catch(e) { console.error(e) }
    };
    fetchPrice();
  }, [id]);

  if (pointsLoading) {
    return (
        <View style={COMMON_STYLES.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* === CABECERA === */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mapa del recorrido</Text>
        
        <TouchableOpacity onPress={toggleFavorite} style={styles.headerIcon}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* === MAPA === */}
      <View style={styles.mapContainer}>
        <MapDisplay 
            location={null} 
            // ✨ PASAMOS LA RUTA FILTRADA
            points={routeToUse} 
            showGeofence={false} 
            markerType="number"
            dashedRoute={true}
        />
      </View>

      {/* === CAPA INFERIOR === */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
        <TourFooter 
            price={tourPrice || 0} 
            onStart={() => router.push({ pathname: "/active-tour/[id]", params: { id: id } } as any)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: { padding: 5 },
  headerTitle: { fontWeight: 'bold', color: COLORS.textDark, fontSize: 16 },
  mapContainer: { flex: 1 },
  footerContainer: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  }
});