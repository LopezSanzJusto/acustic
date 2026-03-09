// components/tourDetails/tourHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageSlider } from '../imageSlider';

interface TourHeaderProps {
  images: string[];
  title: string;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

const { width } = Dimensions.get('window');

export const TourHeader = ({ images, title, isFavorite, onBack, onToggleFavorite }: TourHeaderProps) => {
  return (
    <View style={styles.container}>
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="arrow-back" size={26} color="#312E81" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <TouchableOpacity onPress={onToggleFavorite} style={styles.iconButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={26} color="#312E81" />
        </TouchableOpacity>
      </View>

      <ImageSlider 
        images={images} 
        height={280} 
        width={width} 
      />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55, 
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    padding: 2,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900', // ✨ El grosor máximo para que se vea bien gorda
    color: '#312E81', 
    textAlign: 'center',
    marginHorizontal: 15,
  }
});