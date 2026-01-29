// components/mapDisplay.tsx

import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions"; 
import { PointOfInterest } from "../data/points";
import { COLORS } from "../utils/theme"; // Importamos tu tema

// Recuerda: en producción usa process.env
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ""; 

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
}

export const MapDisplay = ({ location, points, radius }: MapDisplayProps) => {
  
  const sortedPoints = useMemo(() => {
    return [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [points]);

  const directionData = useMemo(() => {
    if (sortedPoints.length < 2) return null;
    const origin = sortedPoints[0];
    const destination = sortedPoints[sortedPoints.length - 1];
    const waypoints = sortedPoints.slice(1, -1).map(p => ({
      latitude: p.latitude, longitude: p.longitude
    }));
    return { origin, destination, waypoints };
  }, [sortedPoints]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={false} 
        showsMyLocationButton={true}
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
        
        {/* === RUTA === */}
        {directionData && (
          <MapViewDirections
            origin={{ latitude: directionData.origin.latitude, longitude: directionData.origin.longitude }}
            destination={{ latitude: directionData.destination.latitude, longitude: directionData.destination.longitude }}
            waypoints={directionData.waypoints}
            apikey={GOOGLE_MAPS_APIKEY}
            mode="WALKING"
            strokeWidth={4}
            // ✅ CAMBIO 1: Color de la línea de ruta (Morado)
            strokeColor={COLORS.primary} 
            optimizeWaypoints={false}
          />
        )}

        {/* === USUARIO (Simulación) === */}
        {location && (
            <Marker coordinate={location} title="Yo (Simulación)" zIndex={999}>
                <View style={styles.userMarker}>
                    <Text style={{fontSize: 20}}>🚶‍♂️</Text>
                </View>
            </Marker>
        )}

        {/* === PUNTOS DE INTERÉS === */}
        {sortedPoints.map((p) => (
          <React.Fragment key={p.id}>
            {/* ✅ CAMBIO 2: Círculos (Radio de activación) */}
            <Circle
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={radius}
              // Morado (#4B0082) con 15% de opacidad: rgba(75, 0, 130, 0.15)
              fillColor="rgba(75, 0, 130, 0.15)"
              // Borde morado con 50% de opacidad
              strokeColor="rgba(75, 0, 130, 0.5)"
              zIndex={1}
            />

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
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    // Podríamos poner el borde del usuario también morado si quieres
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
    backgroundColor: '#FFF',
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
    // ✅ CAMBIO 3: El punto negro central ahora es morado
    backgroundColor: COLORS.primary, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  markerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});