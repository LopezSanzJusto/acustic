// components/countrySelector.tsx
//
// Selector de país reutilizable:
//  - Botón tipo dropdown (estilo configurable mediante la prop `variant`).
//  - Modal con lista completa filtrable por barra de búsqueda fina
//    inspirada en la del buscador principal (Explorar).
//
// Se usa en el onboarding (app/auth/user-info.tsx) y en el perfil
// (app/profile/personal-info.tsx) para compartir exactamente la misma lógica.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { COUNTRIES, normalizeCountry } from '../data/countries';

type Variant = 'light' | 'dark';

interface Props {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  variant?: Variant; // 'dark' = fondo púrpura (onboarding); 'light' = fondo claro (perfil)
}

export function CountrySelector({
  value,
  onChange,
  placeholder = '¿Dónde vives?',
  variant = 'light',
}: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalizeCountry(query);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => normalizeCountry(c).includes(q));
  }, [query]);

  const isDark = variant === 'dark';

  return (
    <>
      <TouchableOpacity
        style={isDark ? styles.triggerDark : styles.triggerLight}
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            isDark ? styles.triggerTextDark : styles.triggerTextLight,
            !value && (isDark ? styles.placeholderDark : styles.placeholderLight),
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={isDark ? 'rgba(255,255,255,0.75)' : COLORS.muted}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.card}>
          <View style={styles.cardHandle} />
          <Text style={styles.cardTitle}>Selecciona tu país</Text>

          {/* Barra de búsqueda fina, mismo estilo que la del buscador Explorar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8C77ED" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Busca un país..."
              placeholderTextColor={COLORS.placeholder}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <TouchableOpacity
                  style={styles.item}
                  activeOpacity={0.7}
                  onPress={() => {
                    onChange(item);
                    setQuery('');
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.itemText, selected && styles.itemTextActive]}>
                    {item}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <Text style={styles.empty}>Sin resultados</Text>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const DARK_BORDER = 'rgba(255,255,255,0.35)';

const styles = StyleSheet.create({
  // Trigger (dropdown)
  triggerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: DARK_BORDER,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  triggerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  triggerTextDark: { color: '#FFFFFF', fontSize: 15, flex: 1 },
  triggerTextLight: { color: COLORS.primary, fontSize: 16, flex: 1 },
  placeholderDark: { color: 'rgba(255,255,255,0.55)' },
  placeholderLight: { color: COLORS.placeholder },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: '75%',
  },
  cardHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#DADADA',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 14,
  },

  // Barra de búsqueda fina
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // Items
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemText: { fontSize: 15, color: COLORS.text },
  itemTextActive: { color: COLORS.primary, fontWeight: '700' },
  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    marginTop: 18,
    fontSize: 14,
  },
});
