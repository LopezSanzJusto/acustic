import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

const ARROW_COLOR = '#8874F7';
const ITEM_BORDER = '#8874F7';

interface MenuItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  imageSource?: any;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
  showBorder?: boolean;
}

export const MenuItem = ({
  icon,
  imageSource,
  iconBgColor = COLORS.primary + '20',
  iconColor = COLORS.primary,
  title,
  onPress,
  isDestructive = false,
  showBorder = true,
}: MenuItemProps) => {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 32, height: 32 }} resizeMode="contain" />
        ) : icon ? (
          <Ionicons name={icon} size={28} color={isDestructive ? COLORS.error : iconColor} />
        ) : null}
      </View>
      <Text style={[styles.menuText, isDestructive && { color: COLORS.error }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={ARROW_COLOR} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ITEM_BORDER,
    marginBottom: -1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '400' },
});
