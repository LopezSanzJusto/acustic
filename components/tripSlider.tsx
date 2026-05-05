// components/tripSlider.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

interface TripSliderProps {
  activeTab: 'purchased' | 'favorites';
  onTabChange: (tab: 'purchased' | 'favorites') => void;
}

export const TripSlider = ({ activeTab, onTabChange }: TripSliderProps) => {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderBackground}>
        <TouchableOpacity
          style={[styles.sliderButton, activeTab === 'purchased' && styles.sliderButtonActive]}
          onPress={() => onTabChange('purchased')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sliderText, activeTab === 'purchased' && styles.sliderTextActive]}>
            Mis audioguías
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sliderButton, activeTab === 'favorites' && styles.sliderButtonActive]}
          onPress={() => onTabChange('favorites')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sliderText, activeTab === 'favorites' && styles.sliderTextActive]}>
            Favoritas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sliderBackground: {
    flexDirection: 'row',
    backgroundColor: '#DDD8F5',
    borderRadius: 16,
    padding: 4,
  },
  sliderButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  sliderButtonActive: {
    backgroundColor: '#3A3980',
    shadowColor: '#3A3980',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderText: {
    fontWeight: '600',
    color: '#9B8FCC',
    fontSize: 15,
  },
  sliderTextActive: {
    color: COLORS.white,
  },
});