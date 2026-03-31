// components/tourDetails/tourHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TourHeaderProps {
  title: string;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

export const TourHeader = ({ title, isFavorite, onBack, onToggleFavorite }: TourHeaderProps) => {
  const insets = useSafeAreaInsets(); // Respeta la barra de estado superior

  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) }]}>
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
  );
};

const styles = StyleSheet.create({
  topBar: {
    // ✨ ELIMINADO: position: absolute. Ahora ocupa su espacio real.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF', // ✨ Fondo sólido para tapar el contenido al hacer scroll
    zIndex: 10, // ✨ Garantiza que esté por encima del ScrollView
    elevation: 10,
    borderBottomWidth: 1, // ✨ Fina línea gris para separar el header del contenido scrolleable
    borderBottomColor: '#F3F4F6',
  },
  iconButton: {
    padding: 2,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900', 
    color: '#312E81', 
    textAlign: 'center',
    marginHorizontal: 15,
  }
});