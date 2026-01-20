// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { POINTS } from "../data/points";

export function useAudio() {
  const soundsLoaded = useRef<Record<number, Audio.Sound>>({});
  const [activeSoundId, setActiveSoundId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function preloadAll() {
      console.log("📥 Precargando audios locales...");
      for (const point of POINTS) {
        try {
          const { sound } = await Audio.Sound.createAsync(point.audio);
          
          sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded && soundsLoaded.current[point.id] === currentSoundRef.current) {
              setIsPlaying(status.isPlaying);
            }
          });

          soundsLoaded.current[point.id] = sound;
        } catch (e) {
          console.error(`❌ Error cargando localmente ${point.name}:`, e);
        }
      }
      setIsPreloading(false);
    }
    preloadAll();

    return () => {
      Object.values(soundsLoaded.current).forEach(s => s.unloadAsync());
    };
  }, []);

  const stopAll = async () => {
    for (const id in soundsLoaded.current) {
      const s = soundsLoaded.current[id];
      if (s) {
        await s.stopAsync();
        await s.setPositionAsync(0);
      }
    }
    currentSoundRef.current = null;
    setIsPlaying(false);
    setActiveSoundId(null);
  };

  const playPointAudio = async (id: number) => {
    if (activeSoundId === id && isPlaying) return;
    const sound = soundsLoaded.current[id];
    if (sound) {
      try {
        await stopAll(); 
        currentSoundRef.current = sound;
        setActiveSoundId(id);
        await sound.playAsync();
      } catch (e) {
        console.error("Error playPointAudio:", e);
      }
    }
  };

  return { playPointAudio, stopAll, isPlaying, isPreloading };
}