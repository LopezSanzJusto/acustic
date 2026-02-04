import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { FloatingButton } from '../floatingButton';

interface TourHeaderProps {
  imageUrl: string;
  onBack: () => void;
}

export const TourHeader = ({ imageUrl, onBack }: TourHeaderProps) => {
  return (
    <View style={styles.imageHeader}>
      <Image source={{ uri: imageUrl }} style={styles.headerImage} />
      <FloatingButton
        icon="arrow-back"
        onPress={onBack}
        style={{ top: 50, left: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageHeader: { height: 320, position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});