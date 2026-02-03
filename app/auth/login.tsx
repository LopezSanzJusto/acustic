// app/auth/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, COMMON_STYLES } from '../../utils/theme';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { registerWithEmail, loginWithEmail, loading, error } = useAuth();

  // Estados del formulario
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Registro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Manejar el botón principal
  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    const user = isLogin 
      ? await loginWithEmail(email, password)
      : await registerWithEmail(email, password, name);

    // Si todo va bien, redirigimos al Explora
    if (user) {
      router.replace('/(tabs)');
    }
  };

  // Simulación para Social Auth en MVP 1.0
  const handleSocialAuth = (provider: string) => {
    Alert.alert("Próximamente", `El inicio de sesión con ${provider} se activará muy pronto.`);
  };

  return (
    <View style={styles.container}>
      {/* Título y Subtítulo */}
      <View style={styles.header}>
        <Text style={styles.title}>{isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Inicia sesión para continuar tu viaje" : "Regístrate para guardar tus audioguías"}
        </Text>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor={COLORS.placeholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
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

        {/* Mensaje de error de Firebase */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {isLogin && (
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        )}

        {/* Botón Principal */}
        <TouchableOpacity style={styles.mainButton} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.mainButtonText}>{isLogin ? "Iniciar Sesión" : "Registrarse"}</Text>
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

      {/* Toggle Login/Registro */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes una cuenta?"}
        </Text>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.footerLink}>{isLogin ? " Regístrate" : " Inicia Sesión"}</Text>
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