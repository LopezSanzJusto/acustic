// app/auth/register.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const SOCIAL_BG = '#D9D9E3';
const INPUT_BORDER = 'rgba(255,255,255,0.35)';
const PLACEHOLDER = 'rgba(255,255,255,0.55)';
const LINK_HIGHLIGHT = '#F5A623';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithGoogle, loginWithApple, loading: socialLoading, error: socialError } = useSocialAuth();
  const { available, enabled, enableBiometricGoogle } = useBiometricAuth();

  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = useMemo(
    () =>
      email.trim().length > 0 &&
      email.trim().toLowerCase() === emailConfirm.trim().toLowerCase() &&
      password.length >= 6,
    [email, emailConfirm, password]
  );

  const handleContinue = () => {
    if (!email.trim() || !emailConfirm.trim() || !password) {
      Alert.alert('Faltan campos', 'Introduce email, confirmación y contraseña.');
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
    router.push({
      pathname: '/auth/user-info',
      params: {
        email: email.trim().toLowerCase(),
        password,
      },
    });
  };

  const handleGoogle = async () => {
    const user = await loginWithGoogle();
    if (!user) return;

    if (available && !enabled) {
      Alert.alert(
        'Acceso rápido',
        '¿Quieres usar biometría para entrar la próxima vez?',
        [
          { text: 'Ahora no', style: 'cancel', onPress: () => router.replace('/(tabs)') },
          { text: 'Activar', onPress: async () => { await enableBiometricGoogle(); router.replace('/(tabs)'); } },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleApple = async () => {
    const user = await loginWithApple();
    if (user) router.replace('/(tabs)');
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
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text style={styles.title}>Crea tu cuenta</Text>

        {/* Botones sociales */}
        <View style={styles.socialBlock}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogle}
            disabled={socialLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.socialIcon} />
            <Text style={styles.socialText}>Continuar con Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleApple}
              disabled={socialLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" style={styles.socialIcon} />
              <Text style={[styles.socialText, styles.appleText]}>Continuar con Apple</Text>
            </TouchableOpacity>
          )}

          {socialLoading && <ActivityIndicator color="#FFFFFF" />}
          {socialError ? <Text style={styles.errorText}>{socialError}</Text> : null}
        </View>

        {/* Separador */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o si lo prefieres</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color="#FF8A4C" style={styles.inputLeftIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={PLACEHOLDER}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Confirmación de email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-open" size={20} color="#FF8A4C" style={styles.inputLeftIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirma tu email"
            placeholderTextColor={PLACEHOLDER}
            value={emailConfirm}
            onChangeText={setEmailConfirm}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#F5C542" style={styles.inputLeftIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Botón crear cuenta (continúa al siguiente paso de onboarding) */}
        <TouchableOpacity
          style={[styles.mainButton, !isFormValid && styles.mainButtonDisabled]}
          onPress={handleContinue}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <Text style={styles.mainButtonText}>Crear cuenta</Text>
        </TouchableOpacity>

        {/* Términos */}
        <Text style={styles.termsText}>
          Al crear una cuenta, aceptas nuestros{' '}
          <Text style={styles.termsBold}>Términos y Condiciones</Text> y{' '}
          <Text style={styles.termsBold}>Política de Privacidad</Text>.
        </Text>

        {/* Link a login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta con nosotros? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: PURPLE_BG },
  scrollContent: {
    paddingHorizontal: 26,
    flexGrow: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },

  // Social
  socialBlock: { gap: 14, marginBottom: 22 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOCIAL_BG,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  socialIcon: { marginRight: 12 },
  socialText: {
    color: '#3A3A3A',
    fontSize: 15,
    fontWeight: '500',
  },
  appleButton: { backgroundColor: '#000000' },
  appleText: { color: '#FFFFFF' },
  errorText: {
    color: '#FFB4B4',
    fontSize: 13,
    textAlign: 'center',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginHorizontal: 12,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 30,
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

  // Botón principal
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 22,
  },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Términos
  termsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  termsBold: { fontWeight: '700', color: '#FFFFFF' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    flexWrap: 'wrap',
  },
  footerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  footerLink: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: LINK_HIGHLIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
