// components/StopCard.tsx

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PointOfInterest } from '../data/points';
import { COLORS } from '../utils/theme';

interface StopCardProps {
  point: PointOfInterest;
  onPress: () => void;
}

// Usamos memo para evitar re-renderizados si las props no cambian (Optimización de rendimiento)
export const StopCard = memo(({ point, onPress }: StopCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: point.image }} style={styles.image} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{point.order}</Text>
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{point.name}</Text>
        {/* Usamos un subtítulo inventado como pediste, o una propiedad si existiera */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {/* @ts-ignore - Si añades 'subtitle' a tu interface PointOfInterest, quita el ts-ignore */}
          {point.subtitle || "Parada recomendada en tu ruta"}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
    </TouchableOpacity>
  );
});

const FONT_FAMILY = 'Urbanist-SemiBold';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20, // Bordes muy redondeados
    borderWidth: 1,
    borderColor: '#DDD6FE', // Morado claro (Tailwind violet-200)
    padding: 6,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 26,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  badge: {
    position: 'absolute',
    right: -15,
    top: '50%',
    marginTop: -15,
    backgroundColor: '#4E4FA5',
    width: 28,
    height: 28,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#312E81',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY,
  },
});