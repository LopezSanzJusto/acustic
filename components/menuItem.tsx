// components/menuItem.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
}

export const MenuItem = ({ icon, title, onPress, isDestructive = false }: MenuItemProps) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, isDestructive && { backgroundColor: COLORS.error + '20' }]}>
        <Ionicons name={icon} size={22} color={isDestructive ? COLORS.error : COLORS.primary} />
      </View>
      <Text style={[styles.menuText, isDestructive && { color: COLORS.error }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
});