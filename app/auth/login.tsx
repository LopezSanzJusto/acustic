// app/auth/login.tsx

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const INPUT_BORDER = 'rgba(255,255,255,0.35)';
const PLACEHOLDER = 'rgba(255,255,255,0.55)';
const LINK_HIGHLIGHT = '#F5A623';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithEmail, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    Keyboard.dismiss();
    const user = await loginWithEmail(email, password);
    if (user) {
      router.replace('/(tabs)');
    }
  };

  // TODO: activar cuando se haga el build nativo con expo-local-authentication
  const handleBiometric = () => {
    Alert.alert('Próximamente', 'El inicio de sesión por biometría se activará en una próxima versión.');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
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
        {/* Título */}
        <Text style={styles.title}>Unlock your journey</Text>
        <Text style={styles.subtitle}>
          Start exploring{'\n'}the world{'\n'}through sound
        </Text>

        {/* Biometría */}
        <TouchableOpacity
          style={styles.faceIdButton}
          onPress={handleBiometric}
          activeOpacity={0.85}
        >
          <Ionicons name="happy-outline" size={24} color="#6FB8FF" style={styles.faceIdIcon} />
          <Text style={styles.faceIdText}>Inicia sesión usando biometría</Text>
        </TouchableOpacity>

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

        {/* Contraseña */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#F5C542" style={styles.inputLeftIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#9EEDD6"
            />
          </TouchableOpacity>
        </View>

        {/* Olvidaste contraseña */}
        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Botón login */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainButtonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta con nosotros? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Crea una</Text>
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
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 34,
    lineHeight: 26,
  },

  // Face ID
  faceIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE_BUTTON,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  faceIdIcon: { marginRight: 10 },
  faceIdText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  eyeButton: { paddingLeft: 8 },

  // Forgot password
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 6,
  },
  forgotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: LINK_HIGHLIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

  errorText: {
    color: '#FFB4B4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },

  // Main button
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 38,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
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
