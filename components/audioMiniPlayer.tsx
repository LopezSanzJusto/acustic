// components/audioMiniPlayer.tsx

import React, { useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
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

  // SnapPoints: El 18% es para cuando está "mini", el 85% para cuando ves la lista.
  const snapPoints = useMemo(() => ['18%', '85%'], []);

  // Al pulsar una parada, cambiamos el audio. 
  // La cabecera se actualizará sola porque recibe 'activePoint' por props.
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
      // IMPORTANTE: quitamos el style={styles.container} que tenía position absolute
    >
      {/* Esta View es la "Cabecera". No desaparece al subir, se queda arriba 
          porque es lo primero dentro del BottomSheet. 
      */}
      <BottomSheetView style={styles.playerHeader}>
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

          {onToggleSpeed && (
            <TouchableOpacity style={styles.speedBadge} onPress={onToggleSpeed}>
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </TouchableOpacity>
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
      </BottomSheetView>

      {/* Título de la lista */}
      <BottomSheetView style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Próximas paradas</Text>
      </BottomSheetView>

      <BottomSheetFlatList
        data={points} // Mostramos todos para que el usuario pueda elegir cualquiera
        keyExtractor={(item: PointOfInterest) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );
};

const FONT_FAMILY = 'Urbanist-SemiBold';

const styles = StyleSheet.create({
  // ELIMINADO: styles.container que causaba el doble renderizado
  sheetBackground: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Sombra para que se vea claramente sobre el mapa
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: "#C4B5FD",
    borderRadius: 2,
    marginTop: 4,
  },
  playerHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlBtn: { padding: 2 },
  playPauseBtn: { marginHorizontal: 0 },
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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