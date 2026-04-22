// hooks/useAuth.ts

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from '@react-native-firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAuthDB, UserProfileData } from './useAuthDB';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createUserInDB } = useAuthDB();

  // 1. REGISTRO con Email y Contraseña + perfil completo
  const registerWithEmail = async (password: string, profile: UserProfileData) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, profile.email, password);
      await createUserInDB(userCredential.user.uid, profile);
      return userCredential.user;
    } catch (err: any) {
      console.log('🔴 REGISTER ERROR →', { code: err?.code, message: err?.message, full: err });
      if (err.code === 'auth/email-already-in-use') setError('El correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña es muy débil (mínimo 6 caracteres).');
      else if (err.code === 'auth/invalid-email') setError('El correo no es válido.');
      else setError('Error al registrar usuario. Inténtalo de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIN con Email y Contraseña
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      console.log('🔴 LOGIN ERROR →', { code: err?.code, message: err?.message, full: err });
      setError('Correo o contraseña incorrectos.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 3. RECUPERAR CONTRASEÑA
  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      console.log('🔴 RESET ERROR →', { code: err?.code, message: err?.message, full: err });
      if (err.code === 'auth/user-not-found') setError('No existe ninguna cuenta con este correo.');
      else if (err.code === 'auth/invalid-email') setError('El correo no es válido.');
      else if (err.code === 'auth/too-many-requests') setError('Demasiados intentos. Espera unos minutos.');
      else setError('Error al enviar el email. Inténtalo de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 4. LOGOUT
  const logOut = async () => {
    if (!auth.currentUser) return;
    try {
      await signOut(auth);
    } catch (err: any) {
      if (err?.code === 'auth/no-current-user') return;
      console.log('🔴 LOGOUT ERROR →', { code: err?.code, message: err?.message });
    }
  };

  return { registerWithEmail, loginWithEmail, sendPasswordReset, logOut, loading, error };
};
