// components/mapDisplay.tsx

import React, { useRef, useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
// ✨ Añadimos Polyline a las importaciones
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { PointOfInterest } from "../data/points";
import { COLORS } from "../utils/theme";
import { useSortedPoints, useRouteDirections } from "../hooks/useMapLogic";

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "";

const cleanMapStyle = [
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
];

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius?: number;
  showGeofence?: boolean;
  onRouteCalculated?: (distanceText: string) => void;
  markerType?: "image" | "number"; 
  dashedRoute?: boolean;
}

export const MapDisplay = ({
  location,
  points,
  radius = 15,
  showGeofence = true,
  onRouteCalculated,
  markerType = "image", 
  dashedRoute = false, 
}: MapDisplayProps) => {
  const mapRef = useRef<MapView>(null);
  const sortedPoints = useSortedPoints(points);
  const directionData = useRouteDirections(sortedPoints);

  const [markersLoaded, setMarkersLoaded] = useState(false);
  
  // ✨ ESTADO NUEVO: Para guardar la ruta y dibujar los guiones blancos encima
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMarkersLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [points]);

  const initialRegion = useMemo(() => {
    if (sortedPoints.length > 0) {
      return {
        latitude: sortedPoints[0].latitude,
        longitude: sortedPoints[0].longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return undefined;
  }, [sortedPoints]);

  const handleMapLayout = () => {
    if (sortedPoints.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(sortedPoints, {
        edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
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
        customMapStyle={cleanMapStyle} 
      >
        {/* === CAPA 1: RUTA BASE (Morada, sólida y gruesa) === */}
        {directionData && (
          <MapViewDirections
            origin={directionData.origin}
            destination={directionData.destination}
            waypoints={directionData.waypoints}
            apikey={GOOGLE_MAPS_APIKEY}
            mode="WALKING"
            strokeWidth={8} // Más gruesa para que actúe de fondo
            strokeColor={COLORS.primary}
            optimizeWaypoints={false}
            onReady={(result) => {
              // Guardamos las coordenadas para usarlas en la línea blanca
              setRouteCoords(result.coordinates);
              
              if (onRouteCalculated) {
                const distanceText = `${result.distance.toFixed(2)} km`;
                onRouteCalculated(distanceText);
              }
            }}
          />
        )}

        {/* === CAPA 2: LÍNEA BLANCA A GUIONES (Por encima de la morada) === */}
        {dashedRoute && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={3} // Más fina que el fondo
            strokeColor="#FFFFFF" // Blanca
            lineDashPattern={[12, 12]} // Guiones (ajusta estos números para cambiar el largo de la raya y el hueco)
            zIndex={1} 
          />
        )}

        {location && (
          <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }} zIndex={999}>
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}

        {sortedPoints.map((p, index) => (
          <React.Fragment key={`${p.id}-${markersLoaded}`}>
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
              tracksViewChanges={true} 
            >
              <View style={styles.markerWrapper} collapsable={false}>
                
                {markerType === "number" ? (
                  <>
                    {index === 1 && p.title ? (
                      <View style={styles.poiLabel}>
                        <Text style={styles.poiLabelText}>{p.title}</Text>
                      </View>
                    ) : null}

                    {index === 0 ? (
                      <View style={styles.startMarker}>
                        <Text style={styles.startMarkerText}>START</Text>
                        <View style={styles.startMarkerCircle}>
                          <Text style={styles.startMarkerCircleText}>1</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.numberMarker}>
                        <Text style={styles.numberMarkerText}>{index + 1}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={[styles.markerBorder, { backgroundColor: COLORS.primary }]} />
                )}
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
  
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  numberMarker: {
    width: 28, 
    height: 28, 
    borderRadius: 14,
    backgroundColor: COLORS.primary, 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
  numberMarkerText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  
  startMarker: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: COLORS.badge, 
    paddingHorizontal: 8, 
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 2, 
    borderColor: '#FFFFFF',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5,
  },
  startMarkerText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 13, 
    marginRight: 6 
  },
  startMarkerCircle: {
    width: 20, 
    height: 20, 
    borderRadius: 10,
    backgroundColor: COLORS.badge, 
    borderWidth: 1, 
    borderColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  startMarkerCircleText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 11 
  },

  poiLabel: {
    backgroundColor: '#8A72F6',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  poiLabelText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  markerBorder: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: COLORS.white,
    justifyContent: "center", alignItems: "center",
  },
});