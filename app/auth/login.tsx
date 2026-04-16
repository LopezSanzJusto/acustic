// app/auth/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    const user = await loginWithEmail(email, password);
    if (user) {
      router.replace('/(tabs)');
    }
  };

  const handleSocialAuth = (provider: string) => {
    Alert.alert("Próximamente", `El inicio de sesión con ${provider} se activará muy pronto.`);
  };

  return (
    <View style={styles.container}>
      {/* Título y Subtítulo */}
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar tu viaje</Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.mainButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Separador */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>O continúa con</Text>
        <View style={styles.divider} />
      </View>

      {/* Social Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialAuth('Google')}>
          <Ionicons name="logo-google" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialAuth('Apple')}>
          <Ionicons name="logo-apple" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      {/* Toggle a Registro */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.footerLink}> Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 30, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.muted },
  form: { gap: 15 },
  input: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  forgotPassword: { alignSelf: 'flex-end', marginTop: -5 },
  forgotPasswordText: { color: COLORS.primary, fontWeight: '600' },
  mainButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  mainButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 15, color: COLORS.muted, fontWeight: '600' },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    borderRadius: 15,
    width: 70,
    alignItems: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: COLORS.muted, fontSize: 16 },
  footerLink: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
});
