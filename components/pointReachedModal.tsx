import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Image, Dimensions,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { PointOfInterest } from '../data/points';

// Hook que carga el audio silenciosamente sólo para obtener la duración
function useAudioDuration(uri: string | null): number {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return status.duration ?? 0;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;
const IMAGE_H = 200;
const FADE_H = 80;

const PURPLE = '#4A4BA6';
const PURPLE_BTN = '#7B72E8';

// 30 pasos con curva cuadrática para un degradado visualmente lineal y suave
const STEPS = 30;
const FADE_STEPS = Array.from({ length: STEPS }, (_, i) => {
  const t = i / (STEPS - 1);
  return parseFloat((t * t).toFixed(4)); // ease-in cuadrático
});

interface Props {
  visible: boolean;
  point: PointOfInterest | null;
  pointIndex?: number;   // 1-based
  totalPoints?: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PointReachedModal = ({
  visible, point, pointIndex, totalPoints, onConfirm, onDismiss,
}: Props) => {
  // Cargamos la duración siempre (el hook requiere llamarse siempre, no condicionalmente)
  const durSeconds = useAudioDuration(point?.audio ?? null);

  if (!point) return null;

  const counter =
    pointIndex != null && totalPoints != null
      ? `punto ${pointIndex}/${totalPoints}`
      : null;

  const durLabel = durSeconds > 0 ? `  🎙 ${formatDuration(durSeconds)}` : '';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>

          {/* ── Imagen ── */}
          <View style={styles.imageWrapper}>
            {point.image ? (
              <Image source={{ uri: point.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imageFallback]} />
            )}

            {/* Botón X */}
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Degradado imagen→morado en la parte inferior */}
            <View style={styles.fadeOverlay} pointerEvents="none">
              {FADE_STEPS.map((opacity, i) => (
                <View
                  key={i}
                  style={{ flex: 1, backgroundColor: `rgba(74,75,166,${opacity})` }}
                />
              ))}
            </View>
          </View>

          {/* ── Cuerpo ── */}
          <View style={styles.body}>

            {/* Indicador de proximidad — queda justo en el corte imagen/morado */}
            {counter && (
              <View style={styles.alertRow}>
                <View style={styles.dot} />
                <Text style={styles.alertText}>Alerta de proximidad: {counter}</Text>
              </View>
            )}

            {/* "Has llegado a" */}
            <Text style={styles.arrived}>Has llegado a</Text>

            {/* Nombre con duración como sufijo inline — siempre en el mismo flujo de texto */}
            <Text style={styles.pointName}>
              {point.name}
              {durLabel ? <Text style={styles.duration}>{durLabel}</Text> : null}
            </Text>

            {/* Botón principal */}
            <TouchableOpacity style={styles.listenButton} onPress={onConfirm} activeOpacity={0.85}>
              <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.listenText}>Escucha ahora</Text>
            </TouchableOpacity>

            {/* Más tarde */}
            <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} style={styles.laterWrapper}>
              <Text style={styles.laterText}>Más tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_W,
    backgroundColor: PURPLE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
  },

  // Imagen
  imageWrapper: { width: '100%', height: IMAGE_H },
  image: { width: '100%', height: IMAGE_H, position: 'absolute' },
  imageFallback: { backgroundColor: 'rgba(255,255,255,0.1)' },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_H,
    flexDirection: 'column',
  },

  // Cuerpo
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },

  // Indicador
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A39BF8', marginRight: 6 },
  alertText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Título + duración
  arrived: { fontSize: 17, color: '#FFFFFF', fontWeight: '500', textAlign: 'center', marginBottom: 2 },
  pointName: {
    fontSize: 19,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    fontStyle: 'normal',
  },

  // Botón escucha
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE_BTN,
    borderRadius: 30,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 14,
  },
  listenText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Más tarde
  laterWrapper: { paddingVertical: 4 },
  laterText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },
});
