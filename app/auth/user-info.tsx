// app/auth/user-info.tsx
//
// Segundo paso del onboarding: tras "Crea tu cuenta" (email + contraseña),
// pedimos los datos personales y, al pulsar "Explorar audioguías", creamos
// el usuario en Firebase + Firestore y navegamos a la pantalla principal.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { CountrySelector } from '../../components/countrySelector';
import { DateInput } from '../../components/dateInput';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const PLACEHOLDER = 'rgba(255,255,255,0.55)';
const INPUT_BORDER = 'rgba(255,255,255,0.35)';

export default function UserInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email, password } = useLocalSearchParams<{ email?: string; password?: string }>();
  const { registerWithEmail, loading, error } = useAuth();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');

  const isFormValid = useMemo(
    () =>
      nombre.trim().length > 0 &&
      apellido.trim().length > 0 &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate) &&
      country.length > 0,
    [nombre, apellido, birthDate, country]
  );

  const handleExplore = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Falta información de la cuenta. Vuelve atrás e inténtalo de nuevo.');
      return;
    }
    if (!isFormValid) {
      Alert.alert('Faltan campos', 'Rellena todos los campos para continuar.');
      return;
    }

    Keyboard.dismiss();
    const user = await registerWithEmail(password, {
      name: nombre.trim(),
      lastName: apellido.trim(),
      email,
      birthDate,
      country,
    });

    if (user) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 12 }]}
      >
        <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.9)" />
      </TouchableOpacity>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Información de usuario</Text>

        {/* Nombre + Apellido */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Nombre</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={PLACEHOLDER}
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Apellido</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Tu apellido"
                placeholderTextColor={PLACEHOLDER}
                value={apellido}
                onChangeText={setApellido}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        {/* Año de nacimiento */}
        <Text style={styles.label}>Año de nacimiento</Text>
        <View style={{ marginBottom: 18 }}>
          <DateInput value={birthDate} onChange={setBirthDate} variant="dark" />
        </View>

        {/* País */}
        <Text style={styles.label}>País</Text>
        <View style={{ marginBottom: 22 }}>
          <CountrySelector value={country} onChange={setCountry} variant="dark" />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.mainButton, (!isFormValid || loading) && styles.mainButtonDisabled]}
          onPress={handleExplore}
          disabled={loading || !isFormValid}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainButtonText}>Explorar audioguías</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: PURPLE_BG },
  scrollContent: { paddingHorizontal: 26, flexGrow: 1 },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 36,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  halfField: { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  inputWrapper: {
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
  },

  errorText: {
    color: '#FFB4B4',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },

  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
