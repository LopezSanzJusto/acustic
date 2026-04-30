// components/activeTourCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, getDocs, orderBy, query } from '@react-native-firebase/firestore';
import { db, firestoreReady } from '../services/firebaseConfig';
import { useTourDownload } from '../hooks/useDownloads';
import { useTourUpdateAvailable } from '../hooks/useDownloadUpdates';
import {
  downloadTour,
  resumeDownload,
  deleteTour,
  isTourAvailableOffline,
  checkDiskSpaceForTour,
  formatBytes,
} from '../services/offlineTourService';
import { COLORS } from '../utils/theme';

const IMAGE_SIZE = 88;

interface ActiveTourCardProps {
  tour: any;
  onPress: () => void;
  onStartRoute?: () => void;
}

export const ActiveTourCard = ({ tour, onPress }: ActiveTourCardProps) => {
  const progress: number = tour.progressPercentage || 0;
  const [pointsCount, setPointsCount] = useState(0);

  const {
    isDownloaded,
    isDownloading,
    isPaused,
    isIdle,
    downloadState,
    update,
    remove,
  } = useTourDownload(tour.id);

  const isOutdated = useTourUpdateAvailable(tour.id);

  // Sincroniza con el disco: si el manifest existe pero el contexto no lo sabe
  useEffect(() => {
    if (!tour.id || !isIdle) return;
    isTourAvailableOffline(tour.id).then((available) => {
      if (available) update({ status: 'completed', progress: 1, bytesDownloaded: 0, totalBytes: 0 });
    });
  }, [tour.id]);

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

  // ─── Lógica de descarga ──────────────────────────────────────────────────

  const startFreshDownload = async () => {
    try {
      // 1. Obtener paradas de Firestore (necesarias para el chequeo de espacio)
      await firestoreReady;
      const snapshot = await getDocs(
        query(collection(db, 'tours', tour.id, 'points'), orderBy('order', 'asc')),
      );
      const pts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2. Comprobar espacio antes de empezar
      const { hasSpace, requiredBytes, freeBytes } = await checkDiskSpaceForTour(tour, pts as any);
      if (!hasSpace) {
        Alert.alert(
          'Espacio insuficiente',
          `Necesitas ${formatBytes(requiredBytes)} pero solo tienes ${formatBytes(freeBytes)} libres.\n\nLibera espacio en el dispositivo e inténtalo de nuevo.`,
          [{ text: 'Entendido' }],
        );
        return;
      }

      // 3. Arrancar la descarga
      update({ status: 'downloading', progress: 0, bytesDownloaded: 0, totalBytes: 0 });
      await downloadTour(tour, pts as any, (patch) => update(patch));
    } catch (e) {
      update({ status: 'error', error: String(e) });
    }
  };

  const handleDownloadPress = async () => {
    if (isDownloading) return;

    if (isDownloaded) {
      Alert.alert(
        'Eliminar descarga',
        '¿Quieres eliminar la descarga de esta audioguía?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTour(tour.id);
                remove();
              } catch (e) {
                console.warn('[offline] deleteTour failed:', e);
              }
            },
          },
        ],
      );
      return;
    }

    if (isPaused) {
      try {
        update({ status: 'downloading' });
        await resumeDownload(tour.id, (patch) => update(patch));
      } catch (e) {
        update({ status: 'error', error: String(e) });
      }
      return;
    }

    await startFreshDownload();
  };

  const handleUpdatePress = () => {
    Alert.alert(
      'Actualizar audioguía',
      'Hay una versión nueva disponible. Se eliminará la descarga actual y se volverá a descargar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            try {
              await deleteTour(tour.id);
              remove();
            } catch {}
            await startFreshDownload();
          },
        },
      ],
    );
  };

  // ─── Badge de descarga ───────────────────────────────────────────────────

  const downloadPct = Math.round((downloadState?.progress ?? 0) * 100);

  const DownloadBadge = () => {
    // Versión desactualizada (tiene prioridad sobre "Descargado")
    if (isDownloaded && isOutdated) {
      return (
        <TouchableOpacity
          style={[styles.badgeRow, styles.badgePillUpdate]}
          onPress={handleUpdatePress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh-outline" size={11} color="#D97706" />
          <Text style={[styles.badgeText, { color: '#D97706' }]}>Actualizar</Text>
        </TouchableOpacity>
      );
    }

    if (isDownloaded) {
      return (
        <TouchableOpacity
          style={styles.badgeRow}
          onPress={handleDownloadPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="checkmark" size={11} color="#22C55E" />
          <Text style={[styles.badgeText, { color: '#22C55E' }]}>Descargado</Text>
        </TouchableOpacity>
      );
    }

    if (isDownloading) {
      return (
        <View style={[styles.badgeRow, styles.badgePill]}>
          <ActivityIndicator size={10} color="#4E4FA5" />
          <Text style={[styles.badgeText, { color: '#4E4FA5' }]}>
            {downloadState?.phase === 'map' ? 'Mapa...' : `${downloadPct}%`}
          </Text>
        </View>
      );
    }

    if (downloadState?.status === 'error') {
      return (
        <TouchableOpacity
          style={[styles.badgeRow, styles.badgePillError]}
          onPress={handleDownloadPress}
          activeOpacity={0.7}
        >
          <Ionicons name="alert-circle-outline" size={11} color="#EF4444" />
          <Text style={[styles.badgeText, { color: '#EF4444' }]}>Reintentar</Text>
        </TouchableOpacity>
      );
    }

    // idle o paused
    return (
      <TouchableOpacity
        style={[styles.badgeRow, styles.badgePill]}
        onPress={handleDownloadPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-down-outline" size={11} color="#4E4FA5" />
        <Text style={[styles.badgeText, { color: '#4E4FA5' }]}>
          {isPaused ? `Reanudar ${downloadPct}%` : 'Descargar'}
        </Text>
      </TouchableOpacity>
    );
  };

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
            <DownloadBadge />
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgePill: {
    backgroundColor: '#EAE7FB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgePillError: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgePillUpdate: {
    backgroundColor: '#FEF3C7',
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
