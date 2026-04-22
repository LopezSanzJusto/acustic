// components/mapDisplay.tsx

import React, { useRef, useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import MapView, { Marker, Circle, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { PointOfInterest } from "../data/points";
import { COLORS } from "../utils/theme";
import { useSortedPoints } from "../hooks/useMapLogic";
import { getDistanceInMeters } from "../utils/geo";

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius?: number;
  showGeofence?: boolean;
  onRouteCalculated?: (distanceText: string) => void;
  markerType?: "image" | "number"; 
  dashedRoute?: boolean;
  onMarkerPress?: (id: string) => void;
}

export const MapDisplay = ({
  location,
  points,
  radius = 15,
  showGeofence = true,
  onRouteCalculated,
  markerType = "image", 
  dashedRoute = false,
  onMarkerPress,
}: MapDisplayProps) => {
  const mapRef = useRef<MapView>(null);
  const sortedPoints = useSortedPoints(points);

  const routeCoords = useMemo(
    () => sortedPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
    [sortedPoints]
  );

  useEffect(() => {
    if (!onRouteCalculated || sortedPoints.length < 2) return;
    let meters = 0;
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      meters += getDistanceInMeters(
        sortedPoints[i].latitude, sortedPoints[i].longitude,
        sortedPoints[i + 1].latitude, sortedPoints[i + 1].longitude
      );
    }
    onRouteCalculated(`${(meters / 1000).toFixed(2)} km`);
  }, [sortedPoints, onRouteCalculated]);

  const [loadedImages, setLoadedImages] = useState<{
    [key: string]: boolean;
  }>({});

  // ✨ MEJORA DE RENDIMIENTO: Pre-marcar los puntos que no necesitan cargar imagen externa
  useEffect(() => {
    if (markerType === 'image') {
      const loaded: { [key: string]: boolean } = {};
      points.forEach(p => {
        // Si el punto no tiene imagen, evitamos que tracksViewChanges se quede en true eternamente
        if (!p.image) {
          loaded[p.id] = true;
        }
      });
      if (Object.keys(loaded).length > 0) {
        setLoadedImages(prev => ({ ...prev, ...loaded }));
      }
    }
  }, [points, markerType]);

  useEffect(() => {
    // Evitamos resetear si estamos en markerType 'image' para no machacar el useEffect anterior
    if (markerType === 'number') {
      setLoadedImages({});
      const timer = setTimeout(() => {
        const loaded: { [key: string]: boolean } = {};
        points.forEach(p => { loaded[p.id] = true; });
        setLoadedImages(loaded);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [points, markerType]);

  const initialRegion = useMemo(() => {
    if (sortedPoints.length > 0) {
      return {
        latitude: sortedPoints[0].latitude,
        longitude: sortedPoints[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return {
      latitude: 40.416775,
      longitude: -3.703790,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [sortedPoints]);

  const handleMapLayout = () => {
    if (sortedPoints.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(sortedPoints, {
        edgePadding: { top: 120, right: 80, bottom: 120, left: 80 },
        animated: false,
      });
    }
  };

  return (
    <View style={[styles.mapContainer, { backgroundColor: 'red' }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onLayout={handleMapLayout}
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            lineDashPattern={dashedRoute ? [10, 10] : undefined}
          />
        )}

        {location && (
          <Marker
            coordinate={location}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={999}
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}

        {sortedPoints.map((p, index) => (
          <React.Fragment key={p.id}>
            {showGeofence && (
              <Circle
                center={{ latitude: p.latitude, longitude: p.longitude }}
                radius={radius}
                fillColor={COLORS.primaryLight}
                strokeColor={COLORS.primaryBorder}
                zIndex={1}
              />
            )}

            <Marker
              coordinate={{
                latitude: p.latitude,
                longitude: p.longitude,
              }}
              anchor={markerType === "number" && index === 0 ? { x: 0.5, y: 0.72 } : { x: 0.5, y: 0.5 }}
              zIndex={2}
              tracksViewChanges={!loadedImages[p.id]}
              onPress={() => onMarkerPress && onMarkerPress(p.id)}
            >
              <View collapsable={false} style={{ alignItems: 'center' }}>
                {markerType === "number" && index === 0 && (
                  <View style={styles.startBadge}>
                    <Text style={styles.startText}>START</Text>
                  </View>
                )}
                <View style={markerType === "number" ? [styles.numberMarkerOuter, { backgroundColor: index === 0 ? '#FF8533' : COLORS.primary }] : styles.markerBorder} collapsable={false}>
                  {markerType === "number" ? (
                    <Text style={styles.numberText}>{index + 1}</Text>
                  ) : p.image ? (
                    <Image
                      key={p.image}
                      source={{ uri: p.image }}
                      style={styles.markerImage}
                      resizeMode="cover"
                      fadeDuration={0}
                      onLoadEnd={() => {
                        setTimeout(() => {
                          setLoadedImages((prev) => ({
                            ...prev,
                            [p.id]: true,
                          }));
                        }, 1000);
                      }}
                    />
                  ) : (
                    <View style={[styles.markerImage, { backgroundColor: COLORS.primary }]} />
                  )}
                </View>
              </View>
            </Marker>
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { 
    // ✨ Reemplazo de absoluteFillObject
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E6E6E6',
    overflow: "hidden" 
  },
  map: { 
    // ✨ Reemplazo de absoluteFillObject
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // ... (El resto se mantiene igual)
  markerBorder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.white, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },
  markerImage: { width: 41, height: 41, borderRadius: 20.5 },
  numberMarkerOuter: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  numberText: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  startBadge: { backgroundColor: '#FF8533', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 3 },
  startText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  userMarkerContainer: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  userMarkerDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#3B82F6", borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
});