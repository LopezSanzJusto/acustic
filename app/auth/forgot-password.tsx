// app/auth/forgot-password.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const INPUT_BORDER = 'rgba(255,255,255,0.35)';
const PLACEHOLDER = 'rgba(255,255,255,0.55)';
const LINK_HIGHLIGHT = '#FF9505';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendPasswordReset, loading, error } = useAuth();
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    Keyboard.dismiss();
    const ok = await sendPasswordReset(trimmed);
    if (ok) {
      router.replace({ pathname: '/auth/email-sent', params: { email: trimmed } });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recupera tu contraseña</Text>
        <Text style={styles.subtitle}>
          Introduce tu correo asociado con tu cuenta y te enviaremos un link para restablecer tu
          contraseña
        </Text>

        <Text style={styles.label}>Correo electrónico</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color="#FF8A4C" style={styles.inputLeftIcon} />
          <TextInput
            style={styles.input}
            placeholder="Introduce tu correo"
            placeholderTextColor={PLACEHOLDER}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.mainButton, (!email.trim() || loading) && styles.mainButtonDisabled]}
          onPress={handleSend}
          disabled={loading || !email.trim()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainButtonText}>Envía el link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.footerLinkWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.footerLink}>Vuelve a la pantalla de inicio de sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: PURPLE_BG },
  scrollContent: { paddingHorizontal: 26, flexGrow: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 20,
    paddingHorizontal: 14,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 14,
  },
  inputLeftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
  },
  errorText: {
    color: '#FFB4B4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerLinkWrapper: { alignSelf: 'center', marginTop: 18 },
  footerLink: {
    color: LINK_HIGHLIGHT,
    fontSize: 13,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: LINK_HIGHLIGHT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
