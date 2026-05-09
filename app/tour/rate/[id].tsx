// app/tour/rate/[id].tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc } from '@react-native-firebase/firestore';

import { db, auth, firestoreReady } from '../../../services/firebaseConfig';
import { COLORS } from '../../../utils/theme';
import { submitReview, getUserReview } from '../../../services/reviewService';

type RatingKey = 'audioQuality' | 'gpsAccuracy' | 'narrative';

const RATING_LABELS: { key: RatingKey; label: string }[] = [
  { key: 'audioQuality', label: 'Calidad del audio' },
  { key: 'gpsAccuracy', label: 'Precisión del GPS' },
  { key: 'narrative', label: 'Narrativa y usabilidad' },
];

export default function RateTourScreen() {
  const { id, completed } = useLocalSearchParams<{ id: string; completed?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showCelebration = completed === 'true';

  const [tour, setTour] = useState<any>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    audioQuality: 0,
    gpsAccuracy: 0,
    narrative: 0,
  });
  const [comment, setComment] = useState('');

  const tourImage = useMemo(() => {
    if (!tour) return null;
    if (Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0) return tour.imageUrls[0];
    return tour.image ?? null;
  }, [tour]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      try {
        await firestoreReady;

        const [tourSnap, userSnap, existing] = await Promise.all([
          getDoc(doc(db, 'tours', id)),
          auth.currentUser
            ? getDoc(doc(db, 'users', auth.currentUser.uid))
            : Promise.resolve(null),
          getUserReview(id),
        ]);

        if (cancelled) return;

        if (tourSnap.exists()) setTour({ id: tourSnap.id, ...tourSnap.data() });

        if (userSnap?.exists()) {
          const data = userSnap.data();
          const p = data?.progress?.[id];
          if (typeof p === 'number') setProgress(Math.round(p));
        }

        if (existing) {
          setRatings({
            audioQuality: existing.audioQuality ?? 0,
            gpsAccuracy: existing.gpsAccuracy ?? 0,
            narrative: existing.narrative ?? 0,
          });
          setComment(existing.comment ?? '');
        }
      } catch (e) {
        console.warn('Error cargando rate screen:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const allRated = ratings.audioQuality > 0 && ratings.gpsAccuracy > 0 && ratings.narrative > 0;

  const handleSubmit = async () => {
    if (!id) return;
    if (!auth.currentUser) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para enviar una valoración.');
      return;
    }
    if (!allRated) {
      Alert.alert('Faltan valoraciones', 'Puntúa los tres apartados antes de enviar.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(id, {
        audioQuality: ratings.audioQuality,
        gpsAccuracy: ratings.gpsAccuracy,
        narrative: ratings.narrative,
        comment,
        progressPercentage: progress,
      });
      Alert.alert('¡Gracias!', 'Tu valoración se ha enviado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.error('submitReview error:', e);
      Alert.alert('Error', 'No se ha podido enviar la valoración. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color="#8874F7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Valora tu experiencia</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >

          {showCelebration && (
            <View style={styles.celebration}>
              <Image
                source={require('../../../assets/images/icons/Audioguia_Completada.png')}
                style={styles.celebrationIcon}
                resizeMode="contain"
              />
              <Text style={styles.celebrationText}>¡Enhorabuena! has completado</Text>
            </View>
          )}

          {tour && (
            <View style={styles.tourCard}>
              {/* Imagen full-height */}
              <View style={styles.tourImageWrapper}>
                {tourImage ? (
                  <Image source={{ uri: tourImage }} style={styles.tourImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.tourImage, { backgroundColor: COLORS.border }]} />
                )}
              </View>

              {/* Info + Badge dentro del mismo flex */}
              <View style={styles.tourInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tourTitle} numberOfLines={2}>{tour.title}</Text>
                    <View style={styles.locationRow}>
                      <Image
                        source={require('../../../assets/images/icons/Ubicacion_Ciudad.png')}
                        style={{ width: 13, height: 13 }}
                        resizeMode="contain"
                      />
                      <Text style={styles.tourLocation} numberOfLines={1}>
                        {[tour.city, tour.country].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBadge}>
                    <Text style={styles.progressNumber}>{progress}%</Text>
                    <Text style={styles.progressLabel}>completado</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>¿Qué te ha parecido?</Text>

          {RATING_LABELS.map(({ key, label }) => (
            <RatingRow
              key={key}
              label={label}
              value={ratings[key]}
              onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
            />
          ))}

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="¿En qué podemos mejorar? Tu opinión nos importa :)"
            placeholderTextColor={COLORS.placeholder}
            style={styles.textarea}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submit, (!allRated || submitting) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!allRated || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Enviar valoración</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <TouchableOpacity key={i} onPress={() => onChange(i === value ? i - 1 : i)} hitSlop={6}>
            <Ionicons
              name="star"
              size={26}
              color={i <= value ? COLORS.gold : '#D1D5DB'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#39398A' },
  scroll: { padding: 20 },
  celebration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 90,
  },
  celebrationIcon: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignSelf: 'center',
    top: 0,
  },
  celebrationEmoji: { fontSize: 40, marginBottom: 6 },
  celebrationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4E4FA5',
    textAlign: 'center',
    zIndex: 2,
    top: 12,
  },
  tourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
    minHeight: 90,
    paddingRight: 12,
  },
  tourImageWrapper: {
    width: 80,
    alignSelf: 'stretch',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    overflow: 'hidden',
  },
  tourImage: {
    width: 80,
    height: 90,
    borderRadius: 12,
  },
  tourInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    justifyContent: 'center',
    gap: 6,
  },
  tourTitle: { fontSize: 14, fontWeight: '700', color: '#4E4FA5', lineHeight: 18 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tourLocation: { fontSize: 12, color: '#4E4FA5', opacity: 0.75, flex: 1 },
  progressBadge: {
    width: 56,
    height: 56,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#4E4FA5',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#4E4FA5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  },
  progressNumber: { fontSize: 10, fontWeight: '800', color: '#4E4FA5' },
  progressLabel: { fontSize: 7, color: '#4E4FA5', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#4E4FA5', marginBottom: 16 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  ratingLabel: { fontSize: 14, color: '#39398A', flex: 1 },
  starsRow: { flexDirection: 'row' },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#8874F7',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 24,
  },
  submit: {
    backgroundColor: '#8874F7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
