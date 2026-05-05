// components/imageSlider.tsx

import React, { useState } from 'react';
import { Image, StyleSheet, View, Dimensions, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { COLORS } from '../utils/theme';

interface ImageSliderProps {
  images: string[];
  height: number;
  width?: number; // Opcional: si no se pasa, usa el ancho de pantalla
  onPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImageSlider = ({ images, height, width = screenWidth, onPress }: ImageSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Asegurar que siempre hay un array válido
  const validImages = (images && images.length > 0) ? images : ['https://via.placeholder.com/400x300?text=Sin+Imagen'];

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  return (
    <View style={{ width, height, position: 'relative' }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {validImages.map((item, i) => (
          <TouchableOpacity key={i} activeOpacity={onPress ? 0.9 : 1} onPress={onPress}>
            <Image
              source={{ uri: item }}
              style={{ width, height, resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicadores (Puntitos con Sombreado de Fondo Colectivo) */}
      {validImages.length > 1 && (
        <View style={styles.paginationContainer}>
          {/* ✨ Esta es la View mágica que crea el fondo translúcido detrás de todos */}
          <View style={styles.dotsWrapper}>
            {validImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ✨ Contenedor principal que se posiciona absolutamente al fondo
  paginationContainer: {
    position: 'absolute',
    bottom: 14, // Margen inferior
    width: '100%',
    alignItems: 'center', // Centrar horizontalmente el óvalo
    justifyContent: 'center',
  },
  // ✨ Óvalo translúcido que envuelve todos los puntos
  dotsWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Negro súper suave/translúcido
    paddingVertical: 2, // Espacio arriba/abajo dentro del óvalo
    paddingHorizontal: 3, // Espacio izquierda/derecha dentro del óvalo
    borderRadius: 15, // Muy redondeado (píldora)
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3, // Separación entre puntos
  },
  // ✨ El puntito base (eliminamos sombras individuales para mejor rendimiento y limpieza)
  dot: {
    width: 7,  // Círculo perfecto
    height: 7, // Círculo perfecto
    borderRadius: 5, // Mitad exacta para que sea círculo
  },
  // ✨ Estilos de color para el activo/inactivo
  activeDot: {
    backgroundColor: COLORS.white, // Blanco puro (resaltado por el fondo negro)
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Blanco semi-transparente
  }
});