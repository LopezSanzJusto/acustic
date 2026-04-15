// components/activeTourCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';
import { CircularProgress } from './circularProgress';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 15;
const IMAGE_SIZE = 80;

type CardState = 'not_started' | 'in_progress' | 'completed';

interface ActiveTourCardProps {
  tour: any;
  onPress: () => void;
}

export const ActiveTourCard = ({ tour, onPress }: ActiveTourCardProps) => {
  const progress: number = tour.progressPercentage || 0;
  const [pointsCount, setPointsCount] = useState(0);

  useEffect(() => {
    async function getPointsCount() {
      if (!tour.id) return;
      try {
        const snapshot = await getDocs(collection(db, 'tours', tour.id, 'points'));
        setPointsCount(snapshot.size);
      } catch (e) {
        console.log(e);
      }
    }
    getPointsCount();
  }, [tour.id]);

  // Determinamos el estado de la tarjeta
  const cardState: CardState =
    progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

  // "Parada Y/Z": estimamos la parada actual a partir del porcentaje
  const currentStop = pointsCount > 0 ? Math.round((progress / 100) * pointsCount) : 0;

  // Imagen: usamos la primera de imageUrls o el campo image como fallback
  const imageSource =
    tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0
      ? { uri: tour.imageUrls[0] }
      : tour.image
      ? { uri: tour.image }
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {/* ── Imagen pequeña izquierda ── */}
        <View style={styles.imageWrapper}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color={COLORS.muted} />
            </View>
          )}
        </View>

        {/* ── Contenido central ── */}
        <View style={styles.content}>
          {/* Fila: Título + Badge de estado */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {tour.title}
            </Text>
            <StateBadge state={cardState} price={tour.price} />
          </View>

          {/* Localización */}
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={12} color={COLORS.error} />
            <Text style={styles.metaText}>{tour.city}</Text>
          </View>

          {/* Progreso (solo si está en curso) */}
          {cardState === 'in_progress' && pointsCount > 0 && (
            <Text style={styles.progressText}>
              {Math.round(progress)}% completado · Parada {currentStop}/{pointsCount}
            </Text>
          )}

          {/* Botón de acción */}
          {cardState !== 'completed' && (
            <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
              <Text style={styles.actionText}>
                {cardState === 'in_progress' ? 'Continuar la ruta' : 'Empezar la ruta'}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.white} />
            </TouchableOpacity>
          )}

          {/* Completado: texto con check */}
          {cardState === 'completed' && (
            <View style={styles.completedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={styles.completedText}>Ruta completada</Text>
            </View>
          )}
        </View>

        {/* ── Anillo de progreso (solo si está en curso) ── */}
        {cardState === 'in_progress' && (
          <View style={styles.progressRing}>
            <CircularProgress percentage={progress} size={54} strokeWidth={5} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Sub-componente: Badge de estado ──────────────────────────────────────────
const StateBadge = ({ state, price }: { state: CardState; price?: number }) => {
  if (state === 'not_started') {
    return (
      <View style={[styles.badge, styles.badgeNotStarted]}>
        <Text style={[styles.badgeText, styles.badgeTextDark]}>Sin empezar</Text>
      </View>
    );
  }
  if (state === 'completed') {
    return (
      <View style={[styles.badge, styles.badgeCompleted]}>
        <Ionicons name="checkmark" size={10} color="#fff" />
        <Text style={styles.badgeText}>Completado</Text>
      </View>
    );
  }
  // En progreso: mostramos precio o "Gratis"
  const label = price === 0 || price == null ? 'Gratis' : `${price}€`;
  return (
    <View style={[styles.badge, styles.badgeFree]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
};

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: CARD_MARGIN,
    paddingVertical: 12,
    paddingHorizontal: 12,
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Sombra Android
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Imagen
  imageWrapper: {
    marginRight: 12,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Contenido
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Botón de acción
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
    gap: 2,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Completado
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },

  // Anillo de progreso
  progressRing: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgeTextDark: {
    color: '#92400E',
  },
  badgeNotStarted: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeCompleted: {
    backgroundColor: '#22C55E',
  },
  badgeFree: {
    backgroundColor: '#22C55E',
  },
});
