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
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

const PURPLE_BG    = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const INPUT_BORDER  = 'rgba(255,255,255,0.35)';
const PLACEHOLDER   = 'rgba(255,255,255,0.55)';
const LINK_HIGHLIGHT = '#FF9505';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithEmail, loading, error } = useAuth();
  const { loginWithGoogleSilently } = useSocialAuth();
  const { available, enabled, enableBiometricEmail, authenticateAndGetCredentials } = useBiometricAuth();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const offerBiometric = (onAccept: () => Promise<boolean | void>) => {
    if (!available || enabled) return;
    Alert.alert(
      'Acceso rápido',
      '¿Quieres usar biometría para entrar la próxima vez?',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => router.replace('/(tabs)') },
        { text: 'Activar', onPress: async () => { await onAccept(); router.replace('/(tabs)'); } },
      ]
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    Keyboard.dismiss();
    const user = await loginWithEmail(email.trim().toLowerCase(), password);
    if (!user) return;

    if (available && !enabled) {
      offerBiometric(() => enableBiometricEmail(email.trim().toLowerCase(), password));
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBiometric = async () => {
    const credentials = await authenticateAndGetCredentials();
    if (!credentials) return;

    if (credentials.method === 'google') {
      const user = await loginWithGoogleSilently();
      if (user) router.replace('/(tabs)');
    } else {
      const user = await loginWithEmail(credentials.email, credentials.password);
      if (user) router.replace('/(tabs)');
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
        <Text style={styles.title}>Unlock your journey</Text>
        <Text style={styles.subtitle}>
          Start exploring{'\n'}the world{'\n'}through sound
        </Text>

        {/* Botón biometría — solo si disponible y activada */}
        {available && enabled && (
          <TouchableOpacity
            style={styles.bioButton}
            onPress={handleBiometric}
            activeOpacity={0.85}
          >
            <Ionicons name="finger-print-outline" size={24} color="#6FB8FF" style={styles.bioIcon} />
            <Text style={styles.bioText}>Inicia sesión con biometría</Text>
          </TouchableOpacity>
        )}

        {available && enabled && (
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o si lo prefieres</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

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
            onPress={() => setShowPassword(p => !p)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#9EEDD6" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/auth/forgot-password')}
          style={styles.forgotWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Iniciar sesión</Text>}
        </TouchableOpacity>

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
  scrollContent: { paddingHorizontal: 26, flexGrow: 1 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: {
    color: 'rgba(255,255,255,0.75)', fontSize: 20, fontStyle: 'italic',
    fontWeight: '400', textAlign: 'center', marginBottom: 34, lineHeight: 26,
  },
  bioButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PURPLE_BUTTON, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 18, marginBottom: 20,
  },
  bioIcon: { marginRight: 10 },
  bioText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  dividerText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginHorizontal: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: INPUT_BORDER, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 4, marginBottom: 14,
  },
  inputLeftIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 12 },
  eyeButton: { paddingLeft: 8 },
  forgotWrapper: { alignSelf: 'flex-end', marginTop: 2, marginBottom: 6 },
  forgotText: {
    color: LINK_HIGHLIGHT, fontSize: 12, fontWeight: '600',
    borderWidth: 1.5, borderColor: LINK_HIGHLIGHT,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12, overflow: 'hidden',
  },
  errorText: { color: '#FFB4B4', fontSize: 14, textAlign: 'center', marginTop: 12 },
  mainButton: {
    backgroundColor: PURPLE_BUTTON, paddingVertical: 18,
    borderRadius: 12, alignItems: 'center', marginTop: 38,
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, flexWrap: 'wrap' },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  footerLink: {
    color: LINK_HIGHLIGHT, fontSize: 13, fontWeight: '700',
    borderWidth: 1.5, borderColor: LINK_HIGHLIGHT,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12, overflow: 'hidden',
  },
});
