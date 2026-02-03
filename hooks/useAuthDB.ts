// hooks/useAuthDB.ts

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const useAuthDB = () => {
  // Función para crear el perfil del usuario en Firestore
  const createUserInDB = async (userId: string, email: string, name: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      // setDoc crea el documento si no existe o lo sobrescribe si ya existe
      await setDoc(userRef, {
        name: name,
        email: email,
        purchasedTours: [], // Array vacío inicial
        favoriteTours: [],  // Array vacío inicial
        createdAt: new Date(),
      });
      console.log("✅ Perfil de usuario creado en Firestore");
    } catch (error) {
      console.error("❌ Error creando usuario en BBDD:", error);
      throw error;
    }
  };

  return { createUserInDB };
};