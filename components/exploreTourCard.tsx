// components/exploreTourCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../utils/theme';
import { ImageSlider } from './imageSlider';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export const ExploreTourCard = ({ tour, onPress }: { tour: any; onPress: () => void }) => {
  const images = (tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) 
    ? tour.imageUrls 
    : [tour.image];

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageSlider images={images} width={CARD_WIDTH} height={180} onPress={onPress} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>
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
            <Text style={styles.metaText}>{tour.duration || "N/A"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={14} color={COLORS.accent} />
            <Text style={styles.metaText}>{tour.distance || "0"} km</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 18, marginBottom: 20, elevation: 3, marginHorizontal: 15, overflow: 'hidden' },
  imageContainer: { height: 180, position: 'relative' },
  badge: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 12, paddingVertical: 4, borderBottomRightRadius: 12, backgroundColor: COLORS.badge, zIndex: 10 },
  badgeText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  infoContainer: { padding: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.muted, fontSize: 12, fontWeight: '500' }
});