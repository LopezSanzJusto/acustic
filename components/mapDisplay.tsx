// components/mapDisplay.tsx

import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions"; 
import { PointOfInterest } from "../data/points";

// ✅ TU API KEY
const GOOGLE_MAPS_APIKEY = "AIzaSyCvA68C5hB-6FPF0kun4vsluEHkgCCs0NU"; 

// COLORES DEL DISEÑO
const THEME = {
  routeColor: "#00D2A0", // Turquesa
  pinColor: "#2D2D2D",   // Negro/Gris oscuro
  textColor: "#FFFFFF"   // Blanco
};

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
}

export const MapDisplay = ({ location, points, radius }: MapDisplayProps) => {
  
  // 1. Ordenar puntos
  const sortedPoints = useMemo(() => {
    return [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [points]);

  // 2. Preparar ruta
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
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
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
            strokeWidth={5}
            strokeColor={THEME.routeColor}
            optimizeWaypoints={false}
          />
        )}

        {/* === MARCADORES === */}
        {sortedPoints.map((p) => (
          <React.Fragment key={p.id}>
            {/* Círculo de radio */}
            <Circle
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={radius}
              fillColor="rgba(0, 210, 160, 0.15)"
              strokeColor="rgba(0, 210, 160, 0.4)"
              zIndex={1}
            />

            {/* PIN PERSONALIZADO */}
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
  mapContainer: { 
    height: "100%", 
    width: "100%", 
    overflow: "hidden"
  },
  map: { 
    width: "100%", 
    height: "100%" 
  },
  
  // 🆕 Nuevo estilo: Contenedor invisible para evitar cortes en Android
  markerOuter: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',

    // sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // ANDROID
  },

  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#1E1E1E', // negro elegante
    justifyContent: 'center',
    alignItems: 'center',
  },

  markerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false, 
    textAlignVertical: 'center',
  },
});