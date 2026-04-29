// components/activeTourCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { collection, getDocs } from '@react-native-firebase/firestore';
import { db, firestoreReady } from '../services/firebaseConfig';
import { COLORS } from '../utils/theme';

const IMAGE_SIZE = 88;

interface ActiveTourCardProps {
  tour: any;
  onPress: () => void;
  onStartRoute: () => void;
}

export const ActiveTourCard = ({ tour, onPress }: ActiveTourCardProps) => {
  const progress: number = tour.progressPercentage || 0;
  const [pointsCount, setPointsCount] = useState(0);
  const isDownloaded: boolean = tour.isDownloaded || false;

  useEffect(() => {
    async function getPointsCount() {
      if (!tour.id) return;
      await firestoreReady;
      try {
        const snapshot = await getDocs(collection(db, 'tours', tour.id, 'points'));
        setPointsCount(snapshot.size);
      } catch (e) {
        console.log(e);
      }
    }
    getPointsCount();
  }, [tour.id]);

  const hasProgress = progress > 0 && pointsCount > 0;
  const currentStop = pointsCount > 0 ? Math.round((progress / 100) * pointsCount) : 0;
  const progressPct = `${Math.min(Math.max(Math.round(progress), 0), 100)}%`;

  const location = [tour.city, tour.country].filter(Boolean).join(', ');

  const imageSource =
    tour.imageUrls && Array.isArray(tour.imageUrls) && tour.imageUrls.length > 0
      ? { uri: tour.imageUrls[0] }
      : tour.image
      ? { uri: tour.image }
      : null;

  const formatDuration = (d: any): string => {
    if (!d && d !== 0) return '—';
    if (typeof d === 'number') return `${d} min`;
    const n = Number(d);
    if (!isNaN(n)) return `${n} min`;
    return String(d);
  };

  const bottomText = hasProgress
    ? `${Math.round(progress)}% completado · Parada ${currentStop}/${pointsCount}`
    : pointsCount > 0
    ? `${formatDuration(tour.duration)} · ${pointsCount} paradas`
    : formatDuration(tour.duration);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {/* Imagen */}
        <View style={styles.imageWrapper}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color={COLORS.muted} />
            </View>
          )}
        </View>

        {/* Contenido central */}
        <View style={styles.content}>
          {/* Título + badge de descarga */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
            {isDownloaded ? (
              <View style={styles.badge}>
                <Ionicons name="checkmark" size={11} color="#22C55E" />
                <Text style={[styles.badgeText, { color: '#22C55E' }]}>Descargado</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeDownload]}>
                <Ionicons name="arrow-down" size={11} color="#4E4FA5" />
                <Text style={[styles.badgeText, { color: '#4E4FA5' }]}>Descargar</Text>
              </View>
            )}
          </View>

          {/* Localización */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={COLORS.error} />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: progressPct }]} />
          </View>

          {/* Texto inferior */}
          <Text style={styles.bottomText}>{bottomText}</Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color="#C8C8D0" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 10,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageWrapper: {},
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
  content: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeDownload: {
    backgroundColor: '#EAE7FB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8E4F5',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4E4FA5',
    borderRadius: 3,
  },
  bottomText: {
    fontSize: 12,
    color: '#4E4FA5',
    fontWeight: '700',
  },
});
