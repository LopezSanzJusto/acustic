// app/auth/email-sent.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const PURPLE_BG = '#3D3E8C';
const PURPLE_BUTTON = '#A39BF8';
const LINK_HIGHLIGHT = '#F5A623';

export default function EmailSentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset } = useAuth();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const ok = await sendPasswordReset(email);
    setResending(false);
    if (ok) {
      Alert.alert('Reenviado', 'Hemos vuelto a enviar el correo de recuperación.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 },
      ]}
    >
      <Text style={styles.title}>Revisa tu email</Text>

      <View style={styles.iconWrapper}>
        <View style={styles.envelope}>
          <Ionicons name="mail" size={64} color="#A39BF8" />
        </View>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.confirmation}>¡Correo enviado!</Text>

      <Text style={styles.description}>
        Te hemos enviado un link para restablecer la contraseña al correo:{' '}
        <Text style={styles.emailText}>{email || '—'}</Text>. Revisa tu bandeja de entrada y sigue
        las instrucciones.
      </Text>

      <Text style={styles.spamText}>
        Acuérdate de mirar en tu <Text style={styles.spamBold}>SPAM</Text> si el correo no ha
        llegado
      </Text>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.replace('/auth/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.mainButtonText}>Volver a Inicio de sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No la has recibido aún? </Text>
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
    flex: 1,
    backgroundColor: PURPLE_BG,
    paddingHorizontal: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  iconWrapper: {
    alignSelf: 'center',
    marginTop: 32,
    width: 110,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelope: {
    width: 100,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: PURPLE_BG,
  },
  confirmation: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  emailText: { color: LINK_HIGHLIGHT, fontWeight: '700' },
  spamText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 10,
  },
  spamBold: { color: LINK_HIGHLIGHT, fontWeight: '700' },
  spacer: { flex: 1 },
  mainButton: {
    backgroundColor: PURPLE_BUTTON,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
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
