// components/FloatingButton.tsx

import React from 'react';
import { TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, COMMON_STYLES } from '../utils/theme';

interface FloatingButtonProps {
  icon: keyof typeof Ionicons.glyphMap; // Esto asegura que solo pases nombres válidos de iconos
  onPress: () => void;
  style?: ViewStyle; // Para posicionar (top, left, right...)
  size?: number;     // Opcional, por defecto 24
}

export const FloatingButton = ({ 
  icon, 
  onPress, 
  style, 
  size = 24 
}: FloatingButtonProps) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={size} color={COLORS.white} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Usamos una base similar a COMMON_STYLES pero aseguramos que sea redonda y centrada
  button: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semitransparente oscuro
    width: 44,  // Tamaño fijo para que sea perfectamente redondo
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra sutil para que destaque sobre mapas o fotos claras
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  }
});