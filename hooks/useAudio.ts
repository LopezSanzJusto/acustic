// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { PointOfInterest } from "../data/points";
import { registerActiveAudio, unregisterActiveAudio } from "../utils/audioRegistry";

export function useAudio(points: PointOfInterest[], autoSelectFirst: boolean = false) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const regVersion = useRef(0);

  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;

  const audioUri = activePoint?.audio || null;
  const player = useAudioPlayer(audioUri);
  const status = useAudioPlayerStatus(player);

  const positionMillis = (status.currentTime || 0) * 1000;
  const durationMillis = (status.duration || 0) * 1000;
  const isPreloading = audioUri !== null && status.duration === 0;
  const isPlaying = status.playing;

  // Limpieza al desmontarse
  useEffect(() => {
    return () => { unregisterActiveAudio(regVersion.current); };
  }, []);

  /* =========================
   * AUTOSELECCIÓN INICIAL
   * ========================= */
  useEffect(() => {
    if (autoSelectFirst && points && points.length > 0 && activePointIndex === null) {
      setActivePointIndex(0);
    }
  }, [points, activePointIndex, autoSelectFirst]);

  /* =========================
   * REPRODUCCIÓN AUTOMÁTICA
   * ========================= */
  useEffect(() => {
    if (audioUri && player) {
      regVersion.current = registerActiveAudio(() => player.pause());
      player.play();
    }
  }, [audioUri, player]);

  /* =========================
   * CONTROLES
   * ========================= */
  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      regVersion.current = registerActiveAudio(() => player.pause());
      player.play();
    }
  };

  const seekTo = (millis: number) => {
    player.seekTo(millis / 1000);
  };

  const skipBy = (millis: number) => {
    const newPos = Math.max(0, Math.min(positionMillis + millis, durationMillis));
    player.seekTo(newPos / 1000);
  };

  const toggleSpeed = () => {
    let newRate = 1.0;
    if (playbackRate === 1.0) newRate = 1.25;
    else if (playbackRate === 1.25) newRate = 1.5;
    else if (playbackRate === 1.5) newRate = 2.0;

    setPlaybackRate(newRate);
    player.setPlaybackRate(newRate);
  };

  const playNext = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex + 1) % points.length);
  };

  const playPrevious = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex - 1 + points.length) % points.length);
  };

  return {
    activePoint,
    isPlaying,
    isPreloading,
    positionMillis,
    durationMillis,
    playbackRate,
    setActivePointIndex,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    skipBy,
    toggleSpeed,
  };
}
