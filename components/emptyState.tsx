// components/emptyState.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap; // Lo hacemos opcional
  imageSource?: ImageSourcePropType;     // ✅ Prop para soportar el logo
  title: string;
  description: string;
  buttonText: string;
  onButtonPress: () => void;
}

export const EmptyState = ({ icon, imageSource, title, description, buttonText, onButtonPress }: EmptyStateProps) => {
  return (
    <View style={styles.emptyContainer}>
      
      {/* ✅ Lógica: Si recibe imagen, pinta el logo. Si no, pinta el Ionicon */}
      {imageSource ? (
        <Image source={imageSource} style={styles.logoImage} resizeMode="contain" />
      ) : icon ? (
        <Ionicons name={icon} size={60} color={COLORS.placeholder} />
      ) : null}

      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      <TouchableOpacity style={styles.exploreButton} onPress={onButtonPress} activeOpacity={0.8}>
        <Text style={styles.exploreButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -50 },
  logoImage: { width: 80, height: 80, marginBottom: 15 }, // ✅ Tamaño ideal para el logo del TFG
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginTop: 15, marginBottom: 5 },
  emptyText: { textAlign: 'center', color: COLORS.muted, lineHeight: 22, marginBottom: 20 },
  exploreButton: { backgroundColor: COLORS.textDark, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  exploreButtonText: { color: COLORS.white, fontWeight: 'bold' },
});