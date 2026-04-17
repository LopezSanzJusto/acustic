import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Image, Dimensions,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { PointOfInterest } from '../data/points';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;
const IMAGE_H = 200;
const FADE_H = 70; // altura de la zona difuminada en la parte inferior de la imagen

const PURPLE = '#4A4BA6';
const PURPLE_BTN = '#7B72E8';

// Capas de opacidad para simular el degradado imagen→morado (de arriba a abajo)
const FADE_STEPS = [0, 0.1, 0.22, 0.38, 0.55, 0.72, 0.88, 1.0];

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

// Componente interno que carga el audio sólo para leer la duración, sin reproducir.
function DurationLabel({ audioUri }: { audioUri: string }) {
  const player = useAudioPlayer(audioUri);
  const status = useAudioPlayerStatus(player);
  const dur = status.duration ?? 0;
  if (dur <= 0) return null;
  return (
    <Text style={styles.duration}>
      {'  \uD83C\uDF99 '}{formatDuration(dur)}
    </Text>
  );
}

export const PointReachedModal = ({
  visible, point, pointIndex, totalPoints, onConfirm, onDismiss,
}: Props) => {
  if (!point) return null;

  const counter =
    pointIndex != null && totalPoints != null
      ? `punto ${pointIndex}/${totalPoints}`
      : null;

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

            {/* Nombre + duración en la misma línea */}
            <View style={styles.nameRow}>
              <Text style={styles.pointName} numberOfLines={2}>{point.name}</Text>
              {point.audio ? <DurationLabel audioUri={point.audio} /> : null}
            </View>

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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pointName: {
    fontSize: 19,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginLeft: 4,
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
