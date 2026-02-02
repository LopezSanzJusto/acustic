// components/mapDisplay.tsx

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions"; 
import { PointOfInterest } from "../data/points";
import { COLORS } from "../utils/theme"; 
// ✅ Importamos nuestros nuevos hooks de lógica visual
import { useSortedPoints, useRouteDirections } from "../hooks/useMapLogic";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ""; 

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
}

export const MapDisplay = ({ location, points, radius }: MapDisplayProps) => {
  
  // 1. Lógica de datos delegada a hooks
  const sortedPoints = useSortedPoints(points);
  const directionData = useRouteDirections(sortedPoints);

  // 2. Renderizado puro
  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={false} 
        showsMyLocationButton={true}
        // Centrado inicial o seguimiento dinámico
        region={location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        } : {
            latitude: 40.413,
            longitude: -3.709,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
        }}
      >
        
        {/* === RUTA (Línea) === */}
        {directionData && (
          <MapViewDirections
            origin={{ latitude: directionData.origin.latitude, longitude: directionData.origin.longitude }}
            destination={{ latitude: directionData.destination.latitude, longitude: directionData.destination.longitude }}
            waypoints={directionData.waypoints}
            apikey={GOOGLE_MAPS_APIKEY}
            mode="WALKING"
            strokeWidth={4}
            strokeColor={COLORS.primary} 
            optimizeWaypoints={false}
          />
        )}

        {/* === USUARIO === */}
        {location && (
            <Marker coordinate={location} title="Yo" zIndex={999}>
                <View style={styles.userMarker}>
                    <Text style={{fontSize: 20}}>🚶‍♂️</Text>
                </View>
            </Marker>
        )}

        {/* === PUNTOS DE INTERÉS === */}
        {sortedPoints.map((p) => (
          <React.Fragment key={p.id}>
            {/* Zona de activación (Geofence visual) */}
            <Circle
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={radius}
              fillColor={COLORS.primaryLight}
              strokeColor={COLORS.primaryBorder}
              zIndex={1}
            />

            {/* Pin del lugar */}
            <Marker
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={2}
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
  
  userMarker: {
    backgroundColor: COLORS.white,
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary, 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 }
  },

  markerOuter: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: COLORS.primary, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  markerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});