// components/mapDisplay.native.tsx

import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { PointOfInterest } from "../data/points";

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
}

export const MapDisplay = ({ location, points, radius }: MapDisplayProps) => {
  
  // 1. Ordenamos los puntos según el campo 'order' de Firestore (1 -> 2 -> 3)
  const sortedPoints = useMemo(() => {
    return [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [points]);

  // 2. Extraemos las coordenadas para dibujar la línea del camino
  const routeCoordinates = useMemo(() => {
    return sortedPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
  }, [sortedPoints]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        // ✅ ACTIVAR ESTOS DOS PARA VER TU UBICACIÓN REAL
        showsUserLocation={true}       // Muestra el punto azul pulsante nativo
        showsMyLocationButton={true}   // Muestra el botón para recentrar el mapa
        
        initialRegion={{
          latitude: 40.4115, // La Latina (Centro aproximado)
          longitude: -3.7093,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        
        // Si tenemos ubicación, centramos el mapa en el usuario
        region={location ? { 
          latitude: location.latitude, 
          longitude: location.longitude, 
          latitudeDelta: 0.005, 
          longitudeDelta: 0.005 
        } : undefined}
      >
        
        {/* 3. Línea que conecta los puntos (Camino sugerido) */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4B0082" // Color corporativo (Morado)
            strokeWidth={3}
            lineDashPattern={[5, 5]} // Línea discontinua
          />
        )}

        {/* 4. Renderizado de los Puntos de Interés */}
        {sortedPoints.map((p) => (
          <React.Fragment key={p.id}>
            {/* Marcador con número personalizado */}
            <Marker 
              coordinate={{ latitude: p.latitude, longitude: p.longitude }} 
              title={p.name}
              anchor={{ x: 0.5, y: 0.5 }} // Centrar el círculo en la coordenada exacta
            >
              <View style={styles.markerBadge}>
                <Text style={styles.markerText}>{p.order}</Text>
              </View>
            </Marker>

            {/* Radio de activación (Geofencing) */}
            <Circle
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={radius}
              fillColor="rgba(75, 0, 130, 0.15)" // Morado suave
              strokeColor="rgba(75, 0, 130, 0.5)"
            />
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
    // Quitamos bordes redondeados inferiores si quieres pantalla completa limpia,
    // o los dejamos si prefieres el estilo tarjeta.
    overflow: "hidden" 
  },
  map: { 
    width: "100%", 
    height: "100%" 
  },
  // Estilo para la burbuja con el número (1, 2, 3...)
  markerBadge: {
    backgroundColor: '#4B0082',
    width: 30,
    height: 30,
    borderRadius: 15, // Círculo perfecto
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});