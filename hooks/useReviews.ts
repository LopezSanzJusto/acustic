// hooks/useReviews.ts

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { db, auth, firestoreReady } from '../services/firebaseConfig';
import { Review } from '../services/reviewService';

export type ReviewWithId = Review & { docId: string };

export function useReviews(tourId: string) {
  const [reviews, setReviews] = useState<ReviewWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<ReviewWithId | null>(null);

  useEffect(() => {
    if (!tourId) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      // Sin red no montamos el listener: el SDK de Firestore lanzaría
      // "Could not load bundle" como unhandled rejection.
      const net = await NetInfo.fetch();
      if (!(net.isConnected ?? false)) {
        setLoading(false);
        return;
      }

      await firestoreReady;
      if (cancelled) return;

      const q = query(
        collection(db, 'tours', tourId, 'reviews'),
        orderBy('updatedAt', 'desc'),
      );

      unsubscribe = onSnapshot(
        q,
        snap => {
          const all: ReviewWithId[] = snap.docs.map(d => ({
            docId: d.id,
            ...(d.data() as Review),
          }));
          const uid = auth.currentUser?.uid;
          setUserReview(all.find(r => r.docId === uid) ?? null);
          setReviews(all);
          setLoading(false);
        },
        e => {
          console.warn('useReviews snapshot error:', e);
          setLoading(false);
        },
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [tourId]);

  return { reviews, userReview, loading };
}
