// components/tourDetails/tourHeader.tsx

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FloatingButton } from '../floatingButton'; // Asegúrate de que la ruta sea correcta según tu estructura
// ✅ Importamos el Slider
import { ImageSlider } from '../imageSlider';

interface TourHeaderProps {
  images: string[];
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const TourHeader = ({ images, onBack }: TourHeaderProps) => {
  return (
    <View style={styles.imageHeader}>
      {/* ✅ Slider a pantalla completa */}
      <ImageSlider 
        images={images} 
        height={320} 
        width={width} 
      />
      
      {/* Botón flotante con zIndex alto */}
      <FloatingButton
        icon="arrow-back"
        onPress={onBack}
        style={{ top: 50, left: 20, zIndex: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageHeader: { height: 320, position: 'relative' },
});