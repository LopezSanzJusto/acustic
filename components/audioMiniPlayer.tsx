// components/audioMiniPlayer.tsx

import React, { useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { COLORS } from "../utils/theme";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Slider from "@react-native-community/slider";
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
          <Slider
            style={styles.slider}
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

const FONT_FAMILY = 'Urbanist-SemiBold';

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
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6", 
    zIndex: 10,
    elevation: 5, 
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    marginRight: 16, // ✨ MARGEN AUMENTADO PARA QUE QUEPA EL CÍRCULO
  },
  thumbnail: {
    width: 48, // ✨ UN POQUITO MÁS GRANDE PARA QUE DESTAQUE
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  badge: {
    position: "absolute",
    // ✨ LA MAGIA PARA CENTRARLO EN EL BORDE DERECHO:
    right: -10,      // Lo empuja 10px fuera de la imagen (hacia la derecha)
    top: "50%",      // Lo sitúa en la mitad vertical de la foto
    marginTop: -10,  // Compensa su propia altura para que el centro sea exacto
    // APARIENCIA VISUAL:
    backgroundColor: COLORS.primary, 
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2, // ✨ Borde blanco clave para separar de la imagen
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
    marginBottom: 5,
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