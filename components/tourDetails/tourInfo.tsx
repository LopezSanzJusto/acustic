// components/tourDetails/tourInfo.tsx

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
        <Image source={require('../../assets/images/icons/Ubicacion_Ciudad.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
        <Text style={styles.metaText}>{city}, {country}</Text>
      </View>
      <View style={styles.metaItem}>
        <Image source={require('../../assets/images/icons/Tiempo_Audioguia.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
        <Text style={styles.metaText}>{duration}</Text>
      </View>
      <View style={styles.metaItem}>
        <Image source={require('../../assets/images/icons/Distancia_Audioguia.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
        <Text style={styles.metaText}>{distance}</Text>
      </View>
      <View style={styles.metaItem}>
        <Image source={require('../../assets/images/icons/Puntos_de_Interes_Audioguia.png')} style={{ width: 16, height: 16 }} resizeMode="contain" />
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
    marginBottom: 24,
    marginTop: 10
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textDark, fontSize: 14, fontWeight: '500' }
});