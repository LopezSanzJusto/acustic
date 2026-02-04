import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

interface TourFooterProps {
  price: number;
  onStart: () => void;
}

export const TourFooter = ({ price, onStart }: TourFooterProps) => {
  return (
    <View style={styles.footer}>
      <View>
        <Text style={styles.priceLabel}>Precio total</Text>
        <Text style={styles.price}>{price === 0 ? "Gratis" : `${price}€`}</Text>
      </View>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={onStart}
      >
        <Text style={styles.ctaText}>Comenzar Ruta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { padding: 25, borderTopWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, marginBottom: 20 },
  priceLabel: { color: COLORS.placeholder, fontSize: 13, marginBottom: 2 },
  price: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  ctaButton: { backgroundColor: COLORS.primary, paddingHorizontal: 35, paddingVertical: 16, borderRadius: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  ctaText: { color: COLORS.white, fontWeight: 'bold', fontSize: 17 }
});