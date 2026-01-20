// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { PointOfInterest } from "../data/points";

type LoadedSounds = Record<number, Audio.Sound>;

export function useAudio(points: PointOfInterest[]) {
  const soundsLoaded = useRef<LoadedSounds>({});
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const [activeSoundId, setActiveSoundId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  // 🎧 Precarga de audios
  useEffect(() => {
    if (points.length === 0) {
      setIsPreloading(false);
      return;
    }

    let isCancelled = false;

    async function preloadAudios() {
      setIsPreloading(true);

      for (const point of points) {
        if (soundsLoaded.current[point.id]) continue;

        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: point.audio },
            { shouldPlay: false }
          );

          sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (
              status.isLoaded &&
              currentSoundRef.current === sound
            ) {
              setIsPlaying(status.isPlaying);
            }
          });

          soundsLoaded.current[point.id] = sound;
        } catch (error) {
          console.error(`❌ Error cargando audio (${point.name})`, error);
        }
      }

      if (!isCancelled) {
        setIsPreloading(false);
      }
    }

    preloadAudios();

    return () => {
      isCancelled = true;
    };
  }, [points]);

  // ▶️ Reproducir audio por ID
  const playPointAudio = async (id: number) => {
    if (activeSoundId === id && isPlaying) return;

    const sound = soundsLoaded.current[id];
    if (!sound) return;

    try {
      await stopAll();
      currentSoundRef.current = sound;
      setActiveSoundId(id);
      await sound.playAsync();
    } catch (error) {
      console.error("❌ Error reproduciendo audio:", error);
    }
  };

  // ⏹️ Detener todo
  const stopAll = async () => {
    for (const sound of Object.values(soundsLoaded.current)) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      } catch {}
    }

    currentSoundRef.current = null;
    setActiveSoundId(null);
    setIsPlaying(false);
  };

  // 🧹 Cleanup total
  useEffect(() => {
    return () => {
      Object.values(soundsLoaded.current).forEach((sound) => {
        sound.unloadAsync();
      });
    };
  }, []);

  return {
    playPointAudio,
    stopAll,
    isPlaying,
    isPreloading,
  };
}
