// components/tripSlider.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface TripSliderProps {
  activeTab: 'purchased' | 'favorites';
  onTabChange: (tab: 'purchased' | 'favorites') => void;
}

export const TripSlider = ({ activeTab, onTabChange }: TripSliderProps) => {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderBackground}>
        
        {/* Botón: Mis Audioguías */}
        <TouchableOpacity 
          style={[styles.sliderButton, activeTab === 'purchased' && styles.sliderButtonActive]}
          onPress={() => onTabChange('purchased')}
          activeOpacity={0.8}
        >
          <Ionicons name="headset" size={16} color={activeTab === 'purchased' ? COLORS.white : COLORS.muted} />
          <Text style={[styles.sliderText, activeTab === 'purchased' && styles.sliderTextActive]}>
            Mis Audioguías
          </Text>
        </TouchableOpacity>

        {/* Botón: Favoritos */}
        <TouchableOpacity 
          style={[styles.sliderButton, activeTab === 'favorites' && styles.sliderButtonActiveAlt]}
          onPress={() => onTabChange('favorites')}
          activeOpacity={0.8}
        >
          <Ionicons name="heart" size={16} color={activeTab === 'favorites' ? COLORS.white : COLORS.muted} />
          <Text style={[styles.sliderText, activeTab === 'favorites' && styles.sliderTextActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sliderBackground: { flexDirection: 'row', backgroundColor: COLORS.inputBackground, borderRadius: 25, padding: 4 },
  sliderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 20, gap: 6 },
  sliderButtonActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  sliderButtonActiveAlt: { backgroundColor: COLORS.error, shadowColor: COLORS.error, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  sliderText: { fontWeight: '600', color: COLORS.muted, fontSize: 14 },
  sliderTextActive: { color: COLORS.white },
});