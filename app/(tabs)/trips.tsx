// app/(tabs)/trips

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMMON_STYLES } from '../../utils/theme';

export default function TripsScreen() {
  return (
    <View style={COMMON_STYLES.centerContainer}>
      <Text style={COMMON_STYLES.titleText}>Mis Audioguías en progreso...</Text>
    </View>
  );
}