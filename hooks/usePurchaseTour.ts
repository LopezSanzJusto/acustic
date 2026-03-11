// hooks/usePurchaseTour.ts
import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Alert } from 'react-native';

export function usePurchaseTour() {
  const [isProcessing, setIsProcessing] = useState(false);

  const addTourToMyList = async (tourId: string): Promise<boolean> => {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      Alert.alert("Error", "Debes iniciar sesión para guardar o realizar rutas.");
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