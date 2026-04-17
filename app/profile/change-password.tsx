// app/profile/change-password.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { COLORS } from '../../utils/theme';

const PURPLE = COLORS.primary;
const INPUT_BORDER = '#D0CFFE';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Bloque cambio de contraseña
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingChange, setLoadingChange] = useState(false);

  // Bloque recuperación
  const [recoveryEmail, setRecoveryEmail] = useState(auth.currentUser?.email || '');
  const [loadingRecovery, setLoadingRecovery] = useState(false);

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!current || !next || !confirm) {
      Alert.alert('Faltan campos', 'Rellena los tres campos de contraseña.');
      return;
    }
    if (next.length < 6) {
      Alert.alert('Contraseña débil', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('No coinciden', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setLoadingChange(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, next);
      Alert.alert('Contraseña actualizada', 'Tu contraseña ha sido cambiada correctamente.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Alert.alert('Contraseña incorrecta', 'La contraseña actual no es correcta.');
      } else {
        Alert.alert('Error', 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setLoadingChange(false);
    }
  };

  const handleSendLink = async () => {
    const user = auth.currentUser;
    const trimmed = recoveryEmail.trim().toLowerCase();

    if (!trimmed) {
      Alert.alert('Falta el correo', 'Introduce tu correo electrónico.');
      return;
    }
    if (user?.email && trimmed !== user.email.toLowerCase()) {
      Alert.alert('Correo no coincide', 'El correo introducido no está vinculado a esta cuenta.');
      return;
    }

    setLoadingRecovery(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      router.push({
        pathname: '/profile/password-sent',
        params: { email: trimmed },
      } as any);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el correo. Inténtalo de nuevo.');
    } finally {
      setLoadingRecovery(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={PURPLE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cambio de contraseña</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {/* ── Bloque cambio de contraseña ── */}
          <View style={styles.block}>
            <PasswordField
              label="Contraseña actual"
              value={current}
              onChangeText={setCurrent}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
            />
            <PasswordField
              label="Nueva contraseña"
              value={next}
              onChangeText={setNext}
              show={showNext}
              onToggle={() => setShowNext(v => !v)}
            />
            <PasswordField
              label="Confirma nueva contraseña"
              value={confirm}
              onChangeText={setConfirm}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
            />

            <TouchableOpacity
              style={[styles.btn, (!current || !next || !confirm || loadingChange) && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={!current || !next || !confirm || loadingChange}
              activeOpacity={0.85}
            >
              {loadingChange
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Guardar nueva contraseña</Text>}
            </TouchableOpacity>
          </View>

          {/* ── Bloque recuperación ── */}
          <View style={styles.recoveryBlock}>
            <Text style={styles.recoveryTitle}>Recupera tu contraseña</Text>
            <Text style={styles.recoveryDesc}>
              Introduce tu correo asociado a tu cuenta y te enviaremos un link para restablecer la contraseña
            </Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={recoveryEmail}
                onChangeText={setRecoveryEmail}
                placeholder="Introduce tu correo"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loadingRecovery && styles.btnDisabled]}
              onPress={handleSendLink}
              disabled={loadingRecovery}
              activeOpacity={0.85}
            >
              {loadingRecovery
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Envía el link</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
    </View>
  );
}

// Campo contraseña reutilizable
function PasswordField({
  label, value, onChangeText, show, onToggle,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          placeholderTextColor={COLORS.placeholder}
        />
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          <Ionicons name={show ? 'eye' : 'eye-off'} size={20} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const INPUT_BORDER_COLOR = '#C8C5F0';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 18,
    fontWeight: '700', color: PURPLE,
  },
  scroll: { paddingHorizontal: 22, paddingTop: 12 },

  // Bloque superior
  block: { marginBottom: 28 },
  fieldWrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: INPUT_BORDER_COLOR,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 0,
  },
  input: {
    fontSize: 15, color: COLORS.text,
    paddingVertical: 13,
  },

  // Botón
  btn: {
    backgroundColor: PURPLE, borderRadius: 30,
    paddingVertical: 15, alignItems: 'center', marginTop: 6,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Bloque recuperación
  recoveryBlock: {},
  recoveryTitle: {
    fontSize: 18, fontWeight: '700', color: PURPLE,
    textAlign: 'center', marginBottom: 8,
  },
  recoveryDesc: {
    fontSize: 13, color: COLORS.muted, textAlign: 'center',
    lineHeight: 18, marginBottom: 20, paddingHorizontal: 10,
  },
});
