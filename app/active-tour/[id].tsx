// app/active-tour/[id].tsx

import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import HomeScreenContent from '../../screens/activeRouteScreen';

export default function ActiveTourPage() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreenContent tourId={id as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
});