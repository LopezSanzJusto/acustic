// utils/theme.ts
import { StyleSheet } from 'react-native';

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const COLORS = {
  // Brand
  primary: '#4E4FA5E5',        // Púrpura principal
  primaryLight: 'rgba(75, 0, 130, 0.15)', // Para radios en mapas
  primaryBorder: 'rgba(75, 0, 130, 0.5)', // Para bordes en mapas
  
  // UI Basics
  background: '#FFFFFF',     // Fondo general (Antes a veces #F8F9FA, unificado a blanco o gris muy claro)
  backgroundAlt: '#F8F9FA',  // Fondo alternativo (para cards o pantallas grises)
  surface: '#FFFFFF',        // Superficie de tarjetas
  inputBackground: '#F0F0F8',// Fondo del buscador
  
  // Text
  text: '#1A1A1A',           // Texto principal
  textDark: '#0D2C33',       // Texto/Fondo oscuro para categorías activas
  muted: '#666666',          // Texto secundario
  placeholder: '#999999',    // Placeholders
  white: '#FFFFFF',

  // UI Elements
  border: '#E0E0E0',         // Líneas divisorias y bordes
  overlay: 'rgba(0,0,0,0.5)',// Fondos oscuros para botones flotantes

  // Functional
  accent: '#00D2A0',         // Turquesa
  error: '#FF4D4D',          // Rojo (Pines ubicación, errores)
  gold: '#FFD700',           // Estrellas
  badge: '#FFA500',          // Badges (Naranja)
};

export const COMMON_STYLES = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  // Botón flotante estándar (reutilizable)
  floatingButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: COLORS.overlay,
    borderRadius: 25,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }
});