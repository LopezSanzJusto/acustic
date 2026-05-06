// components/audioMiniPlayer.tsx

import React, { useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { COLORS } from "../utils/theme";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { GlowSlider } from "./GlowSlider";
import { Ionicons } from "@expo/vector-icons";
import { PointOfInterest } from "../data/points";
import { StopCard } from "./StopCard";

interface Props {
  activePoint: PointOfInterest;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackRate?: number;
  points: PointOfInterest[];
  onSelectAudio: (index: number) => void;
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
  points,
  onSelectAudio,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleSpeed,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => [180, '85%'], []);

  const handleStopPress = useCallback((pointId: string) => {
    const index = points.findIndex(p => p.id === pointId);
    if (index !== -1) {
      onSelectAudio(index);
    }
  }, [points, onSelectAudio]);

  const renderItem = useCallback(({ item }: { item: PointOfInterest }) => (
    <StopCard point={item} onPress={() => handleStopPress(item.id)} />
  ), [handleStopPress]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      handleIndicatorStyle={styles.dragIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: activePoint.image }} style={styles.thumbnail} />
            {/* ✨ EL BADGE VUELVE A ESTAR AQUÍ, DENTRO DEL IMAGE CONTAINER */}
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

          {onToggleSpeed && (
            <TouchableOpacity style={styles.speedBadge} onPress={onToggleSpeed}>
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progress}>
          <Text style={styles.timeLabel}>{formatTime(positionMillis)}</Text>
          <GlowSlider
            style={styles.slider}
            minimumValue={0}
            maximumValue={durationMillis || 1}
            value={positionMillis}
            onSlidingComplete={onSeek}
          />
          <Text style={styles.timeLabel}>{formatTime(durationMillis)}</Text>
        </View>
      </View>

      <BottomSheetFlatList
        data={points}
        keyExtractor={(item: PointOfInterest) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas paradas</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );
};

const FONT_FAMILY = 'Poppins_600SemiBold';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    marginTop: 10,
  },
  stickyHeader: {
    backgroundColor: "#FFF", 
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6", 
    zIndex: 10,
    elevation: 5, 
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  imageContainer: {
    position: "relative",
    marginRight: 26,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  badge: {
    position: "absolute",
    right: -16,
    top: "50%",
    marginTop: -15,
    backgroundColor: "#4E4FA5",
    width: 30,
    height: 30,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF", 
    fontSize: 20,
    fontFamily: FONT_FAMILY,
    fontWeight: "700",
  },
  title: {
    flex: 1,
    fontWeight: "700",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    color: "#1F2937",
  },
  controlsAndSpeedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 2,
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  controlBtn: { padding: 4 },
  playPauseBtn: { marginHorizontal: 0 },
  speedBadge: {
    position: "absolute",
    right: 0,
    backgroundColor: "#EDE9FE",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  speedText: {
    color: "#8B5CF6",
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slider: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: FONT_FAMILY,
    width: 36,
    textAlign: "center",
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: FONT_FAMILY,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});