// hooks/useMyTours.ts

import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, documentId } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../services/firebaseConfig';

export function useMyTours() {
  const [purchasedTours, setPurchasedTours] = useState<any[]>([]);
  const [favoriteTours, setFavoriteTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const fetchToursByIds = async (
      ids: string[],
      progressMap: Record<string, number>,
      downloadedSet: Set<string>,
    ) => {
      if (ids.length === 0) return [];
      const q = query(collection(db, 'tours'), where(documentId(), 'in', ids));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        progressPercentage: progressMap[d.id] || 0,
        isDownloaded: downloadedSet.has(d.id),
      }));
    };

    const setup = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) { setLoading(false); return; }

      await firestoreReady;
      if (cancelled) return;

      unsubscribe = onSnapshot(
        doc(db, 'users', userId),
        async (userDoc) => {
          if (cancelled) return;
          if (userDoc.exists()) {
            const data = userDoc.data();
            const progressMap = data.progress || {};
            const downloadedSet = new Set<string>(data.downloadedTours || []);
            const [purchases, favorites] = await Promise.all([
              fetchToursByIds(data.purchasedTours || [], progressMap, downloadedSet),
              fetchToursByIds(data.favoriteTours || [], progressMap, downloadedSet),
            ]);
            if (!cancelled) {
              setPurchasedTours(purchases);
              setFavoriteTours(favorites);
            }
          }
          if (!cancelled) setLoading(false);
        },
        () => { if (!cancelled) setLoading(false); }
      );
    };

    setup();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { purchasedTours, favoriteTours, loading };
}
