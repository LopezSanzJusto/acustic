// components/dateInput.tsx
//
// Input de fecha DD / MM / AAAA en tres casillas con auto-avance y retroceso
// entre ellas. Valida al vuelo día/mes/año y llama a `onChange` con el string
// en formato "DD/MM/AAAA" (o '' si la fecha todavía está incompleta).
//
// Variant:
//   - 'dark': fondo púrpura (onboarding)
//   - 'light': fondo claro (perfil)

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

type Variant = 'light' | 'dark';

interface Props {
  value: string; // 'DD/MM/AAAA' o ''
  onChange: (value: string) => void;
  variant?: Variant;
}

const clampDay = (raw: string) => {
  if (!raw) return '';
  const n = parseInt(raw, 10);
  if (isNaN(n)) return '';
  if (n < 1) return '01';
  if (n > 31) return '31';
  return raw;
};
const clampMonth = (raw: string) => {
  if (!raw) return '';
  const n = parseInt(raw, 10);
  if (isNaN(n)) return '';
  if (n < 1) return '01';
  if (n > 12) return '12';
  return raw;
};
const clampYear = (raw: string) => {
  if (!raw) return '';
  if (raw.length < 4) return raw;
  const n = parseInt(raw, 10);
  const current = new Date().getFullYear();
  if (n < 1900) return '1900';
  if (n > current) return String(current);
  return raw;
};

export function DateInput({ value, onChange, variant = 'light' }: Props) {
  const isDark = variant === 'dark';

  const parts = value.split('/');
  const [day, setDay] = useState(parts[0] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [year, setYear] = useState(parts[2] || '');

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Sincroniza cuando el padre resetea value externamente
  useEffect(() => {
    const p = value.split('/');
    setDay(p[0] || '');
    setMonth(p[1] || '');
    setYear(p[2] || '');
  }, [value]);

  const emit = (d: string, m: string, y: string) => {
    if (d && m && y.length === 4) {
      onChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
    } else {
      onChange('');
    }
  };

  const handleDayChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(cleaned);
    emit(cleaned, month, year);
    if (cleaned.length === 2) monthRef.current?.focus();
  };
  const handleMonthChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(cleaned);
    emit(day, cleaned, year);
    if (cleaned.length === 2) yearRef.current?.focus();
  };
  const handleYearChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 4);
    setYear(cleaned);
    emit(day, month, cleaned);
  };

  const onDayBlur = () => { const fixed = clampDay(day); if (fixed !== day) { setDay(fixed); emit(fixed, month, year); } };
  const onMonthBlur = () => { const fixed = clampMonth(month); if (fixed !== month) { setMonth(fixed); emit(day, fixed, year); } };
  const onYearBlur = () => { const fixed = clampYear(year); if (fixed !== year) { setYear(fixed); emit(day, month, fixed); } };

  const containerStyle = isDark ? styles.containerDark : styles.containerLight;
  const cellStyle = isDark ? styles.cellDark : styles.cellLight;
  const textStyle = isDark ? styles.textDark : styles.textLight;
  const placeholderColor = isDark ? 'rgba(255,255,255,0.55)' : COLORS.placeholder;
  const separatorStyle = isDark ? styles.sepDark : styles.sepLight;

  return (
    <View style={containerStyle}>
      <TextInput
        style={[cellStyle, textStyle]}
        value={day}
        onChangeText={handleDayChange}
        onBlur={onDayBlur}
        placeholder="DD"
        placeholderTextColor={placeholderColor}
        keyboardType="number-pad"
        maxLength={2}
        returnKeyType="next"
      />
      <Text style={separatorStyle}>/</Text>
      <TextInput
        ref={monthRef}
        style={[cellStyle, textStyle]}
        value={month}
        onChangeText={handleMonthChange}
        onBlur={onMonthBlur}
        placeholder="MM"
        placeholderTextColor={placeholderColor}
        keyboardType="number-pad"
        maxLength={2}
        returnKeyType="next"
      />
      <Text style={separatorStyle}>/</Text>
      <TextInput
        ref={yearRef}
        style={[cellStyle, textStyle, styles.cellYear]}
        value={year}
        onChangeText={handleYearChange}
        onBlur={onYearBlur}
        placeholder="AAAA"
        placeholderTextColor={placeholderColor}
        keyboardType="number-pad"
        maxLength={4}
        returnKeyType="done"
      />

      <TouchableOpacity style={styles.calendarButton} activeOpacity={0.7} disabled>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={isDark ? '#F5C542' : COLORS.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const DARK_BORDER = 'rgba(255,255,255,0.35)';

const styles = StyleSheet.create({
  containerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DARK_BORDER,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  containerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  cellDark: {
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 6,
  },
  cellLight: {
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 6,
  },
  cellYear: { minWidth: 56 },
  textDark: { color: '#FFFFFF', fontSize: 15 },
  textLight: { color: COLORS.primary, fontSize: 16 },
  sepDark: { color: 'rgba(255,255,255,0.75)', fontSize: 15, marginHorizontal: 4 },
  sepLight: { color: COLORS.muted, fontSize: 16, marginHorizontal: 4 },
  calendarButton: { marginLeft: 'auto', paddingLeft: 8 },
});
