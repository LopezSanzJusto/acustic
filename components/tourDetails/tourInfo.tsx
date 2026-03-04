// components/tourDetails/tourInfo.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getDistanceInMeters } from '../../utils/geo'; 
import { COLORS } from '../../utils/theme';

interface TourInfoProps {
  title: string;
  city: string;
  country: string;
  duration: string; 
  distance: string; 
  points: any[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const TourInfo = ({ 
  title, city, country, duration, distance, points, isFavorite, onToggleFavorite 
}: TourInfoProps) => {
  
  const numPoints = points?.length || 0;

  const { preciseDistance, calculatedTime } = useMemo(() => {
    if (!points || points.length < 2) {
      return {
        preciseDistance: distance || "0.00 km",
        calculatedTime: duration || "N/A"
      };
    }

    let totalMeters = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
        totalMeters += getDistanceInMeters(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      }
    }

    const kms = totalMeters / 1000;
    const finalDistance = `${kms.toFixed(2)} km`;
    const totalMinutes = (kms / 4.5) * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const finalTime = `${hours}h ${minutes}m`;

    return {
      preciseDistance: finalDistance,
      calculatedTime: finalTime
    };
  }, [points, distance, duration]);

  const locationText = country ? `${city}, ${country}` : city;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onToggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
            <Ionicons name="location-sharp" size={14} color={COLORS.error} />
            <Text style={styles.metaText}>{locationText}</Text>
        </View>
        <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{calculatedTime}</Text>
        </View>
        <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={14} color={COLORS.accent} />
            <Text style={styles.metaText}>{preciseDistance}</Text>
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
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark, flex: 1, marginRight: 10 }, // ✅ corregido
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textDark, fontSize: 13, fontWeight: '500' } // ✅ corregido
});