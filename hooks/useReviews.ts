// hooks/useReviews.ts

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
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

    firestoreReady.then(() => {
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
    });

    return () => { unsubscribe?.(); };
  }, [tourId]);

  return { reviews, userReview, loading };
}
