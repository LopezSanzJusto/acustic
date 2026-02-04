// components/imageSlider.tsx

import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, View, Dimensions, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
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
    <View style={{ width, height }}>
      <FlatList
        data={validImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16} // Para suavidad en iOS
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress}>
            <Image 
              source={{ uri: item }} 
              style={{ width, height, resizeMode: 'cover' }} 
            />
          </TouchableOpacity>
        )}
      />

      {/* Indicadores (Puntitos) */}
      {validImages.length > 1 && (
        <View style={styles.pagination}>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pagination: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: COLORS.white,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: 6,
  }
});