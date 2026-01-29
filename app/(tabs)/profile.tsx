// app/(tabs)/profile

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMMON_STYLES } from '../../utils/theme';

export default function ProfileScreen() {
  return (
    <View style={COMMON_STYLES.centerContainer}>
      <Text style={COMMON_STYLES.titleText}>Perfil de Usuario</Text>
    </View>
  );
}
