// contexts/CreatorContext.tsx
//
// Provider que instancia `useTourDraft` UNA sola vez y lo expone a las
// pantallas del wizard del panel de creador a través de `useCreator()`.
//
// Importante: cualquier pantalla bajo `/creator/*` debe estar envuelta por
// `<CreatorProvider>` (lo haremos en `app/creator/_layout.tsx`). Llamar a
// `useTourDraft` directamente desde una pantalla rompería la sincronía
// entre las pantallas del wizard.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { useTourDraft, type UseTourDraftResult } from '@/hooks/useTourDraft';

export interface CreatorContextValue extends UseTourDraftResult {
  /** uid del usuario actual; `null` si no hay sesión. */
  creatorId: string | null;
}

const CreatorContext = createContext<CreatorContextValue | null>(null);

export function CreatorProvider({ children }: { children: React.ReactNode }) {
  const [creatorId, setCreatorId] = useState<string | null>(
    auth.currentUser?.uid ?? null,
  );

  useEffect(() => {
    // Mantiene el provider en sync si el usuario hace login/logout mientras
    // el wizard está abierto. Devuelve la función de unsubscribe.
    const unsub = onAuthStateChanged(auth, (user) => {
      setCreatorId(user?.uid ?? null);
    });
    return unsub;
  }, []);

  const draftState = useTourDraft(creatorId);

  const value: CreatorContextValue = {
    ...draftState,
    creatorId,
  };

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useCreator(): CreatorContextValue {
  const ctx = useContext(CreatorContext);
  if (!ctx) {
    throw new Error('useCreator() debe usarse dentro de <CreatorProvider>');
  }
  return ctx;
}
