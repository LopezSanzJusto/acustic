// components/tourCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

// Hooks
import { useFavorites } from '../hooks/useFavorites';
import { useSingleAudio } from '../hooks/useSingleAudio'; // ✨ Importamos tu hook de audio

import { db } from '../services/firebaseConfig';
import { getDistanceInMeters } from '../utils/geo';
import { COLORS } from '../utils/theme';
import { ImageSlider } from './imageSlider';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

interface TourCardProps {
  tour: any; 
  onPress: () => void;
  // ✨ Ya no necesitamos isIntroPlaying ni onToggleIntro como props, la tarjeta se gestiona sola
}

export const TourCard = ({ tour, onPress }: TourCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites(tour.id);
  
  // ✨ Hook de audio instanciado directamente en la tarjeta (Lazy Loading)
  const { isPlaying, isLoading, togglePlayPause } = useSingleAudio(tour.introAudioUrl);
  
  const [realPointsCount, setRealPointsCount] = useState(0);
  const [preciseDistance, setPreciseDistance] = useState<string>("0.00");
  const [calculatedTime, setCalculatedTime] = useState<string>("0h 0m");

  useEffect(() => {
    async function getRealData() {
      if (!tour.id) return;
      try {
        const pointsRef = collection(db, "tours", tour.id, "points");
        const q = query(pointsRef, orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const pointsArray = snapshot.docs.map(doc => doc.data());
        
        setRealPointsCount(pointsArray.length);

        if (pointsArray.length > 1) {
          let totalMeters = 0;
          for (let i = 0; i < pointsArray.length - 1; i++) {
            const p1 = pointsArray[i];
            const p2 = pointsArray[i + 1];
            if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
              totalMeters += getDistanceInMeters(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
            }
          }
          
          const kms = totalMeters / 1000;
          setPreciseDistance(kms.toFixed(2));

          const totalMinutes = (kms / 4.5) * 60;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          setCalculatedTime(`${hours}h ${minutes}m`);
        } else {
          setPreciseDistance(tour.distance || "0.00");
          setCalculatedTime(tour.duration || "N/A");
        }
      } catch (e) {
        console.log("Error al procesar datos reales:", e);
      }
    }
    getRealData();
  }, [tour.id]);

  const images = (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) 
    ? tour.imageUrls 
    : [tour.image];

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageSlider images={images} width={CARD_WIDTH} height={200} onPress={onPress} />
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>

        {/* ✨ NUEVO: Botón Favorito (Cuadrangular, Fill/Stroke y Morado Figma) */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite} 
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Mejora de usabilidad
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color="#8C77ED" // Color morado basado en tu diseño de Figma
          />
        </TouchableOpacity>

        {/* Botón de Intro (Play/Pause) - Abajo a la derecha */}
        {tour.introAudioUrl && (
          <TouchableOpacity 
            style={[styles.introButton, isPlaying && styles.introPlayingBg]} 
            onPress={togglePlayPause} 
            activeOpacity={0.8}
            disabled={isLoading} // Bloqueamos el botón mientras se descarga de Firebase
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <>
                <Ionicons 
                  name={isPlaying ? "pause-circle" : "play-circle"} 
                  size={22} 
                  color={COLORS.gold} 
                />
                <Text style={styles.introButtonText}>Intro</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.infoContainer} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-sharp" size={14} color={COLORS.error} />
            <Text style={styles.metaText}>{tour.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{calculatedTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={14} color={COLORS.accent} />
            <Text style={styles.metaText}>{preciseDistance} km</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="map-outline" size={14} color={COLORS.gold} />
            <Text style={styles.metaText}>{realPointsCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 20, elevation: 5, marginHorizontal: 15, overflow: 'hidden' },
  imageContainer: { height: 200, position: 'relative' },
  badge: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 15, paddingVertical: 5, borderBottomRightRadius: 15, backgroundColor: COLORS.badge, zIndex: 10 },
  badgeText: { color: COLORS.white, fontWeight: 'bold' },
  infoContainer: { padding: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  
  // ✨ NUEVOS ESTILOS DEL BOTÓN FAVORITO
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 10, // Esto da la forma cuadrangular suavizada
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fondo blanco casi sólido para destacar el corazón
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra sutil para mejorar el contraste sobre fotos claras
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },

  introButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C77EDCC', 
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    gap: 4,
  },
  introPlayingBg: {
    backgroundColor: COLORS.primary, 
  },
  introButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textDark, fontSize: 13, fontWeight: '500' }
});