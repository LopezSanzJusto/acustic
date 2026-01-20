// components/mapDisplay.tsx

import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { PointOfInterest } from "../data/points";

interface MapDisplayProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
}

export const MapDisplay = ({ location, points, radius }: MapDisplayProps) => {
  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 40.4167,
          longitude: -3.7037,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        region={location ? { ...location, latitudeDelta: 0.002, longitudeDelta: 0.002 } : undefined}
      >
        {location && <Marker coordinate={location} title="Tu posición" pinColor="blue" />}
        
        {points.map((p) => (
          <React.Fragment key={p.id}>
            <Marker coordinate={{ latitude: p.latitude, longitude: p.longitude }} title={p.name} />
            <Circle
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={radius}
              fillColor="rgba(0, 102, 204, 0.15)"
              strokeColor="rgba(0, 102, 204, 0.4)"
            />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { height: "100%", width: "100%", borderBottomLeftRadius: 25, borderBottomRightRadius: 25, overflow: "hidden" },
  map: { width: "100%", height: "100%" },
});