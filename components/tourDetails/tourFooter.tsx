// components/tourDetails/tourFooter.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TourFooterProps {
  price: number | string;
  hasAccess: boolean;
  onStart: () => void;
  isLoading?: boolean;
}

export const TourFooter = ({ price, hasAccess, onStart, isLoading }: TourFooterProps) => {
  const insets = useSafeAreaInsets();

  const label = hasAccess ? 'Empieza tu ruta' : `Escucha por ${price}€`;

  return (
    <TouchableOpacity
      style={[styles.bar, { paddingBottom: insets.bottom + 18 }]}
      onPress={onStart}
      disabled={isLoading}
      activeOpacity={0.85}
    >
      {isLoading
        ? <ActivityIndicator color="#fff" />
        : <Text style={styles.label}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    paddingTop: 18,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
});
