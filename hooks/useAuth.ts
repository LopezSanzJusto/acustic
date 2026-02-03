// hooks/useAuth.ts

import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAuthDB } from './useAuthDB';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createUserInDB } = useAuthDB();

  // 1. REGISTRO con Email y Contraseña
  const registerWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // A. Creamos el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // B. Guardamos sus datos extra en Firestore
      await createUserInDB(userCredential.user.uid, email, name);
      
      return userCredential.user;
    } catch (err: any) {
      // Traducimos los errores comunes de Firebase al español
      if (err.code === 'auth/email-already-in-use') setError('El correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña es muy débil (mínimo 6 caracteres).');
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
      setError('Correo o contraseña incorrectos.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 3. LOGOUT (Cerrar sesión)
  const logOut = async () => {
    await signOut(auth);
  };

  return { registerWithEmail, loginWithEmail, logOut, loading, error };
};