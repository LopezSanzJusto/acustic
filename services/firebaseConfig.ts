// services/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth } from "firebase/auth";

// ✅ Silenciamos el falso error de TypeScript con @ts-ignore
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth"; 
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 1. Importamos Constants para leer nuestro app.config.js de forma segura
import Constants from 'expo-constants';

// ✅ 2. Extraemos los secretos inyectados
const extra = Constants.expoConfig?.extra;

const firebaseConfig = {
  apiKey: extra?.firebaseApiKey,
  authDomain: extra?.firebaseAuthDomain,
  projectId: extra?.firebaseProjectId,
  storageBucket: extra?.firebaseStorageBucket,
  messagingSenderId: extra?.firebaseMessagingSenderId,
  appId: extra?.firebaseAppId,
  measurementId: extra?.firebaseMeasurementId
};

// Inicializamos la app de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos (Firestore)
export const db = getFirestore(app);

// ✅ 3. Inicializamos Auth manteniendo tu excelente lógica de persistencia móvil
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});