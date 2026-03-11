// app/tour/map/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../services/firebaseConfig';
import { useFirebasePoints } from '../../../hooks/useFirebasePoints';
import { useFavorites } from '../../../hooks/useFavorites'; // ✨ Importamos favoritos
import { MapDisplay } from '../../../components/mapDisplay';
import { TourFooter } from '../../../components/tourDetails/tourFooter';
import { COLORS, COMMON_STYLES } from '../../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TourMapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { points, loading: pointsLoading } = useFirebasePoints(id as string);
  const { isFavorite, toggleFavorite } = useFavorites(id as string); // ✨ Estado del corazón
  const [tourPrice, setTourPrice] = useState<number | null>(null);

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

      {/* === CABECERA BLANCA (Diseño Figma) === */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* Botón Atrás */}
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        {/* Título */}
        <Text style={styles.headerTitle}>Mapa del recorrido</Text>
        
        {/* Botón Corazón */}
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
            points={points} 
            showGeofence={false} 
            markerType="number"
            dashedRoute={true}
        />
      </View>

      {/* === CAPA INFERIOR (Footer) === */}
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
  
  // ✨ Estilos de la nueva cabecera
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
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: COLORS.textDark,
    fontSize: 16
  },

  // ✨ El mapa ahora toma el resto de la pantalla debajo de la cabecera
  mapContainer: { 
    flex: 1 
  },
  
  footerContainer: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  }
});