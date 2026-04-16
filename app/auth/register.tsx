// app/auth/register.tsx

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COUNTRIES, normalizeCountry } from '../../data/countries';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const INPUT_BORDER = 'rgba(255,255,255,0.35)';
const PLACEHOLDER = 'rgba(255,255,255,0.45)';

// Auto-formato DD / MM / AAAA
function formatBirthDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length >= 3) parts.push(digits.slice(2, 4));
  if (digits.length >= 5) parts.push(digits.slice(4, 8));
  return parts.join(' / ');
}

function isValidDate(date: string): boolean {
  const m = date.match(/^(\d{2})\s\/\s(\d{2})\s\/\s(\d{4})$/);
  if (!m) return false;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  return true;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { registerWithEmail, loading, error } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isValidDate(birthDate) &&
      country.length > 0 &&
      email.trim().length > 0 &&
      email.trim().toLowerCase() === emailConfirm.trim().toLowerCase() &&
      password.length >= 6
    );
  }, [name, lastName, birthDate, country, email, emailConfirm, password]);

  const filteredCountries = useMemo(() => {
    const q = normalizeCountry(countryQuery);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => normalizeCountry(c).includes(q));
  }, [countryQuery]);

  // Cuando el TextInput recibe foco, scroll al fondo del formulario
  // para que el teclado nunca tape el campo activo.
  const handleFocusScroll = (offsetY: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offsetY, animated: true });
    }, 100);
  };

  const handleRegister = async () => {
    if (!name || !lastName || !birthDate || !country || !email || !emailConfirm || !password) {
      Alert.alert('Faltan campos', 'Por favor, completa todos los campos.');
      return;
    }
    if (!isValidDate(birthDate)) {
      Alert.alert('Fecha inválida', 'Introduce una fecha en formato DD / MM / AAAA.');
      return;
    }
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      Alert.alert('Email no coincide', 'La confirmación de email no coincide.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    Keyboard.dismiss();
    const user = await registerWithEmail(password, {
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Botón volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Título */}
        <Text style={styles.title}>Información de usuario</Text>

        {/* Nombre + Apellido */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu nombre"
              placeholderTextColor={PLACEHOLDER}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu apellido"
              placeholderTextColor={PLACEHOLDER}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Fecha de nacimiento */}
        <Text style={styles.label}>Año de nacimiento</Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="DD / MM / AAAA"
            placeholderTextColor={PLACEHOLDER}
            value={birthDate}
            onChangeText={(t) => setBirthDate(formatBirthDate(t))}
            keyboardType="number-pad"
            maxLength={14}
          />
          <Ionicons name="calendar" size={22} color="#FFFFFF" style={styles.inputIcon} />
        </View>

        {/* País */}
        <Text style={styles.label}>País</Text>
        <TouchableOpacity
          style={[styles.input, styles.dropdown]}
          onPress={() => {
            setCountryQuery('');
            setShowCountryModal(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownText, !country && styles.placeholder]}>
            {country || '¿Dónde vives?'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor={PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => handleFocusScroll(420)}
        />

        {/* Confirmación de email */}
        <Text style={styles.label}>Confirmación de email</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          placeholderTextColor={PLACEHOLDER}
          value={emailConfirm}
          onChangeText={setEmailConfirm}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => handleFocusScroll(520)}
        />

        {/* Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={PLACEHOLDER}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => handleFocusScroll(620)}
        />

        {/* Error Firebase */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Botón principal */}
        <TouchableOpacity
          style={[styles.mainButton, (!isFormValid || loading) && styles.mainButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainButtonText}>Explorar audioguías</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal selector de país con buscador */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecciona tu país</Text>

            {/* Buscador estilo Explore */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8C77ED" />
              <TextInput
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="Busca tu país..."
                placeholderTextColor="#999999"
                style={styles.searchInput}
                autoFocus
                autoCorrect={false}
              />
              {countryQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCountryQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => (
                <Text style={styles.noResultsText}>No se encontraron países.</Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.countryText}>{item}</Text>
                  {country === item && (
                    <Ionicons name="checkmark" size={20} color={PURPLE_BG} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: PURPLE_BG },
  container: { flex: 1, backgroundColor: PURPLE_BG },
  scrollContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 320 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 14,
    paddingRight: 14,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    paddingRight: 0,
  },
  inputIcon: { marginLeft: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: '#FFFFFF', fontSize: 15 },
  placeholder: { color: PLACEHOLDER },
  errorText: {
    color: '#FFB4B4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    height: '75%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryText: { fontSize: 16, color: '#1A1A1A' },
  noResultsText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999999',
    fontSize: 14,
  },
});
