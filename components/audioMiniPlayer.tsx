// components/audioMiniPlayer.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { PointOfInterest } from "../data/points";

interface Props {
  activePoint: PointOfInterest;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackRate?: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (ms: number) => void;
  onToggleSpeed?: () => void;
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
  playbackRate = 1.0,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleSpeed,
}: Props) => {
  return (
    <View style={styles.container}>
      
      <View style={styles.dragIndicatorWrapper}>
        <View style={styles.dragIndicator} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: activePoint.image }} style={styles.thumbnail} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activePoint.order}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {activePoint.name}
        </Text>
      </View>

      <View style={styles.controlsAndSpeedRow}>
        <View style={styles.mainControls}>
          <TouchableOpacity onPress={onPrevious} style={styles.controlBtn}>
            <Ionicons name="play-back" size={26} color="#3730A3" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onPlayPause} style={styles.playPauseBtn}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#8B5CF6" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onNext} style={styles.controlBtn}>
            <Ionicons name="play-forward" size={26} color="#3730A3" />
          </TouchableOpacity>
        </View>

        {onToggleSpeed ? (
          <TouchableOpacity style={styles.speedBadge} onPress={onToggleSpeed}>
            <Text style={styles.speedText}>{playbackRate}x</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.speedBadgePlaceholder} />
        )}
      </View>

      <View style={styles.progress}>
        <Text style={styles.timeLabel}>{formatTime(positionMillis)}</Text>

        <Slider
          style={{ flex: 1, height: 28 }}
          minimumValue={0}
          maximumValue={durationMillis || 1}
          value={positionMillis}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#8B5CF6"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#8B5CF6"
        />

        <Text style={styles.timeLabel}>{formatTime(durationMillis)}</Text>
      </View>
    </View>
  );
};

const FONT_FAMILY = 'Urbanist-SemiBold'; 

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicatorWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: "#C4B5FD",
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  thumbnail: {
    width: 38,
    height: 38,
    borderRadius: 7,
    backgroundColor: "#E5E7EB",
  },
  badge: {
    position: "absolute",
    // top: -5,
    right: -5,
    backgroundColor: "#8B5CF6",
    width: 19,
    height: 19,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: "700",
  },
  title: {
    flex: 1,
    fontWeight: "600",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    color: "#312E81",
  },
  controlsAndSpeedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 0,
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlBtn: {
    padding: 2,
  },
  playPauseBtn: {
    marginHorizontal: 0,
  },
  speedBadge: {
    position: "absolute",
    right: 0,
    backgroundColor: "#EDE9FE",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  speedText: {
    color: "#8B5CF6",
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
  speedBadgePlaceholder: {
    width: 40,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -2,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: FONT_FAMILY,
    width: 32,
    textAlign: "center",
  },
});