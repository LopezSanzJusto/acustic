// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { PointOfInterest } from "../data/points";

type LoadedSounds = Record<string, Audio.Sound>;

// ✨ AÑADIMOS EL PARÁMETRO autoSelectFirst (por defecto en false)
export function useAudio(points: PointOfInterest[], autoSelectFirst: boolean = false) {
  const soundsLoaded = useRef<LoadedSounds>({});
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;

  /* =========================
   * 🆕 NUEVO: SELECCIÓN POR DEFECTO
   * ========================= */
  useEffect(() => {
    // ✨ AHORA SOLO AUTO-SELECCIONA SI LE DECIMOS QUE LO HAGA
    if (autoSelectFirst && points && points.length > 0 && activePointIndex === null) {
      setActivePointIndex(0);
    }
  }, [points, activePointIndex, autoSelectFirst]);

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

    if (isPreloading) return;

    const point = points[activePointIndex];
    const sound = soundsLoaded.current[point.id];
    if (!sound) return;

    const play = async () => {
      await stopAll();
      currentSoundRef.current = sound;

      await sound.setRateAsync(playbackRate, true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setIsPlaying(status.isPlaying);
        setPositionMillis(status.positionMillis ?? 0);
        setDurationMillis(status.durationMillis ?? 0);
      });

      await sound.playAsync();
    };

    play();
  }, [activePointIndex, isPreloading]);

  // ... (RESTO DE TUS FUNCIONES SE MANTIENEN EXACTAMENTE IGUAL) ...
  
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

    const newPos = Math.max(0, Math.min(positionMillis + millis, durationMillis));
    await sound.setPositionAsync(newPos);
  };

  const toggleSpeed = async () => {
    const sound = currentSoundRef.current;
    
    let newRate = 1.0;
    if (playbackRate === 1.0) newRate = 1.25;
    else if (playbackRate === 1.25) newRate = 1.5;
    else if (playbackRate === 1.5) newRate = 2.0;

    setPlaybackRate(newRate);
    
    if (sound) {
      try {
        await sound.setRateAsync(newRate, true);
      } catch (error) {
        console.error("Error cambiando velocidad:", error);
      }
    }
  };

  const playNext = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex + 1) % points.length);
  };

  const playPrevious = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex - 1 + points.length) % points.length);
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