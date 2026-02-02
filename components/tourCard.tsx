// components/tourCard.tsx

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme'; // ✅ Importamos tema

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const IMG_WIDTH = width - (CARD_MARGIN * 2);

export const TourCard = ({ tour, onPress }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const images = (tour.imageUrls && Array.isArray(tour.imageUrls)) ? tour.imageUrls : [tour.image];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / IMG_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          snapToAlignment="center"
          snapToInterval={IMG_WIDTH}
          decelerationRate="fast"
          scrollEventThrottle={16}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Pressable onPress={onPress}>
              <Image source={{ uri: item }} style={styles.image} />
            </Pressable>
          )}
        />
        
        <View style={styles.sliderDots}>
          {images.map((_: any, i: number) => (
            <View 
              key={i} 
              style={[styles.dot, activeIndex === i ? styles.activeDot : styles.inactiveDot]} 
            />
          ))}
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.price === 0 ? "Gratis" : `${tour.price}€`}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.infoContainer} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{tour.title}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={COLORS.gold} />
            <Text style={styles.ratingText}>{tour.rating} (18)</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-sharp" size={14} color={COLORS.error} />
            <Text style={styles.detailText}>{tour.city}, {tour.country || 'España'}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.muted} />
              <Text style={styles.detailText}>{tour.duration}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="walk-outline" size={14} color={COLORS.muted} />
              <Text style={styles.detailText}>{tour.distance}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="musical-notes-outline" size={14} color={COLORS.muted} />
              <Text style={styles.detailText}>{tour.numPoints || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    marginBottom: 20, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    overflow: 'hidden', 
    marginHorizontal: CARD_MARGIN 
  },
  imageContainer: { height: 200, position: 'relative' },
  image: { width: IMG_WIDTH, height: 200, resizeMode: 'cover' },
  badge: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderBottomRightRadius: 15, 
    backgroundColor: COLORS.badge // ✅ Usando tema
  },
  badgeText: { color: COLORS.white, fontWeight: 'bold' },
  sliderDots: { position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  activeDot: { backgroundColor: COLORS.white, width: 16 },
  inactiveDot: { backgroundColor: 'rgba(255,255,255,0.5)', width: 6 },
  infoContainer: { padding: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, marginLeft: 3, color: COLORS.muted },
  detailsRow: { marginTop: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  detailText: { fontSize: 12, color: COLORS.muted, marginLeft: 4 },
  statsRow: { flexDirection: 'row', marginTop: 5 },
});