// components/tourDetails/tourReviews.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/theme';
import { auth } from '../../services/firebaseConfig';
import { useReviews, ReviewWithId } from '../../hooks/useReviews';

interface TourReviewsProps {
  tourId: string;
}

function overallAvg(r: ReviewWithId): number {
  const vals = [r.audioQuality, r.gpsAccuracy, r.narrative].filter(
    v => typeof v === 'number' && v > 0,
  );
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(value);
        const half = !filled && i <= value + 0.5;
        return (
          <Ionicons
            key={i}
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={i <= Math.ceil(value) && value > 0 ? COLORS.gold : '#D1D5DB'}
            style={{ marginRight: 1 }}
          />
        );
      })}
    </View>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.catRow}>
      <Text style={styles.catLabel}>{label}</Text>
      <StarRow value={value} size={12} />
      <Text style={styles.catValue}>{value > 0 ? value.toFixed(1) : '—'}</Text>
    </View>
  );
}

function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ name, photo }: { name: string; photo?: string | null }) {
  if (photo) {
    return <Image source={{ uri: photo }} style={styles.avatar} />;
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function ReviewCard({ review, isOwn }: { review: ReviewWithId; isOwn: boolean }) {
  const avg = overallAvg(review);
  return (
    <View style={[styles.reviewCard, isOwn && styles.reviewCardOwn]}>
      <View style={styles.reviewHeader}>
        <Avatar name={review.userName ?? 'Anónimo'} photo={review.userPhoto} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.reviewName}>{review.userName ?? 'Anónimo'}</Text>
            {isOwn && (
              <View style={styles.ownBadge}>
                <Text style={styles.ownBadgeText}>Tú</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <StarRow value={avg} size={13} />
            <Text style={styles.reviewDate}>{formatDate(review.updatedAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.catBlock}>
        <CategoryBar label="Audio" value={review.audioQuality ?? 0} />
        <CategoryBar label="GPS" value={review.gpsAccuracy ?? 0} />
        <CategoryBar label="Narrativa" value={review.narrative ?? 0} />
      </View>

      {!!review.comment && (
        <Text style={styles.reviewComment}>"{review.comment}"</Text>
      )}
    </View>
  );
}

export const TourReviews = ({ tourId }: TourReviewsProps) => {
  const router = useRouter();
  const { reviews, userReview, loading } = useReviews(tourId);

  const handlePress = () => {
    if (!auth.currentUser) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para valorar la audioguía.');
      return;
    }
    router.push({ pathname: '/tour/rate/[id]', params: { id: tourId } } as any);
  };

  const hasReviews = reviews.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Valoraciones</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : hasReviews ? (
        <>
          {reviews.map(r => (
            <ReviewCard key={r.docId} review={r} isOwn={r.docId === auth.currentUser?.uid} />
          ))}
        </>
      ) : (
        <Text style={styles.empty}>Aún no hay valoraciones. ¡Sé el primero!</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Ionicons name="star-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
        <Text style={styles.btnText}>
          {userReview ? 'Editar tu valoración' : 'Valora tu experiencia'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 100, marginTop: 20 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 16 },
  empty: { color: COLORS.muted, fontSize: 14, marginBottom: 16, textAlign: 'center' },

  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewCardOwn: { borderColor: COLORS.primary, borderWidth: 1.5 },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: '#E9D5FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  reviewName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  reviewDate: { fontSize: 11, color: COLORS.muted },
  ownBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ownBadgeText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },

  catBlock: { gap: 4, marginBottom: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catLabel: { fontSize: 11, color: COLORS.muted, width: 52 },
  catValue: { fontSize: 11, fontWeight: '600', color: COLORS.textDark, width: 24 },

  reviewComment: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },

  button: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
