// components/tourCard.tsx

import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { useFavorites } from '../hooks/useFavorites';
// ✅ Importamos el Slider
import { ImageSlider } from './imageSlider';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
// Calculamos el ancho real de la tarjeta para que el slider encaje perfecto
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export const TourCard = ({ tour, onPress }: any) => {
  // Hook de favoritos
  const { isFavorite, toggleFavorite } = useFavorites(tour.id);

  // Preparamos el array de imágenes
  const images = (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) 
    ? tour.imageUrls 
    : [tour.image];

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {/* ✅ USAMOS EL SLIDER */}
        <ImageSlider 
          images={images} 
          width={CARD_WIDTH} 
          height={200} 
          onPress={onPress} 
        />
        
        {/* Badge de Precio */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>

        {/* Botón Favorito */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={22} 
            color={isFavorite ? COLORS.error : COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.infoContainer} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.title}>{tour.title}</Text>
        <Text style={styles.detailText}>{tour.city}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 20, elevation: 5, marginHorizontal: CARD_MARGIN, overflow: 'hidden' },
  imageContainer: { height: 200, position: 'relative' },
  badge: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 15, paddingVertical: 5, borderBottomRightRadius: 15, backgroundColor: COLORS.badge, zIndex: 10 },
  badgeText: { color: COLORS.white, fontWeight: 'bold' },
  infoContainer: { padding: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  detailText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10 // Importante para estar sobre el slider
  }
});