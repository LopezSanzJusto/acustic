// components/tourDetails/tourIntroAudio.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

export const TourIntroAudio = ({ title, image }: { title: string, image: string }) => (
  <View style={styles.container}>
    <Text style={styles.header}>Introducción a {title}</Text>
    <View style={styles.playerCard}>
      <Image source={{ uri: image }} style={styles.thumbnail} />
      <View style={styles.trackInfo}>
        <View style={styles.progressBar}>
           <View style={styles.progressFill} />
           <View style={styles.knob} />
        </View>
        <Text style={styles.time}>1:45</Text>
      </View>
      <TouchableOpacity style={styles.playBtn}>
        <Ionicons name="play" size={24} color={COLORS.white} style={{ marginLeft: 2 }}/>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginTop: 25, marginBottom: 10 },
  header: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },
  playerCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 10, 
    borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border 
  },
  thumbnail: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
  trackInfo: { flex: 1, justifyContent: 'center', marginRight: 10 },
  progressBar: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 8, justifyContent: 'center' },
  progressFill: { width: '30%', height: '100%', backgroundColor: '#A78BFA', borderRadius: 2 },
  knob: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, position: 'absolute', left: '28%' },
  time: { fontSize: 12, color: COLORS.muted },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' }
});