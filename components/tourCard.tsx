// components/tourCard.tsx
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { collection, getDocs, orderBy, query } from '@react-native-firebase/firestore';

import { useFavorites } from '../hooks/useFavorites';
import { db, firestoreReady } from '../services/firebaseConfig';
import { calculateRealTimeProgress } from '../utils/geo';
import { COLORS } from '../utils/theme';
import { ImageSlider } from './imageSlider';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - CARD_MARGIN * 2;
const IMAGE_HEIGHT = 125;

interface TourCardProps {
  tour: any;
  onPress: () => void;
}

export const TourCard = ({ tour, onPress }: TourCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites(tour.id);

  const [realPointsCount, setRealPointsCount] = useState(0);
  const [preciseDistance, setPreciseDistance] = useState<string>('0.00');
  const [calculatedTime, setCalculatedTime] = useState<string>('0h 0m');

  useEffect(() => {
    async function getRealData() {
      if (!tour.id) return;
      await firestoreReady;
      try {
        const pointsRef = collection(db, 'tours', tour.id, 'points');
        const q = query(pointsRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const pointsArray = snapshot.docs.map((doc: any) => doc.data());

        setRealPointsCount(pointsArray.length);

        if (pointsArray.length > 1) {
          const progressData = calculateRealTimeProgress(pointsArray, pointsArray.length - 1, null);
          const totalKms = progressData.totalMeters / 1000;
          setPreciseDistance(totalKms.toFixed(1));
          const totalMinutes = (totalKms / 4.5) * 60;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          setCalculatedTime(`${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`);
        } else {
          setPreciseDistance(tour.distance || '0.00');
          setCalculatedTime(tour.duration || 'N/A');
        }
      } catch (e) {
        console.log('Error al procesar datos reales:', e);
      }
    }
    getRealData();
  }, [tour.id]);

  const images =
    tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0
      ? tour.imageUrls
      : [tour.image];

  const location = [tour.city, tour.country].filter(Boolean).join(', ');
  const priceLabel = tour.price === 0 || tour.price == null ? 'Gratis' : `${tour.price}€`;

  return (
    <View style={styles.card}>
      {/* Imagen */}
      <View style={styles.imageContainer}>
        <ImageSlider images={images} width={CARD_WIDTH} height={IMAGE_HEIGHT} borderRadius={12} onPress={onPress} />

        <View style={[styles.badge, tour.price === 0 || tour.price == null ? styles.badgeFree : styles.badgePaid]}>
          <Text style={[styles.badgeText, tour.price === 0 || tour.price == null ? styles.badgeTextFree : styles.badgeTextPaid]}>
            {priceLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isFavorite ? (
            <View style={{ width: 22, height: 22 }}>
              {[1, 0.82, 0.64, 0.46, 0.28].map((scale, i) => (
                <Image
                  key={i}
                  source={require('../assets/images/icons/Corazon_Favoritos.png')}
                  style={{ position: 'absolute', width: 22, height: 22, tintColor: 'white', transform: [{ scale }] }}
                  resizeMode="contain"
                />
              ))}
            </View>
          ) : (
            <Image source={require('../assets/images/icons/Corazon_Favoritos.png')} style={{ width: 22, height: 22, tintColor: 'white' }} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <TouchableOpacity style={styles.infoContainer} onPress={onPress} activeOpacity={0.8}>
        {/* Título + rating */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
          {tour.rating != null && (
            <View style={styles.ratingRow}>
              <Image source={require('../assets/images/icons/Estrella_Valoracion_Audioguia_Card.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
              <Text style={styles.ratingText}>{tour.rating}</Text>
              {tour.reviews != null && (
                <Text style={styles.reviewCount}>({tour.reviews})</Text>
              )}
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Image source={require('../assets/images/icons/Ubicacion_Ciudad.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
            <Text style={styles.metaText}>{location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Image source={require('../assets/images/icons/Tiempo_Audioguia.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
            <Text style={styles.metaText}>{calculatedTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Image source={require('../assets/images/icons/Distancia_Audioguia.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
            <Text style={styles.metaText}>{preciseDistance} km</Text>
          </View>
          <View style={styles.metaItem}>
            <Image source={require('../assets/images/icons/Puntos_de_Interes_Audioguia.png')} style={{ width: 13, height: 13 }} resizeMode="contain" />
            <Text style={styles.metaText}>{realPointsCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: CARD_MARGIN,
    overflow: 'hidden',
  },
  imageContainer: { height: IMAGE_HEIGHT, position: 'relative'},

  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  badgeFree: { backgroundColor: '#4ACB84' },
  badgePaid: { backgroundColor: '#FFFFFF' },
  badgeText: { fontWeight: 'bold', fontSize: 15 },
  badgeTextFree: { color: COLORS.white },
  badgeTextPaid: { color: '#1A1A1A' },

  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 35,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#8C77EDCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContainer: { paddingHorizontal: 14, paddingVertical: 12 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
    backgroundColor: '#FFF3C4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  reviewCount: { fontSize: 12, color: '#1A1A1A' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: COLORS.textDark, fontSize: 12, fontWeight: '400' },
});