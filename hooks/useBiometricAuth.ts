// hooks/useBiometricAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIO_ENABLED_KEY  = 'bio_enabled';
const BIO_METHOD_KEY   = 'bio_method';   // 'email' | 'google'
const BIO_EMAIL_KEY    = 'bio_email';
const BIO_PASSWORD_KEY = 'bio_password';

export type BioMethod = 'email' | 'google';

export type BioCredentials =
  | { method: 'email'; email: string; password: string }
  | { method: 'google' }
  | null;

export const useBiometricAuth = () => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled]     = useState(false);

  const refresh = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled    = await LocalAuthentication.isEnrolledAsync();
    setAvailable(hasHardware && enrolled);

    const flag = await AsyncStorage.getItem(BIO_ENABLED_KEY);
    setEnabled(flag === 'true');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const enableBiometricEmail = async (email: string, password: string) => {
    try {
      const opts = Platform.OS === 'ios'
        ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
        : undefined;
      await SecureStore.setItemAsync(BIO_METHOD_KEY,   'email', opts);
      await SecureStore.setItemAsync(BIO_EMAIL_KEY,    email,   opts);
      await SecureStore.setItemAsync(BIO_PASSWORD_KEY, password, opts);
      await AsyncStorage.setItem(BIO_ENABLED_KEY, 'true');
      setEnabled(true);
      return true;
    } catch {
      return false;
    }
  };

  const enableBiometricGoogle = async () => {
    try {
      const opts = Platform.OS === 'ios'
        ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
        : undefined;
      await SecureStore.setItemAsync(BIO_METHOD_KEY, 'google', opts);
      await AsyncStorage.setItem(BIO_ENABLED_KEY, 'true');
      setEnabled(true);
      return true;
    } catch {
      return false;
    }
  };

  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync(BIO_METHOD_KEY);
      await SecureStore.deleteItemAsync(BIO_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIO_PASSWORD_KEY);
    } catch { /* ignore */ }
    await AsyncStorage.removeItem(BIO_ENABLED_KEY);
    setEnabled(false);
  };

  const authenticateAndGetCredentials = async (): Promise<BioCredentials> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Inicia sesión usando biometría',
      cancelLabel:   'Cancelar',
      disableDeviceFallback: false,
    });
    if (!result.success) return null;

    const method = await SecureStore.getItemAsync(BIO_METHOD_KEY) as BioMethod | null;
    if (method === 'google') return { method: 'google' };

    const email    = await SecureStore.getItemAsync(BIO_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(BIO_PASSWORD_KEY);
    if (!email || !password) return null;
    return { method: 'email', email, password };
  };

  return {
    available,
    enabled,
    refresh,
    enableBiometricEmail,
    enableBiometricGoogle,
    disableBiometric,
    authenticateAndGetCredentials,
  };
};
