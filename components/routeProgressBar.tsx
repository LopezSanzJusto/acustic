// components/routeProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface RouteProgressBarProps {
  percentage: number;
}

export const RouteProgressBar = ({ percentage }: RouteProgressBarProps) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safePercentage}%` }]} />
      </View>
      
      <View style={[styles.indicatorWrapper, { left: `${safePercentage}%` }]}>
        <View style={styles.indicator}>
          <Ionicons name="walk" size={12} color={COLORS.white} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20, // Altura muy reducida
    justifyContent: 'center',
  },
  track: {
    height: 4, // Barra muy fina y sutil
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -10 }], // Mitad del nuevo ancho del icono (20px / 2)
  },
  indicator: {
    width: 20, // Icono mucho más discreto
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  }
});