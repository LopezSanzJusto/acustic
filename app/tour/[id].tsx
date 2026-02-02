// app/tour/[id].tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
// ✅ Importamos el nuevo componente
import { FloatingButton } from '../../components/floatingButton';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ... (Mismo código de mainImage y useEffect que tenías) ...
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
          
          {/* ✅ USO DEL COMPONENTE: Botón Atrás */}
          <FloatingButton 
            icon="arrow-back" 
            onPress={() => router.back()}
            style={{ top: 50, left: 20 }} // Posición específica para esta pantalla
          />
        </View>

        {/* ... (Resto del contenido igual: Title, Location, Stats, Description...) ... */}
        <View style={styles.content}>
            <Text style={styles.category}>{tour.category?.toUpperCase() || 'TURISMO'}</Text>
            <Text style={styles.title}>{tour.title}</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color={COLORS.error} />
                <Text style={styles.location}>{tour.city}, {tour.country || 'España'}</Text>
            </View>
             {/* ... stats ... */}
             <Text style={styles.descriptionTitle}>Sobre esta ruta</Text>
             <Text style={styles.description}>{tour.description}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
           {/* ... precio y botón comenzar ... */}
           <View>
            <Text style={styles.priceLabel}>Precio total</Text>
            <Text style={styles.price}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
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

// ... StatItem ...

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageHeader: { height: 320, position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover'},
  // 🗑️ ELIMINADO: backButton (ya no se usa)
  content: { padding: 20 },
  category: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginBottom: 5, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  location: { color: COLORS.muted, marginLeft: 5, fontSize: 16 },
  // ... resto de estilos (statsRow, statItem, etc) se mantienen igual ...
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  statItem: { alignItems: 'center', flex: 1 },
  statText: { fontSize: 14, color: COLORS.text, marginTop: 6, fontWeight: '500' },
  descriptionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: COLORS.text },
  description: { fontSize: 16, color: COLORS.muted, lineHeight: 24 },
  footer: { padding: 25, borderTopWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, marginBottom: 20 },
  priceLabel: { color: COLORS.placeholder, fontSize: 13, marginBottom: 2 },
  price: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  ctaButton: { backgroundColor: COLORS.primary, paddingHorizontal: 35, paddingVertical: 16, borderRadius: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  ctaText: { color: COLORS.white, fontWeight: 'bold', fontSize: 17 }
});