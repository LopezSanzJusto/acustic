import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { PointOfInterest } from '../data/points';

interface PointReachedModalProps {
  visible: boolean;
  point: PointOfInterest | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const PointReachedModal = ({ visible, point, onConfirm, onDismiss }: PointReachedModalProps) => {
  if (!point) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={28} color={COLORS.white} />
          </View>

          <Text style={styles.title}>¡Has llegado!</Text>
          <Text style={styles.subtitle}>Estás cerca de</Text>
          <Text style={styles.pointName} numberOfLines={2}>{point.name}</Text>

          {point.image ? (
            <Image source={{ uri: point.image }} style={styles.image} />
          ) : null}

          <Text style={styles.question}>¿Quieres escuchar el audio?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onDismiss}>
              <Text style={styles.secondaryText}>Ahora no</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primary]} onPress={onConfirm}>
              <Ionicons name="play" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.primaryText}>Escuchar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  card: { width: '100%', backgroundColor: COLORS.white, borderRadius: 20, padding: 22, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
  pointName: { fontSize: 17, fontWeight: '600', color: COLORS.primary, textAlign: 'center', marginBottom: 14 },
  image: { width: '100%', height: 130, borderRadius: 12, marginBottom: 14 },
  question: { fontSize: 14, color: COLORS.text, marginBottom: 18, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border },
  primaryText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  secondaryText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' }
});
