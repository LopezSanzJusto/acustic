// components/mapDisplay.tsx

import React, { useRef, useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";
// ✨ QUÍTAMOS PROVIDER_GOOGLE. Dejamos que el SO decida el mapa nativo.
import MapView, { Marker, Circle } from "react-native-maps";
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
  const directionData = useRouteDirections(sortedPoints);

  const [loadedImages, setLoadedImages] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    setLoadedImages({});
    if (markerType === 'number') {
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
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        // ✨ Eliminado provider y loadingEnabled para evitar bugs en Expo 55
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
            lineDashPattern={dashedRoute ? [10, 10] : undefined} 
            onReady={(result) => {
              if (onRouteCalculated) {
                const distanceText = `${result.distance.toFixed(2)} km`;
                onRouteCalculated(distanceText);
              }
            }}
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
    // ✨ FORZAMOS POSICIÓN ABSOLUTA para evitar que el mapContainer mida 0x0
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#E6E6E6',
    overflow: "hidden" 
  },
  map: { 
    // ✨ EL MAPA TAMBIÉN DEBE SER ABSOLUTO para renderizar en Fabric
    ...StyleSheet.absoluteFillObject 
  },

  // ... (el resto de tus estilos se mantienen igual)
  markerBorder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.white, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },
  markerImage: { width: 41, height: 41, borderRadius: 20.5 },
  numberMarkerOuter: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  numberText: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  startBadge: { backgroundColor: '#FF8533', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 3 },
  startText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  userMarkerContainer: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  userMarkerDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#3B82F6", borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
});