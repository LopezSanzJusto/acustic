import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

interface TourStatsProps {
  duration: string;
  distance: string;
  numPoints: number;
}

const StatItem = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.statText}>{text}</Text>
  </View>
);

export const TourStats = ({ duration, distance, numPoints }: TourStatsProps) => {
  return (
    <View style={styles.statsRow}>
      <StatItem icon="time-outline" text={duration || "N/A"} />
      <StatItem icon="walk-outline" text={distance || "N/A"} />
      <StatItem icon="musical-notes-outline" text={`${numPoints || 0} Puntos`} />
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  statItem: { alignItems: 'center', flex: 1 },
  statText: { fontSize: 14, color: COLORS.text, marginTop: 6, fontWeight: '500' },
});