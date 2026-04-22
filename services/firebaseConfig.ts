// services/firebaseConfig.ts

import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, collection, getDocs, onSnapshot } from '@react-native-firebase/firestore';

// Con @react-native-firebase, la app se inicializa automáticamente desde
// google-services.json / GoogleService-Info.plist. No hace falta firebaseConfig.
const app = getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

// Cache de tours compartido: el warmup lo rellena, useFirebaseTours lo consume.
export let warmupTours: { id: string; [key: string]: any }[] = [];

let _resolveReady!: () => void;
export const firestoreReady = new Promise<void>(resolve => { _resolveReady = resolve; });

(async function warmup() {
  try {
    const snap = await getDocs(collection(db, 'tours'));
    warmupTours = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    console.log(`✅ Firestore listo — ${warmupTours.length} tours`);
    _resolveReady();
  } catch (e) {
    console.log('⚠️ Warmup falló, reintentando:', e);
    setTimeout(() => (async () => {
      try {
        const snap = await getDocs(collection(db, 'tours'));
        warmupTours = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        _resolveReady();
      } catch { _resolveReady(); }
    })(), 1000);
  }
})();
