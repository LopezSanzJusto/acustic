// hooks/useAuthDB.ts

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export interface UserProfileData {
  name: string;
  lastName: string;
  email: string;
  birthDate: string;   // formato DD/MM/AAAA
  country: string;
}

export const useAuthDB = () => {
  const createUserInDB = async (userId: string, profile: UserProfileData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        name: profile.name,
        lastName: profile.lastName,
        email: profile.email,
        birthDate: profile.birthDate,
        country: profile.country,
        purchasedTours: [],
        favoriteTours: [],
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
