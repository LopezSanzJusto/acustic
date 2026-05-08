// app/profile/password-sent.tsx
// Pantalla de confirmación tras enviar el link de recuperación desde el perfil.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendPasswordResetEmail } from '@react-native-firebase/auth';
import { auth } from '../../services/firebaseConfig';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const LINK_HIGHLIGHT = '#F5A623';

export default function PasswordSentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } finally {
      setResending(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Revisa tu email</Text>

      <Image
        source={require('../../assets/images/icons/Correo_Enviado.png')}
        style={styles.correoIcon}
        resizeMode="contain"
      />

      <Text style={styles.confirmation}>¡Correo enviado!</Text>

      <Text style={styles.description}>
        Te hemos enviado un link para restablecer la contraseña al correo{' '}
        <Text style={styles.emailText}>{email || '—'}</Text>.{'\n'}
        Revisa tu bandeja de entrada y sigue las instrucciones.
      </Text>

      <Text style={styles.spamText}>
        Acuérdate de mirar en{' '}
        <Text style={styles.spamHighlight}>SPAM</Text>{' '}o{' '}
        <Text style={styles.spamHighlight}>correo no deseado</Text>
      </Text>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.replace('/(tabs)/profile' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.mainButtonText}>Volver al perfil</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No lo has recibido aún? </Text>
        <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
          {resending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.footerLink}>Reenviar link</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#39398A', paddingHorizontal: 26,
  },
  title: {
    fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center',
  },
  correoIcon: {
    alignSelf: 'center', width: 100, height: 100, marginTop: 32,
  },
  confirmation: {
    fontSize: 26, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', marginTop: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.85)', fontSize: 13,
    textAlign: 'center', marginTop: 18,
    lineHeight: 20, paddingHorizontal: 8,
  },
  emailText: { color: '#FFFFFF', fontWeight: '700' },
  spamText: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12,
    textAlign: 'center', marginTop: 18, paddingHorizontal: 10,
  },
  spamHighlight: { color: '#FF9505', fontWeight: '700' },
  spacer: { flex: 1 },
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 18, flexWrap: 'wrap',
  },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  footerLink: {
    color: '#FF9505', fontSize: 13, fontWeight: '700',
    backgroundColor: 'transparent',
    paddingHorizontal: 3,
    borderRadius: 6, borderWidth: 0.5, borderColor: '#FF9505',
  },
});
