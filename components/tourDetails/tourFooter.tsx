// components/tourDetails/tourFooter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../utils/theme';

interface TourFooterProps {
  price: number;
  onStart: () => void;
  isLoading?: boolean; // Añadimos esto para bloquear el botón mientras guardamos en Firebase
}

export const TourFooter = ({ price, onStart, isLoading }: TourFooterProps) => {
  const isFree = price === 0;

  return (
    <View style={styles.footer}>
      <View>
        <Text style={styles.priceLabel}>Precio total</Text>
        <Text style={styles.price}>{isFree ? "Gratis" : `${price}€`}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.ctaButton, 
          !isFree && styles.ctaButtonPremium // Estilo diferencial si es de pago
        ]}
        onPress={onStart}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.ctaText}>
            {isFree ? "Comenzar Ruta" : "Comprar Ruta"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { 
    padding: 25, 
    borderTopWidth: 1, 
    borderColor: COLORS.border, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.white, 
    marginBottom: 20 
  },
  priceLabel: { color: COLORS.placeholder, fontSize: 13, marginBottom: 2 },
  price: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  ctaButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 35, 
    paddingVertical: 16, 
    borderRadius: 18, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    elevation: 8 
  },
  // Añadimos un color distinto (ej: dorado oscuro o el mismo primary pero ajustado) para rutas premium
  ctaButtonPremium: {
    backgroundColor: '#D4AF37', // Color dorado/premium (cámbialo según tu theme)
    shadowColor: '#D4AF37',
  },
  ctaText: { color: COLORS.white, fontWeight: 'bold', fontSize: 17 }
});