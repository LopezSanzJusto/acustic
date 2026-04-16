// hooks/useBiometricAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIO_ENABLED_KEY = 'bio_enabled';
const BIO_EMAIL_KEY = 'bio_email';
const BIO_PASSWORD_KEY = 'bio_password';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'generic' | null;

export const useBiometricAuth = () => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [type, setType] = useState<BiometricType>(null);

  const refresh = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();

    setAvailable(hasHardware && enrolled);

    if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setType('face');
    } else if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setType('fingerprint');
    } else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      setType('iris');
    } else {
      setType(hasHardware ? 'generic' : null);
    }

    const flag = await AsyncStorage.getItem(BIO_ENABLED_KEY);
    setEnabled(flag === 'true');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enableBiometric = async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync(BIO_EMAIL_KEY, email, {
        keychainAccessible: Platform.OS === 'ios'
          ? SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          : undefined,
      });
      await SecureStore.setItemAsync(BIO_PASSWORD_KEY, password, {
        keychainAccessible: Platform.OS === 'ios'
          ? SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          : undefined,
      });
      await AsyncStorage.setItem(BIO_ENABLED_KEY, 'true');
      setEnabled(true);
      return true;
    } catch {
      return false;
    }
  };

  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync(BIO_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIO_PASSWORD_KEY);
    } catch {
      /* ignore */
    }
    await AsyncStorage.removeItem(BIO_ENABLED_KEY);
    setEnabled(false);
  };

  // Pide huella/Face ID y, si autentica, devuelve las credenciales guardadas
  const authenticateAndGetCredentials = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Inicia sesión usando biometría',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (!result.success) return null;

    const email = await SecureStore.getItemAsync(BIO_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(BIO_PASSWORD_KEY);
    if (!email || !password) return null;
    return { email, password };
  };

  return {
    available,
    enabled,
    type,
    refresh,
    enableBiometric,
    disableBiometric,
    authenticateAndGetCredentials,
  };
};
