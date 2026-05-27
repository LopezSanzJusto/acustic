// components/creator/CategoryPicker.tsx
//
// Selector de categoría con apariencia de dropdown (matching el Figma) que
// al pulsar abre un modal inferior con las 4 categorías cerradas.

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, getCategoryLabel, type CategoryId } from '@/constants/categories';
import { COLORS, FONTS } from '@/utils/theme';

export interface CategoryPickerProps {
  value: CategoryId | null;
  onChange: (id: CategoryId) => void;
  label?: string;
}

export function CategoryPicker({ value, onChange, label = 'Categoría' }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? getCategoryLabel(value) : 'Selecciona una categoría'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>Elige una categoría</Text>
                <FlatList
                  data={CATEGORIES}
                  keyExtractor={(c) => c.id}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({ item }) => {
                    const selected = item.id === value;
                    return (
                      <Pressable
                        onPress={() => {
                          onChange(item.id);
                          setOpen(false);
                        }}
                        style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                          {item.label}
                        </Text>
                        {selected && (
                          <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  fieldText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
  },
  placeholder: {
    color: COLORS.placeholder,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  sheetTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  optionText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
