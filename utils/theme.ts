// utils/theme.ts
import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#4B0082',    // Tu púrpura principal
  background: '#F8F9FA', // Tu fondo gris claro
  text: '#1A1A1A',       // Tu negro suave
  muted: '#666666',      // Gris para textos secundarios
  white: '#FFFFFF',
  accent: '#00D2A0',     // Turquesa para rutas
  error: '#FF4D4D',      // Rojo para errores/ubicación
  gold: '#FFD700'        // Estrellas
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
  // Añadimos este para tus botones de "cerrar" o "volver" que se repiten
  floatingButton: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8
  }
});