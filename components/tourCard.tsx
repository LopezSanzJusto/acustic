import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Para los iconos de duración, km, etc.

interface TourCardProps {
  tour: {
    title: string;
    city: string;
    country: string;
    price: string; // "4.95€" o "Gratis"
    duration: string;
    distance: string;
    audioCount: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
  };
  onPress: () => void;
}

export const TourCard = ({ tour, onPress }: TourCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Sección de Imagen */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: tour.image }} style={styles.image} />
        
        {/* Etiqueta de Precio [cite: 35] */}
        <View style={[styles.badge, tour.price === 'Gratis' ? styles.freeBadge : styles.priceBadge]}>
          <Text style={styles.badgeText}>{tour.price}</Text>
        </View>

        {/* Botón Intro Overlay */}
        <TouchableOpacity style={styles.introButton}>
          <Ionicons name="play-circle" size={18} color="#FFF" />
          <Text style={styles.introText}>Intro</Text>
        </TouchableOpacity>

        {/* Indicador de Slider (Puntos) */}
        <View style={styles.sliderDots}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.activeDot]} />
          ))}
        </View>
      </View>

      {/* Sección de Información */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{tour.title}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{tour.rating} ({tour.reviews})</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-sharp" size={14} color="#FF4D4D" />
            <Text style={styles.detailText}>{tour.city}, {tour.country}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{tour.duration}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="walk-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{tour.distance}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="musical-notes-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{tour.audioCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    marginHorizontal: 15,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderBottomRightRadius: 15,
  },
  priceBadge: { backgroundColor: '#FFA500' },
  freeBadge: { backgroundColor: '#32CD32' },
  badgeText: { color: '#FFF', fontWeight: 'bold' },
  introButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(106, 90, 205, 0.8)', // Color púrpura del diseño
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  introText: { color: '#FFF', fontSize: 12, marginLeft: 4 },
  sliderDots: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#FFF', width: 12 },
  infoContainer: { padding: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#4B0082' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, marginLeft: 3, color: '#666' },
  detailsRow: { marginTop: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  detailText: { fontSize: 12, color: '#666', marginLeft: 4 },
  statsRow: { flexDirection: 'row', marginTop: 5 },
});