// components/routeProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../utils/theme';

interface RouteProgressBarProps {
  percentage: number;
}

export const RouteProgressBar = ({ percentage }: RouteProgressBarProps) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.track} />

      <View style={[styles.indicatorWrapper, { left: `${safePercentage}%` }]}>
        <Image source={require('../assets/images/icons/Delimitador_Mapa__Procentaje_Realizado.png')} style={{ width: 14, height: 14 }} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    width: '100%',
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -14 }],
  },
});