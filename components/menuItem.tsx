import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
  showBorder?: boolean;
}

export const MenuItem = ({
  icon,
  iconBgColor = COLORS.primary + '20',
  iconColor = COLORS.primary,
  title,
  onPress,
  isDestructive = false,
  showBorder = true,
}: MenuItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, showBorder && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? COLORS.error + '20' : iconBgColor }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? COLORS.error : iconColor} />
      </View>
      <Text style={[styles.menuText, isDestructive && { color: COLORS.error }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  iconContainer: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '400' },
});
