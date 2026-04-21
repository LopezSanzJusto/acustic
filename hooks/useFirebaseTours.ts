// hooks/useFirebaseTours.ts

import { useState, useEffect } from 'react';
import { firestoreReady, warmupTours } from '../services/firebaseConfig';

export function useFirebaseTours() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    firestoreReady.then(() => {
      if (!cancelled) {
        setTours(warmupTours);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return { tours, loading };
}
