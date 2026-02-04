// components/mapDisplay.tsx

import React, { useEffect, useRef, useState, useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { PointOfInterest } from "../data/points";
import { COLORS } from "../utils/theme";
import { useSortedPoints, useRouteDirections } from "../hooks/useMapLogic";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "";

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius?: number;
  showGeofence?: boolean;
}

export const MapDisplay = ({ 
  location, 
  points, 
  radius = 15, // 1️⃣ CAMBIO: Bajamos el radio por defecto de 30 a 15 (más estético)
  showGeofence = true 
}: MapDisplayProps) => {
  
  const mapRef = useRef<MapView>(null);
  const sortedPoints = useSortedPoints(points);
  const directionData = useRouteDirections(sortedPoints);
  
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Zoom Inicial
  const initialRegion = useMemo(() => {
    if (sortedPoints.length > 0) {
      return {
        latitude: sortedPoints[0].latitude,
        longitude: sortedPoints[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }
    return undefined;
  }, [sortedPoints]);

  useEffect(() => {
    setTracksViewChanges(true);
    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500); 
    return () => clearTimeout(timeout);
  }, [points]);

  const handleMapLayout = () => {
    if (sortedPoints.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(sortedPoints, {
        // 2️⃣ CAMBIO: Aumentamos el padding para que los círculos no se corten
        // top/bottom más grandes para salvar el header y el footer
        edgePadding: { top: 120, right: 80, bottom: 120, left: 80 },
        animated: false,
      });
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false} 
        showsMyLocationButton={false} 
        onLayout={handleMapLayout}
      >
        
        {directionData && (
          <MapViewDirections
            origin={directionData.origin}
            destination={directionData.destination}
            waypoints={directionData.waypoints}
            apikey={GOOGLE_MAPS_APIKEY}
            mode="WALKING"
            strokeWidth={4}
            strokeColor={COLORS.primary}
            optimizeWaypoints={false}
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

        {sortedPoints.map((p) => (
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
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={2}
              tracksViewChanges={tracksViewChanges}
            >
              <View style={styles.markerOuter}>
                <View style={styles.markerInner}>
                  <Text style={styles.markerText}>
                    {typeof p.order === 'number' ? p.order : '?'}
                  </Text>
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
  mapContainer: { height: "100%", width: "100%" },
  map: { width: "100%", height: "100%" },
  
  markerOuter: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },
  markerInner: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.white 
  },
  markerText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },

  userMarkerContainer: {
    width: 24, height: 24, 
    justifyContent: 'center', alignItems: 'center',
  },
  userMarkerDot: {
    width: 20, height: 20, 
    borderRadius: 10, 
    backgroundColor: '#3B82F6',
    borderWidth: 3, 
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  }
});