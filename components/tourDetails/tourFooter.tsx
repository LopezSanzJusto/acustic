import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface TourFooterProps {
  price: number;
  onStart: () => void;
}

export const TourFooter = ({ price, onStart }: TourFooterProps) => {
  // Verificamos si tiene precio y es mayor a 0
  const isPaid = price && price > 0;

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={onStart}
        activeOpacity={0.9}
      >
        <Text style={styles.ctaText}>
          {isPaid ? `Escucha por ${price}€` : "Escucha gratis"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { 
    width: '100%',
    // Eliminamos bordes y fondos blancos extra para que sea un bloque limpio
  },
  ctaButton: { 
    backgroundColor: '#8B5CF6', // El morado exacto de tu Figma
    width: '100%',
    paddingVertical: 18, 
    // Añadimos un poco de margen inferior extra solo en iOS para la barrita de inicio
    paddingBottom: Platform.OS === 'ios' ? 34 : 18, 
    alignItems: 'center',
    justifyContent: 'center',
    // Si en Figma el botón es 100% recto por arriba, no le ponemos borderRadius.
    // Si lo prefieres un poco redondeado, puedes descomentar las 2 líneas de abajo:
    // borderTopLeftRadius: 20, 
    // borderTopRightRadius: 20,
  },
  ctaText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 17 
  }
});