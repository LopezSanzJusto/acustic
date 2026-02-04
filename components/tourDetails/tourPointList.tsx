// components/tourDetails/tourPointList.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';

export const TourPointList = ({ points }: { points: PointOfInterest[] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Personaliza tu ruta</Text>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>Mantén pulsado para reordenar o toca el ojo para ocultar paradas.</Text>
      </View>

      {points.map((point, index) => (
        <View key={point.id || index} style={styles.row}>
          <Image source={{ uri: point.image }} style={styles.image} />
          <View style={{ flex: 1 }} /> 
          <TouchableOpacity>
             <Ionicons name="eye-outline" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  header: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F3E8FF', padding: 12, borderRadius: 12, marginBottom: 15, alignItems: 'center', gap: 10 },
  infoText: { fontSize: 12, color: COLORS.primary, flex: 1, lineHeight: 18 },
  row: { 
    flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10,
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border 
  },
  image: { width: 60, height: 50, borderRadius: 8, marginRight: 15 }
});