// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { PointOfInterest } from "../data/points";

type LoadedSounds = Record<string, Audio.Sound>;

export function useAudio(points: PointOfInterest[]) {
  const soundsLoaded = useRef<LoadedSounds>({});
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  const activePoint =
    activePointIndex !== null ? points[activePointIndex] : null;

  /* =========================
   * 🎧 PRELOAD AUDIOS
   * ========================= */
  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      setIsPreloading(true);
      const loaded: LoadedSounds = {};

      for (const point of points) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: point.audio },
            { shouldPlay: false }
          );
          loaded[point.id] = sound;
        } catch (e) {
          console.warn("Error cargando audio:", point.id);
        }
      }

      if (!cancelled) {
        soundsLoaded.current = loaded;
        setIsPreloading(false);
      }
    };

    if (points.length > 0) {
      preload();
    } else {
      setIsPreloading(false);
    }

    return () => {
      cancelled = true;
      Object.values(soundsLoaded.current).forEach((s) => s.unloadAsync());
      soundsLoaded.current = {};
    };
  }, [points]);

  /* =========================
   * ▶️ CAMBIO DE PUNTO
   * ========================= */
  useEffect(() => {
    if (activePointIndex === null) {
      stopAll();
      setPositionMillis(0);
      setDurationMillis(0);
      return;
    }

    const point = points[activePointIndex];
    const sound = soundsLoaded.current[point.id];
    if (!sound) return;

    const play = async () => {
      await stopAll();
      currentSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setIsPlaying(status.isPlaying);
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
      });

      await sound.playAsync();
    };

    play();
  }, [activePointIndex]);

  /* =========================
   * ⏯️ CONTROLES
   * ========================= */
  const togglePlayPause = async () => {
    const sound = currentSoundRef.current;
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    status.isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const seekTo = async (millis: number) => {
    const sound = currentSoundRef.current;
    if (!sound) return;
    await sound.setPositionAsync(millis);
  };

  const skipBy = async (millis: number) => {
    const sound = currentSoundRef.current;
    if (!sound) return;

    const newPos = Math.max(
      0,
      Math.min(positionMillis + millis, durationMillis)
    );

    await sound.setPositionAsync(newPos);
  };

  const playNext = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex + 1) % points.length);
  };

  const playPrevious = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex(
      (activePointIndex - 1 + points.length) % points.length
    );
  };

  const stopAll = async () => {
    for (const sound of Object.values(soundsLoaded.current)) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      } catch {}
    }
    currentSoundRef.current = null;
    setIsPlaying(false);
  };

  return {
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
  };
}