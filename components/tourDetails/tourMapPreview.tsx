// components/tourDetails/tourMapPreview.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PointOfInterest } from '../../data/points';
import { MapDisplay } from '../mapDisplay';
import { COLORS } from '../../utils/theme';

interface TourMapPreviewProps {
  points: PointOfInterest[];
  onPress: () => void;
}

export const TourMapPreview = ({ points, onPress }: TourMapPreviewProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchable}>
        {/* Usamos MapDisplay pero deshabilitamos la interacción directa */}
        <View style={styles.mapWrapper} pointerEvents="none">
          <MapDisplay 
            location={null} 
            points={points} 
            showGeofence={false} // Ocultamos círculos
          />
        </View>
        
        {/* Overlay opcional para indicar que es clicable */}
        <View style={styles.overlay} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 20, backgroundColor: '#f0f0f0' },
  touchable: { flex: 1 },
  mapWrapper: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' } // Truco para asegurar captura de toques
});