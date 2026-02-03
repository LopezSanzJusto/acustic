// components/tourCard.tsx

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
// ✅ AÑADIDO: Nuestro nuevo hook
import { useFavorites } from '../hooks/useFavorites'; 

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const IMG_WIDTH = width - (CARD_MARGIN * 2);

export const TourCard = ({ tour, onPress }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ✅ AÑADIDO: Lógica del corazón
  const { isFavorite, toggleFavorite } = useFavorites(tour.id);

  const images = (tour.imageUrls && Array.isArray(tour.imageUrls)) ? tour.imageUrls : [tour.image];

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {/* ... (FlatList de imágenes se mantiene igual) ... */}
        <Image source={{ uri: images[0] }} style={styles.image} />
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>

        {/* ❤️ NUEVO: Botón de Favorito */}
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
        {/* ... (Resto del diseño se mantiene igual) ... */}
        <Text style={styles.title}>{tour.title}</Text>
        <Text style={styles.detailText}>{tour.city}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 20, marginBottom: 20, elevation: 5, marginHorizontal: CARD_MARGIN, overflow: 'hidden' },
  imageContainer: { height: 200, position: 'relative' },
  image: { width: IMG_WIDTH, height: 200, resizeMode: 'cover' },
  badge: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 15, paddingVertical: 5, borderBottomRightRadius: 15, backgroundColor: COLORS.badge },
  badgeText: { color: COLORS.white, fontWeight: 'bold' },
  infoContainer: { padding: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  detailText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  // ❤️ NUEVO: Estilos del botón de Favorito
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  }
});