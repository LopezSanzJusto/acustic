// hooks/useTourProgress.ts

import { setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

export const useTourProgress = () => {
  
  const saveProgress = async (tourId: string, percentage: number) => {
    // Obtenemos el ID del usuario logueado actualmente
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      // Usamos setDoc con merge: true. 
      // Esto es VITAL: actualiza solo el progreso de ESTA ruta en concreto, 
      // sin borrar los progresos de otras rutas ni los datos del perfil del usuario.
      await setDoc(doc(db, 'users', userId), {
        progress: {
          [tourId]: percentage
        }
      }, { merge: true });
      
    } catch (error) {
      console.error("Error al guardar el progreso en Firebase:", error);
    }
  };

  return { saveProgress };
};