// components/mapDisplay.tsx

import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import {
  Map as MapLibreMap,
  Camera,
  GeoJSONSource,
  Layer,
  ViewAnnotation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { PointOfInterest } from '../data/points';
import { COLORS } from '../utils/theme';
import { useSortedPoints } from '../hooks/useMapLogic';
import { useOsrmRoute } from '../hooks/useOsrmRoute';
import { MAP_STYLE_URL } from '../services/offlineMapService';

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── GeoJSON helpers ──────────────────────────────────────────────────────────

function circlePolygon(lon: number, lat: number, radiusM: number, steps = 32): number[][] {
  const coords: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusM / 111320) * Math.cos(angle);
    const dLon =
      (radiusM / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lon + dLon, lat + dLat]);
  }
  return coords;
}

// ─── Componente ───────────────────────────────────────────────────────────────

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
  const cameraRef = useRef<CameraRef>(null);
  const sortedPoints = useSortedPoints(points);
  const { routeCoords, routeDistance } = useOsrmRoute(sortedPoints);

  useEffect(() => {
    if (routeDistance && onRouteCalculated) {
      onRouteCalculated(routeDistance);
    }
  }, [routeDistance, onRouteCalculated]);

  const hasFittedRef = useRef(false);
  useEffect(() => {
    hasFittedRef.current = false;
  }, [points]);

  useEffect(() => {
    if (sortedPoints.length < 1 || hasFittedRef.current) return;
    hasFittedRef.current = true;

    const timer = setTimeout(() => {
      if (sortedPoints.length === 1) {
        cameraRef.current?.flyTo({
          center: [sortedPoints[0].longitude, sortedPoints[0].latitude],
          duration: 400,
        });
      } else {
        const lons = sortedPoints.map((p) => p.longitude);
        const lats = sortedPoints.map((p) => p.latitude);
        // LngLatBounds = [west, south, east, north]
        cameraRef.current?.fitBounds(
          [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
          { padding: fitPadding, duration: 400 },
        );
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sortedPoints]);

  const routeGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features:
        routeCoords.length > 1
          ? [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'LineString' as const,
                  coordinates: routeCoords.map((c) => [c.longitude, c.latitude]),
                },
                properties: {},
              },
            ]
          : [],
    }),
    [routeCoords],
  );

  const geofenceGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: showGeofence
        ? sortedPoints.map((p) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: [circlePolygon(p.longitude, p.latitude, radius)],
            },
            properties: {},
          }))
        : [],
    }),
    [sortedPoints, showGeofence, radius],
  );

  const initialCenter: [number, number] =
    sortedPoints.length > 0
      ? [sortedPoints[0].longitude, sortedPoints[0].latitude]
      : [-3.70379, 40.41677];

  return (
    <View style={styles.mapContainer}>
      <MapLibreMap
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        touchPitch={false}
        touchRotate={false}
        attribution={false}
        logo={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: initialCenter, zoom: 14 }}
        />

        {/* Círculos de geovalla */}
        {showGeofence && geofenceGeoJSON.features.length > 0 && (
          <GeoJSONSource id="geofences" data={geofenceGeoJSON as any}>
            <Layer
              id="geofence-fill"
              type="fill"
              paint={{ 'fill-color': COLORS.primaryLight, 'fill-opacity': 0.35 } as any}
            />
            <Layer
              id="geofence-border"
              type="line"
              paint={{ 'line-color': COLORS.primaryBorder, 'line-width': 1 } as any}
            />
          </GeoJSONSource>
        )}

        {/* Ruta: calzada morada + marcas viales blancas */}
        {routeGeoJSON.features.length > 0 && (
          <GeoJSONSource id="route" data={routeGeoJSON as any}>
            <Layer
              id="route-road"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' } as any}
              paint={{ 'line-color': '#4E4FA5', 'line-width': 10 } as any}
            />
            <Layer
              id="route-dashes"
              type="line"
              paint={{ 'line-color': '#FFFFFF', 'line-width': 2, 'line-dasharray': [2, 2] } as any}
            />
          </GeoJSONSource>
        )}

        {/* Marcadores de paradas */}
        {sortedPoints.map((p, index) => (
          <ViewAnnotation
            key={p.id}
            id={`poi-${p.id}`}
            lngLat={[p.longitude, p.latitude]}
            anchor="center"
            onPress={() => onMarkerPress?.(p.id)}
          >
            <View collapsable={false} style={{ alignItems: 'center' }}>
              {markerType === 'number' && index === 0 && (
                <View style={styles.startBadge}>
                  <Text style={styles.startText}>START</Text>
                </View>
              )}
              <View
                style={
                  markerType === 'number'
                    ? [
                        styles.numberMarkerOuter,
                        { backgroundColor: index === 0 ? '#FF8533' : COLORS.primary },
                      ]
                    : styles.markerBorder
                }
                collapsable={false}
              >
                {markerType === 'number' ? (
                  <Text style={styles.numberText}>{index + 1}</Text>
                ) : p.image ? (
                  <Image
                    source={{ uri: p.image }}
                    style={styles.markerImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.markerImage, { backgroundColor: COLORS.primary }]} />
                )}
              </View>
            </View>
          </ViewAnnotation>
        ))}

        {/* Punto azul del usuario */}
        {location && (
          <ViewAnnotation
            id="user-location"
            lngLat={[location.longitude, location.latitude]}
            anchor="center"
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot} />
            </View>
          </ViewAnnotation>
        )}
      </MapLibreMap>
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
