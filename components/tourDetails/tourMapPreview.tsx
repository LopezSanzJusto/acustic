// components/tourDetails/tourMapPreview.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PointOfInterest } from '../../data/points';
import { MapDisplay } from '../mapDisplay';

interface TourMapPreviewProps {
  points: PointOfInterest[];
  onPress: () => void;
  onRouteCalculated?: (distanceText: string) => void; // ✅ Prop añadida
}

export const TourMapPreview = ({ points, onPress, onRouteCalculated }: TourMapPreviewProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchable}>
        {/* Usamos MapDisplay pero deshabilitamos la interacción directa */}
        <View style={styles.mapWrapper} pointerEvents="none">
          <MapDisplay 
            location={null} 
            points={points} 
            showGeofence={false} // Ocultamos círculos
            onRouteCalculated={onRouteCalculated} // ✅ Pasamos la prop al mapa
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