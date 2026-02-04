// components/tourDetails/tourInfo.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

interface TourInfoProps {
  title: string;
  city: string;
  country: string;
  duration: string;
  distance: string;
  numPoints: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const TourInfo = ({ 
  title, city, country, duration, distance, numPoints, isFavorite, onToggleFavorite 
}: TourInfoProps) => {
  return (
    <View style={styles.container}>
      {/* Título y Corazón */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onToggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Fila de Iconos Pequeños (Ubicación, Tiempo, Distancia, Puntos) */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
            <Ionicons name="location-sharp" size={14} color={COLORS.error} />
            <Text style={styles.metaText}>{city}, {country}</Text>
        </View>
        <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{duration}</Text>
        </View>
        <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={14} color={COLORS.accent} />
            <Text style={styles.metaText}>{distance}</Text>
        </View>
        <View style={styles.metaItem}>
            <Ionicons name="map-outline" size={14} color={COLORS.gold} />
            <Text style={styles.metaText}>{numPoints}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark, flex: 1, marginRight: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textDark, fontSize: 13, fontWeight: '500' }
});