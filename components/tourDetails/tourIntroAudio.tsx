// components/tourDetails/tourIntroAudio.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlowSlider } from '../GlowSlider';
import { COLORS } from '../../utils/theme';
import { useSingleAudio } from '../../hooks/useSingleAudio';

const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const TourIntroAudio = ({ title, image, audioUrl }: { title: string, image: string, audioUrl?: string }) => {
  // ✨ Toda la lógica en 1 sola línea
  const { isPlaying, positionMillis, durationMillis, togglePlayPause, seekTo } = useSingleAudio(audioUrl);

  if (!audioUrl) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Introducción a {title}</Text>
      
      <View style={styles.playerCard}>
        <Image source={{ uri: image }} style={styles.thumbnail} />
        
        <View style={styles.trackInfo}>
          <View style={styles.progress}>
            <Text style={styles.time}>{formatTime(positionMillis)}</Text>
            
            <GlowSlider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={durationMillis || 1}
              value={positionMillis}
              onSlidingComplete={seekTo}
            />

            <Text style={styles.time}>{formatTime(durationMillis)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={COLORS.white} style={{ marginLeft: isPlaying ? 0 : 2 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 0, marginBottom: 24 },
  header: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#8874F780',
    gap: 10,
  },
  thumbnail: { width: 56, height: 56, borderRadius: 10 },
  trackInfo: { flex: 1, justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 12, color: COLORS.muted, minWidth: 35, textAlign: 'center' },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});