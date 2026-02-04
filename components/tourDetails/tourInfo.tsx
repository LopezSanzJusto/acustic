import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

interface TourInfoProps {
  title: string;
  category: string;
  city: string;
  country: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const TourInfo = ({ 
  title, category, city, country, isFavorite, onToggleFavorite 
}: TourInfoProps) => {
  return (
    <View>
      <Text style={styles.category}>{category?.toUpperCase() || 'TURISMO'}</Text>
      
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onToggleFavorite} activeOpacity={0.7} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={32}
            color={isFavorite ? COLORS.error : COLORS.placeholder}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={COLORS.error} />
        <Text style={styles.location}>{city}, {country || 'España'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  category: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginBottom: 5, letterSpacing: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 10 },
  favoriteButton: { padding: 5, marginTop: -5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  location: { color: COLORS.muted, marginLeft: 5, fontSize: 16 },
});