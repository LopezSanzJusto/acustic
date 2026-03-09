// components/tourDetails/tourInfo.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

interface TourInfoProps {
  title?: string;
  city: string;
  country: string;
  duration: string;
  distance: string | number;
  points: any[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const TourInfo = ({ city, country, duration, distance, points }: TourInfoProps) => {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaItem}>
        <Ionicons name="location-sharp" size={16} color={COLORS.error} />
        <Text style={styles.metaText}>{city}, {country}</Text>
      </View>
      <View style={styles.metaItem}>
        <Ionicons name="time-outline" size={16} color={COLORS.primary} />
        <Text style={styles.metaText}>{duration}</Text>
      </View>
      <View style={styles.metaItem}>
        <Ionicons name="walk-outline" size={16} color={COLORS.accent} />
        <Text style={styles.metaText}>{distance}</Text>
      </View>
      <View style={styles.metaItem}>
        <Ionicons name="map-outline" size={16} color={COLORS.gold} />
        <Text style={styles.metaText}>{points?.length || 0}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10 // Un poquito de aire respecto a la foto
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textDark, fontSize: 14, fontWeight: '500' }
});