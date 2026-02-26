import React, { useRef, useState, useMemo, useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
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
  onRouteCalculated?: (distanceText: string) => void;
}

export const MapDisplay = ({
  location,
  points,
  radius = 15,
  showGeofence = true,
  onRouteCalculated,
}: MapDisplayProps) => {
  const mapRef = useRef<MapView>(null);
  const sortedPoints = useSortedPoints(points);
  const directionData = useRouteDirections(sortedPoints);

  const [loadedImages, setLoadedImages] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    setLoadedImages({});
  }, [points]);

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
              coordinate={{
                latitude: p.latitude,
                longitude: p.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={2}
              tracksViewChanges={!loadedImages[p.id]}
            >
              {/* TRUCO 1: collapsable={false} obliga a Android a no borrar esta vista al compilar */}
              <View style={styles.markerBorder} collapsable={false}>
                {p.image ? (
                  <Image
                    key={p.image} // Obliga a re-montar si cambia la URL
                    source={{ uri: p.image }}
                    style={styles.markerImage}
                    resizeMode="cover"
                    fadeDuration={0} // TRUCO 2: Quita la animación de carga que rompe la captura del mapa
                    onLoadEnd={() => {
                      // TRUCO 3: Esperar 1 segundo completo antes de congelar el renderizado
                      setTimeout(() => {
                        setLoadedImages((prev) => ({
                          ...prev,
                          [p.id]: true,
                        }));
                      }, 1000); 
                    }}
                  />
                ) : (
                  <View
                    style={[
                      styles.markerImage,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
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

  markerBorder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    
    // El borde se lo damos a este contenedor
    borderWidth: 2,
    borderColor: COLORS.white,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },

  markerImage: {
    // Le restamos los 4px del borde (2px por lado) al ancho total
    width: 41,
    height: 41,
    borderRadius: 20.5, 
  },

  userMarkerContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  userMarkerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});