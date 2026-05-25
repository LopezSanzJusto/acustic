// components/tourDetails/tourStats.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

const STAR_FULL = require('../../assets/images/icons/estrella_morada_rellena.png');
const STAR_HALF = require('../../assets/images/icons/estrella_morada_medio_rellena.png');
const STAR_EMPTY = require('../../assets/images/icons/estrella_morada_vacia.png');

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const diff = rating - i;
        const source = diff >= 0 ? STAR_FULL : diff >= -0.5 ? STAR_HALF : STAR_EMPTY;
        const isHalf = source === STAR_HALF;
        return (
          <Image
            key={i}
            source={source}
            style={{ width: size, height: size, transform: isHalf ? [{ scaleX: -1 }] : [] }}
          />
        );
      })}
    </View>
  );
}

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

      {/* Columna 2: Rating */}
      <View style={styles.statCol}>
        <Text style={styles.statNumber}>{rating}</Text>
        <StarRating rating={rating} size={14} />
      </View>

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
    shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1.5
  },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.muted },
  divider: { width: 1, height: '60%', backgroundColor: COLORS.border }
});