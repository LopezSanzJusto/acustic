// components/tourDetails/tourStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

interface TourStatsProps {
  listens: number;
  rating: number;
  reviews: number;
}

export const TourStats = ({ listens, rating, reviews }: TourStatsProps) => {
  return (
    <View style={styles.card}>
      {/* Columna 1: Escuchas */}
      <View style={styles.statCol}>
        <Text style={styles.statNumber}>{listens}</Text>
        <Text style={styles.statLabel}>Escuchas</Text>
      </View>

      <View style={styles.divider} />

      {/* Columna 2: Rating */}
      <View style={styles.statCol}>
        <Text style={styles.statNumber}>{rating}</Text>
        <View style={{ flexDirection: 'row' }}>
          {[1,2,3,4,5].map(i => (
            <Ionicons key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={12} color={COLORS.primary} />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Columna 3: Opiniones */}
      <View style={styles.statCol}>
        <Text style={styles.statNumber}>{reviews}</Text>
        <Text style={styles.statLabel}>Opiniones</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:5, elevation:2
  },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.muted },
  divider: { width: 1, height: '60%', backgroundColor: COLORS.border }
});