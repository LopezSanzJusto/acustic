// components/audioMiniPlayer.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { PointOfInterest } from "../data/points";

interface Props {
  activePoint: PointOfInterest;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (ms: number) => void;
  onSkip: (ms: number) => void;
}

const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const AudioMiniPlayer = ({
  activePoint,
  isPlaying,
  positionMillis,
  durationMillis,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onSkip,
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {activePoint.name}
      </Text>

      <View style={styles.progress}>
        <Text style={styles.time}>{formatTime(positionMillis)}</Text>

        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={durationMillis || 1}
          value={positionMillis}
          onSlidingComplete={onSeek}
        />

        <Text style={styles.time}>{formatTime(durationMillis)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrevious}>
          <Text style={styles.control}>⏮️</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onSkip(-15000)}>
          <Text style={styles.control}>⏪15</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause}>
          <Text style={styles.control}>
            {isPlaying ? "⏸️" : "▶️"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onSkip(15000)}>
          <Text style={styles.control}>15⏩</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext}>
          <Text style={styles.control}>⏭️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: "#666",
    width: 40,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  control: {
    fontSize: 18,
  },
});
