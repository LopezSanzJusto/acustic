// components/tourCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
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
  isIntroPlaying?: boolean;
  onToggleIntro?: (audioUrl: string, tourId: string) => void;
}

export const TourCard = ({ 
  tour, 
  onPress, 
  isIntroPlaying = false,
  onToggleIntro 
}: TourCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites(tour.id);
  
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

  const handleToggleIntro = () => {
    if (onToggleIntro && tour.introAudioUrl) {
      onToggleIntro(tour.introAudioUrl, tour.id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageSlider images={images} width={CARD_WIDTH} height={200} onPress={onPress} />
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>

        {/* Botón Favorito (Corazón) - Arriba a la derecha sin fondo */}
        <TouchableOpacity 
          style={[
            styles.heartButton, 
            { 
              // Si NO es favorito, fondo morado sólido. Si ES favorito, fondo transparente
              backgroundColor: isFavorite ? 'transparent' : COLORS.primary,
              // Si NO es favorito, no lleva borde extra. Si ES favorito, no lleva borde.
              borderWidth: 0, 
            }
          ]} 
          onPress={toggleFavorite} 
          activeOpacity={0.8}
        >
          <Ionicons 
            // Siempre usamos el icono relleno ("heart"), pero cambiamos el color
            name="heart" 
            size={isFavorite ? 28 : 20} // Un poco más grande cuando no tiene círculo
            // Si NO es favorito, corazon blanco. Si ES favorito, corazon morado.
            color={isFavorite ? COLORS.primary : COLORS.white} 
          />
        </TouchableOpacity>

        {/* Botón de Intro (Play/Pause) - Abajo a la derecha */}
        {tour.introAudioUrl && (
          <TouchableOpacity 
            style={[styles.introButton, isIntroPlaying && styles.introPlayingBg]} 
            onPress={handleToggleIntro} 
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isIntroPlaying ? "pause-circle" : "play-circle"} 
              size={22} 
              color={COLORS.gold} // El diseño de Figma tiene un acento amarillento/naranja, uso gold
            />
            <Text style={styles.introButtonText}>Intro</Text>
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
  
  // ✨ Botón del Corazón (Arriba derecha, sin fondo)
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ✨ Botón de Intro (Abajo derecha, estilo píldora como en Figma)
  introButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C77EDCC', // Color morado translúcido similar a COLORS.primary
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    gap: 4,
  },
  introPlayingBg: {
    backgroundColor: COLORS.primary, // Color sólido si se está reproduciendo
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