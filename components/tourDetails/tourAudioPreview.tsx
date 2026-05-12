// components/tourDetails/tourAudioPreview.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';
import { useAudio } from '../../hooks/useAudio';
import { useLocalSearchParams } from 'expo-router';

const formatDuration = (ms: number) => {
  const totalSecs = Math.round(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TourAudioPreviewProps {
  points: PointOfInterest[];
  price: number;
}

export const TourAudioPreview = ({ points, price }: TourAudioPreviewProps) => {
  // ✨ CAPTURAMOS EL PARÁMETRO 'fromTrips'
  const { fromTrips } = useLocalSearchParams();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [cachedDurations, setCachedDurations] = useState<Record<string, string>>({});
  const { activePoint, isPlaying, durationMillis, setActivePointIndex, togglePlayPause } = useAudio(points);

  useEffect(() => {
    if (activePoint && durationMillis > 0) {
      setCachedDurations(prev => {
        if (prev[activePoint.id]) return prev;
        return { ...prev, [activePoint.id]: formatDuration(durationMillis) };
      });
    }
  }, [activePoint?.id, durationMillis]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // 1. Si no hay puntos, no mostramos nada
  if (!points || points.length === 0) return null;

  // ✨ 2. LÓGICA DE OCULTACIÓN INTELIGENTE
  // Comprobamos si venimos de la pestaña de Mis Viajes
  const isFromTrips = fromTrips === 'true';
  // Comprobamos si la ruta es gratuita
  const isFree = price === 0 || String(price).toLowerCase() === 'gratis';
  
  // Solo se muestra en audioguías de pago
  if (isFree) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.previewButton} onPress={toggleExpand} activeOpacity={0.8}>
         <Image source={require('../../assets/images/icons/auriculares.png')} style={{ width: 30, height: 30, marginRight: 10 }} resizeMode="contain" />
         <Text style={styles.previewText}>Escucha <Text style={styles.previewTextBold}>gratis</Text>{'\n'}los primeros audios</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.dropdownContainer}>
          {points.map((point, index) => {
            const isLocked = index >= 2;
            const isCurrentPoint = activePoint?.id === point.id;
            const playIconName: any = isCurrentPoint && isPlaying ? "pause-circle" : "play-circle";

            return (
              <View key={point.id || index} style={styles.audioRow}>
                {point.image ? (
                  <Image source={{ uri: point.image }} style={[styles.pointImage, isLocked && { opacity: 0.5 }]} resizeMode="cover" />
                ) : (
                  <View style={[styles.pointImage, styles.pointImagePlaceholder, isLocked && { opacity: 0.5 }]} />
                )}

                <View style={styles.audioInfo}>
                  <Text style={[styles.audioTitle, isLocked && styles.textLocked]} numberOfLines={1}>
                    {point.name || `Punto ${index + 1}`}
                  </Text>
                  {!isLocked && (
                    <Text style={[styles.audioStatus, styles.textFree]}>
                      {cachedDurations[point.id] ?? point.audioDuration ?? "—"}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  disabled={isLocked}
                  onPress={() => isCurrentPoint ? togglePlayPause() : setActivePointIndex(index)}
                >
                  {isLocked
                    ? <Image source={require('../../assets/images/icons/Candado_Adio_Bloqueado.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    : <Ionicons name={playIconName} size={32} color={COLORS.primary} />
                  }
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24, paddingTop: 30 },
  previewButton: {
    backgroundColor: '#8874F71A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 15, borderRadius: 14, zIndex: 2, alignSelf: 'center',
  },
  previewText: { color: '#8874F7', fontWeight: '400', fontSize: 16, textAlign: 'center' },
  previewTextBold: { color: '#8874F7', fontWeight: '700' },
  dropdownContainer: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingTop: 10, paddingBottom: 10, paddingHorizontal: 15, marginTop: 12, borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 10 },
  pointImage: { width: 44, height: 44, borderRadius: 8 },
  pointImagePlaceholder: { backgroundColor: COLORS.border },
  audioInfo: { flex: 1 },
  audioTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  textLocked: { color: COLORS.muted },
  audioStatus: { fontSize: 12, color: COLORS.muted },
  textFree: { color: COLORS.primary, fontWeight: '500' },
  actionButton: { padding: 4 }
});