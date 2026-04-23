// hooks/useUserPreferences.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

export interface UserPreferences {
  popupNearPoi: boolean;
  autoPlayNearPoi: boolean;
  autoDownload: boolean;
  newsletter: boolean;
  promos: boolean;
}

const DEFAULTS: UserPreferences = {
  popupNearPoi: false,
  autoPlayNearPoi: false,
  autoDownload: true,
  newsletter: false,
  promos: false,
};

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    firestoreReady.then(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          setPrefs({ ...DEFAULTS, ...(data?.preferences ?? {}) });
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    });
  }, []);

  const updatePref = async (key: keyof UserPreferences, value: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    // Optimistic update
    setPrefs(p => ({ ...p, [key]: value }));
    try {
      await updateDoc(doc(db, 'users', uid), { [`preferences.${key}`]: value });
    } catch {
      // Revert si falla
      setPrefs(p => ({ ...p, [key]: !value }));
    }
  };

  return { prefs, loading, updatePref };
}
