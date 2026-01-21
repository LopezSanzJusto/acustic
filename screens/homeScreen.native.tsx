// screens/homeScreen.native.tsx

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useLocation } from "../hooks/useLocation";
import { useFirebasePoints } from "../hooks/useFirebasePoints";
import { useAudio } from "../hooks/useAudio";
import { isWithinRadius } from "../services/proximityService";
import { MapDisplay } from "../components/mapDisplay";
import { AudioMiniPlayer } from "../components/audioMiniPlayer";
import { PointOfInterest } from "../data/points";

const RADIUS = 30;

export default function HomeScreen() {
  const { location } = useLocation(true);
  const { points, loading: pointsLoading } = useFirebasePoints();

  const {
    activePoint,
    isPlaying,
    isPreloading,
    positionMillis,
    durationMillis,
    setActivePointIndex,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    skipBy,
  } = useAudio(points);

  /* =========================
   * 📍 Punto activo por GPS
   * ========================= */
  const gpsActivePoint = useMemo(() => {
    if (!location || points.length === 0) return null;

    return (
      points.find((p: PointOfInterest) =>
        isWithinRadius(
          location,
          { latitude: p.latitude, longitude: p.longitude },
          RADIUS
        )
      ) || null
    );
  }, [location, points]);

  /* =========================
   * 🔁 Sincronizar GPS → Audio
   * ========================= */
  useEffect(() => {
    if (isPreloading || pointsLoading) return;

    // 🚫 Hemos salido de cualquier punto
    if (!gpsActivePoint) {
      setActivePointIndex(null);
      return;
    }

    // ✅ Hemos entrado en un punto
    const index = points.findIndex(p => p.id === gpsActivePoint.id);
    if (index !== -1) {
      setActivePointIndex(index);
    }
  }, [gpsActivePoint?.id, isPreloading, pointsLoading]);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, position: "relative" }}>
        <MapDisplay location={location} points={points} radius={RADIUS} />

        {activePoint && (
          <AudioMiniPlayer
            activePoint={activePoint}
            isPlaying={isPlaying}
            positionMillis={positionMillis}
            durationMillis={durationMillis}
            onPlayPause={togglePlayPause}
            onNext={playNext}
            onPrevious={playPrevious}
            onSeek={seekTo}
            onSkip={skipBy}
          />
        )}
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
});