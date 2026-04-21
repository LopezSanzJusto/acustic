// hooks/useSocialAuth.ts

import { useState } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

// Configuración de Google Sign-In. webClientId se obtiene del Firebase Console
// (Authentication → Sign-in method → Google → Web SDK configuration).
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

// Crea el documento del usuario en Firestore si es la primera vez que entra
const ensureUserDocument = async (
  userId: string,
  email: string,
  displayName?: string | null
) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const [first, ...rest] = (displayName || '').split(' ');
    await setDoc(userRef, {
      name: first || '',
      lastName: rest.join(' '),
      email,
      birthDate: '',
      country: '',
      purchasedTours: [],
      favoriteTours: [],
      createdAt: new Date(),
    });
  }
};

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo: any = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken ?? userInfo?.idToken;
      if (!idToken) throw new Error('No se obtuvo el idToken de Google');

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      await ensureUserDocument(
        result.user.uid,
        result.user.email || '',
        result.user.displayName
      );
      return result.user;
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // usuario canceló: no mostramos error
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Ya hay un inicio de sesión en curso.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services no está disponible.');
      } else {
        setError('Error al iniciar sesión con Google.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    if (Platform.OS !== 'ios') {
      setError('El inicio de sesión con Apple solo está disponible en iOS.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        setError('Inicio de sesión con Apple no disponible en este dispositivo.');
        return null;
      }

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleCredential.identityToken) {
        throw new Error('Apple no devolvió identityToken');
      }

      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
      });
      const result = await signInWithCredential(auth, firebaseCredential);

      const displayName = appleCredential.fullName
        ? `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim()
        : result.user.displayName;
      await ensureUserDocument(result.user.uid, result.user.email || '', displayName);
      return result.user;
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 'ERR_CANCELED') {
        // usuario canceló
      } else {
        setError('Error al iniciar sesión con Apple.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loginWithGoogle, loginWithApple, loading, error };
};
