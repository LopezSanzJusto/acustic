// hooks/useAudio.ts

import { useEffect, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { PointOfInterest } from "../data/points";

export function useAudio(points: PointOfInterest[], autoSelectFirst: boolean = false) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;

  // 1. Cargamos el reproductor de forma nativa. Si no hay audio, le pasamos null.
  const audioUri = activePoint?.audio || null;
  const player = useAudioPlayer(audioUri);
  
  // 2. Este hook mágico nos da el estado en tiempo real sin tener que hacer callbacks manuales
  const status = useAudioPlayerStatus(player);

  // 3. Adaptamos los tiempos (expo-audio usa SEGUNDOS, tu MiniPlayer usa MILISEGUNDOS)
  const positionMillis = (status.currentTime || 0) * 1000;
  const durationMillis = (status.duration || 0) * 1000;
  
  // Si tenemos un URI pero la duración es 0, significa que el audio está "cargando"
  const isPreloading = audioUri !== null && status.duration === 0;
  const isPlaying = status.playing;

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
    // Al cambiar de punto o de URI, le decimos al reproductor que arranque solo
    if (audioUri && player) {
      player.play();
    }
  }, [audioUri, player]);

  /* =========================
   * CONTROLES
   * ========================= */
  const togglePlayPause = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  const seekTo = (millis: number) => {
    player.seekTo(millis / 1000); // expo-audio pide segundos
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