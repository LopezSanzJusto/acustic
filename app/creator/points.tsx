// app/creator/points.tsx
//
// Pantalla 2 del wizard: Lista de paradas del tour.
// (Implementación completa pendiente)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorPointsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Paradas — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontFamily: FONTS.medium,
    color: COLORS.muted,
    fontSize: 16,
  },
});
