// hooks/useReviews.ts

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from '../services/firebaseConfig';
import { Review } from '../services/reviewService';

export type ReviewWithId = Review & { docId: string };

export function useReviews(tourId: string) {
  const [reviews, setReviews] = useState<ReviewWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<ReviewWithId | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        await firestoreReady;
        const q = query(
          collection(db, 'tours', tourId, 'reviews'),
          orderBy('updatedAt', 'desc'),
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const all: ReviewWithId[] = snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as Review),
        }));

        const uid = auth.currentUser?.uid;
        setUserReview(all.find(r => r.docId === uid) ?? null);
        setReviews(all);
      } catch (e) {
        console.warn('useReviews error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [tourId]);

  return { reviews, userReview, loading };
}
