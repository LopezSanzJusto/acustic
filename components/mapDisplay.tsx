// components/mapDisplay.tsx

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { PointOfInterest } from '../data/points';
import { COLORS } from '../utils/theme';
import { useSortedPoints } from '../hooks/useMapLogic';
import { useOsrmRoute } from '../hooks/useOsrmRoute';

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius?: number;
  showGeofence?: boolean;
  onRouteCalculated?: (distanceText: string) => void;
  markerType?: 'image' | 'number';
  dashedRoute?: boolean;
  onMarkerPress?: (id: string) => void;
  fitPadding?: { top: number; right: number; bottom: number; left: number };
}

export const MapDisplay = ({
  location,
  points,
  radius = 15,
  showGeofence = true,
  onRouteCalculated,
  markerType = 'image',
  onMarkerPress,
  fitPadding = { top: 140, right: 80, bottom: 180, left: 80 },
}: MapDisplayProps) => {
  const mapRef = useRef<MapView>(null);
  const sortedPoints = useSortedPoints(points);
  const { routeCoords, routeDistance } = useOsrmRoute(sortedPoints);

  useEffect(() => {
    if (routeDistance && onRouteCalculated) onRouteCalculated(routeDistance);
  }, [routeDistance]);

  const hasFittedRef = useRef(false);
  useEffect(() => {
    hasFittedRef.current = false;
  }, [points]);

  useEffect(() => {
    if (sortedPoints.length < 1 || hasFittedRef.current) return;
    hasFittedRef.current = true;
    const coordsToFit = routeCoords.length > 1
      ? routeCoords
      : sortedPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordsToFit, { edgePadding: fitPadding, animated: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [sortedPoints, routeCoords]);

  const initialRegion = {
    latitude: sortedPoints[0]?.latitude ?? 40.41677,
    longitude: sortedPoints[0]?.longitude ?? -3.70379,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* Ruta OSRM: calzada morada + guiones blancos */}
        {routeCoords.length > 1 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor="#4E4FA5"
              strokeWidth={10}
              zIndex={1}
            />
            <Polyline
              coordinates={routeCoords}
              strokeColor="#FFFFFF"
              strokeWidth={2}
              lineDashPattern={[8, 8]}
              zIndex={2}
            />
          </>
        )}

        {/* Geovallas */}
        {showGeofence && sortedPoints.map(p => (
          <Circle
            key={`geo-${p.id}`}
            center={{ latitude: p.latitude, longitude: p.longitude }}
            radius={radius}
            fillColor="rgba(139,92,246,0.18)"
            strokeColor="rgba(139,92,246,0.45)"
            strokeWidth={1}
          />
        ))}

        {/* Marcadores de paradas */}
        {sortedPoints.map((p, index) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            onPress={() => onMarkerPress?.(p.id)}
            anchor={{ x: 0.5, y: markerType === 'number' && index === 0 ? 0.9 : 0.5 }}
            tracksViewChanges={false}
          >
            <View style={{ alignItems: 'center' }} collapsable={false}>
              {markerType === 'number' && index === 0 && (
                <View style={styles.startBadge}>
                  <Text style={styles.startText}>START</Text>
                </View>
              )}
              <View
                style={
                  markerType === 'number'
                    ? [styles.numberMarkerOuter, { backgroundColor: index === 0 ? '#FF8533' : COLORS.primary }]
                    : styles.markerBorder
                }
                collapsable={false}
              >
                {markerType === 'number' ? (
                  <Text style={styles.numberText}>{index + 1}</Text>
                ) : p.image ? (
                  <Image source={{ uri: p.image }} style={styles.markerImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.markerImage, { backgroundColor: COLORS.primary }]} />
                )}
              </View>
            </View>
          </Marker>
        ))}

        {/* Punto de ubicación del usuario */}
        {location && (
          <Marker
            coordinate={location}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userMarkerContainer} collapsable={false}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#E6E6E6',
    overflow: 'hidden',
  },
  map: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  markerBorder: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },
  markerImage: { width: 41, height: 41, borderRadius: 20.5 },
  numberMarkerOuter: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
  numberText: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  startBadge: {
    backgroundColor: '#FF8533', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, marginBottom: 3,
  },
  startText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  userMarkerContainer: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  userMarkerDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3, borderColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
});
