// services/reviewService.ts

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  runTransaction,
} from '@react-native-firebase/firestore';
import { db, auth, firestoreReady } from './firebaseConfig';

export type ReviewInput = {
  audioQuality: number;
  gpsAccuracy: number;
  narrative: number;
  comment?: string;
  progressPercentage?: number;
};

export type Review = ReviewInput & {
  userId: string;
  userName: string;
  userPhoto: string | null;
  createdAt: any;
  updatedAt: any;
};

function clamp1to5(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function avg(...nums: number[]): number {
  const valid = nums.filter(n => Number.isFinite(n) && n > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Lee la review existente del usuario para un tour. null si no la ha hecho.
 */
export async function getUserReview(tourId: string): Promise<Review | null> {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  await firestoreReady;
  const ref = doc(db, 'tours', tourId, 'reviews', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Review) : null;
}

/**
 * Escribe (o actualiza) la review del usuario y recalcula los agregados del tour
 * (rating, reviews, ratingsBreakdown) leyendo todas las reviews. Para volúmenes
 * pequeños es perfectamente válido; cuando escale, migrar a Cloud Function onWrite.
 */
export async function submitReview(tourId: string, input: ReviewInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');

  await firestoreReady;

  const reviewRef = doc(db, 'tours', tourId, 'reviews', user.uid);
  const tourRef = doc(db, 'tours', tourId);

  const audioQuality = clamp1to5(input.audioQuality);
  const gpsAccuracy = clamp1to5(input.gpsAccuracy);
  const narrative = clamp1to5(input.narrative);

  const previous = await getDoc(reviewRef);
  const isNew = !previous.exists();

  await setDoc(
    reviewRef,
    {
      userId: user.uid,
      userName: user.displayName ?? 'Anónimo',
      userPhoto: user.photoURL ?? null,
      audioQuality,
      gpsAccuracy,
      narrative,
      comment: input.comment?.trim() ?? '',
      progressPercentage: input.progressPercentage ?? 0,
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Recalculamos los agregados leyendo todas las reviews del tour
  const reviewsSnap = await getDocs(collection(db, 'tours', tourId, 'reviews'));

  let totalAudio = 0;
  let totalGps = 0;
  let totalNarr = 0;
  let count = 0;

  reviewsSnap.forEach(d => {
    const r = d.data() as Review;
    totalAudio += clamp1to5(r.audioQuality);
    totalGps += clamp1to5(r.gpsAccuracy);
    totalNarr += clamp1to5(r.narrative);
    count += 1;
  });

  const avgAudio = count ? totalAudio / count : 0;
  const avgGps = count ? totalGps / count : 0;
  const avgNarr = count ? totalNarr / count : 0;
  const overall = round1(avg(avgAudio, avgGps, avgNarr));

  await runTransaction(db, async tx => {
    tx.set(
      tourRef,
      {
        rating: overall,
        reviews: count,
        ratingsBreakdown: {
          audioQuality: round1(avgAudio),
          gpsAccuracy: round1(avgGps),
          narrative: round1(avgNarr),
        },
      },
      { merge: true },
    );
  });
}
