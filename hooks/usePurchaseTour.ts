// hooks/usePurchaseTour.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc, arrayUnion } from '@react-native-firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { useRouter } from 'expo-router';

export function usePurchaseTour() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const addTourToMyList = async (tourId: string): Promise<boolean> => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      router.push('/welcome' as any);
      return false;
    }

    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', userId);
      // arrayUnion añade el elemento solo si no existe previamente
      await updateDoc(userRef, {
        purchasedTours: arrayUnion(tourId)
      });
      return true;
    } catch (error) {
      console.error("Error al añadir a mis rutas:", error);
      Alert.alert("Error", "No se pudo añadir la ruta a tu perfil. Inténtalo de nuevo.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { addTourToMyList, isProcessing };
}