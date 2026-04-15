// components/circularProgress.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../utils/theme';

interface CircularProgressProps {
  percentage: number;
  size?: number;       // Tamaño total del componente
  strokeWidth?: number; // Grosor de la línea
}

export const CircularProgress = ({ 
  percentage, 
  size = 50, 
  strokeWidth = 4 
}: CircularProgressProps) => {
  // Aseguramos que el porcentaje esté entre 0 y 100
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  // Cálculos matemáticos para el SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Círculo de fondo (Gris claro) */}
        <Circle
          stroke="#E2E8F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Círculo de progreso (Morado/Color Principal) */}
        <Circle
          stroke={COLORS.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" // Bordes redondeados en la línea
          // Rotamos -90 grados para que el progreso empiece desde las 12 en punto
          transform={`rotate(-90, ${size / 2}, ${size / 2})`} 
        />
      </Svg>
      
      {/* Texto del porcentaje en el centro */}
      <Text style={[styles.text, { fontSize: size / 3.5 }]} numberOfLines={1}>
        {Math.round(safePercentage)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    color: COLORS.primary,
  }
});