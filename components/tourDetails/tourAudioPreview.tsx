// components/tourDetails/tourAudioPreview.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';
import { useAudio } from '../../hooks/useAudio';
// ✨ IMPORTAMOS useLocalSearchParams para leer los parámetros de la ruta
import { useLocalSearchParams } from 'expo-router';

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
  const { activePoint, isPlaying, setActivePointIndex, togglePlayPause } = useAudio(points);

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
         <Ionicons name="headset" size={22} color="#6B6B6B" style={{ marginRight: 10 }} />
         <Text style={styles.previewText}>Pre-view de la ruta</Text>
      </TouchableOpacity>
      <Text style={styles.subtitleText}>
        Escucha <Text style={styles.subtitleItalic}>gratis</Text> los primeros audios
      </Text>

      {isExpanded && (
        <View style={styles.dropdownContainer}>
          {points.map((point, index) => {
            const isLocked = index >= 2; 
            const isCurrentPoint = activePoint?.id === point.id;
            let iconName: any = isLocked ? "lock-closed" : (isCurrentPoint && isPlaying ? "pause-circle" : "play-circle");

            return (
              <View key={point.id || index} style={styles.audioRow}>
                <View style={styles.audioInfo}>
                  <Text style={[styles.audioTitle, isLocked && styles.textLocked]} numberOfLines={1}>
                    {index + 1}. {point.name || `Punto ${index + 1}`}
                  </Text>
                  <Text style={[styles.audioStatus, !isLocked && styles.textFree]}>
                    {isLocked ? "Disponible al iniciar la ruta" : "Muestra de audio"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  disabled={isLocked}
                  onPress={() => isCurrentPoint ? togglePlayPause() : setActivePointIndex(index)}
                >
                  <Ionicons
                    name={iconName}
                    size={32}
                    color={isLocked ? COLORS.muted : COLORS.primary}
                  />
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
  container: { marginBottom: 30 },
  previewButton: {
    backgroundColor: '#EDE9FE', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14, zIndex: 2, alignSelf: 'center',
  },
  previewText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 16 },
  subtitleText: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  subtitleItalic: { fontStyle: 'italic', fontWeight: '400' },
  dropdownContainer: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingTop: 10, paddingBottom: 10, paddingHorizontal: 15, marginTop: 12, borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  audioInfo: { flex: 1, paddingRight: 10 },
  audioTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  textLocked: { color: COLORS.muted },
  audioStatus: { fontSize: 12, color: COLORS.muted },
  textFree: { color: COLORS.primary, fontWeight: '500' },
  actionButton: { padding: 4 }
});