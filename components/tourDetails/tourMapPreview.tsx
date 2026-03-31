// components/tourDetails/tourMapPreview.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PointOfInterest } from '../../data/points';
import { MapDisplay } from '../mapDisplay';

// ✨ NUEVO: Importamos nuestro hook global
import { useCustomRoute } from '../../hooks/useCustomRoute';

interface TourMapPreviewProps {
  points: PointOfInterest[];
  onPress: () => void;
  onRouteCalculated?: (distanceText: string) => void; 
}

export const TourMapPreview = ({ points, onPress, onRouteCalculated }: TourMapPreviewProps) => {
  // ✨ Extraemos la ruta activa desde el contexto
  const { activeRoutePoints } = useCustomRoute();

  // Si hay puntos en el estado global, los usamos. Si es la primera carga, usamos los props.
  const displayPoints = activeRoutePoints.length > 0 ? activeRoutePoints : points;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchable}>
        <View style={styles.mapWrapper} pointerEvents="none">
          <MapDisplay 
            location={null} 
            // ✨ PASAMOS LOS PUNTOS FILTRADOS AL MINI MAPA
            points={displayPoints} 
            showGeofence={false} 
            onRouteCalculated={onRouteCalculated} 
            markerType="number"
            dashedRoute={true}
          />
        </View>
        <View style={styles.overlay} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 20, backgroundColor: '#f0f0f0' },
  touchable: { flex: 1 },
  mapWrapper: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' } 
});