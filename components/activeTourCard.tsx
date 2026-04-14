// components/activeTourCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { collection, getDocs } from 'firebase/firestore'; // Ya no necesitamos query ni orderBy aquí
import { db } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';
import { ImageSlider } from './imageSlider';
import { CircularProgress } from './circularProgress'; 

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

interface ActiveTourCardProps {
  tour: any; 
  onPress: () => void;
}

export const ActiveTourCard = ({ tour, onPress }: ActiveTourCardProps) => {
  // ✨ Ya no necesitamos el estado de progreso porque viene inyectado directamente desde la BD
  const progress = tour.progressPercentage || 0; 
  
  const [pointsCount, setPointsCount] = useState(0);

  useEffect(() => {
    async function getPointsCount() {
      if (!tour.id) return;
      try {
        const pointsRef = collection(db, "tours", tour.id, "points");
        // ✨ Optimización de rendimiento: en lugar de descargar todos los datos 
        // de los puntos, solo pedimos el 'size' (el recuento total).
        const snapshot = await getDocs(pointsRef);
        setPointsCount(snapshot.size); 
      } catch (e) { console.log(e); }
    }
    getPointsCount();
  }, [tour.id]);

  const images = (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) 
    ? tour.imageUrls : [tour.image];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <ImageSlider images={images} width={CARD_WIDTH} height={140} onPress={onPress} />
      </View>

      <View style={styles.content}>
        <View style={styles.mainRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={COLORS.muted} />
              <Text style={styles.cityText}>{tour.city}</Text>
            </View>
            <Text style={styles.pointsText}>{pointsCount} paradas en total</Text>
          </View>

          <View style={styles.progressColumn}>
            {/* ✨ Le pasamos la variable directa limpia de carga */}
            <CircularProgress percentage={progress} size={55} strokeWidth={5} />
          </View>
        </View>

        <View style={styles.footer}>
            <View style={styles.footerItem}>
                 <Ionicons name="walk" size={14} color={COLORS.primary} />
                 <Text style={styles.footerText}>{tour.distance || "0"} km</Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={onPress}>
                <Text style={styles.continueText}>Continuar</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 20, elevation: 4, marginHorizontal: 15, overflow: 'hidden' },
  imageContainer: { height: 140 },
  content: { padding: 16 },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  infoColumn: { flex: 1, paddingRight: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  cityText: { fontSize: 13, color: COLORS.muted },
  pointsText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  progressColumn: { alignItems: 'center', justifyContent: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: COLORS.textDark, fontWeight: '500' },
  continueButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  continueText: { fontSize: 13, color: COLORS.primary, fontWeight: 'bold' }
});