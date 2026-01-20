// hooks/useAudio.ts

import { useEffect, useRef, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { useFirebasePoints } from "./useFirebasePoints"; // Importante: usar tus puntos de la nube

export function useAudio() {
  const { points, loading: pointsLoading } = useFirebasePoints();
  const soundsLoaded = useRef<Record<number, Audio.Sound>>({});
  const [activeSoundId, setActiveSoundId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function preloadRemoteAudios() {
      if (points.length === 0) return;

      console.log("🌐 Descargando audios desde el servidor remoto...");
      for (const point of points) {
        try {
          // CLAVE: Usamos { uri: ... } para cargar desde la URL de GitHub/Internet
          const { sound } = await Audio.Sound.createAsync(
            { uri: point.audio }, 
            { shouldPlay: false }
          );
          
          sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded && soundsLoaded.current[point.id] === currentSoundRef.current) {
              setIsPlaying(status.isPlaying);
            }
          });

          soundsLoaded.current[point.id] = sound;
        } catch (e) {
          console.error(`❌ Error cargando audio de ${point.name}:`, e);
        }
      }
      setIsPreloading(false);
    }

    if (!pointsLoading) {
      preloadRemoteAudios();
    }
  }, [points, pointsLoading]);

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
        console.error("Error en reproducción remota:", e);
      }
    }
  };

  return { playPointAudio, stopAll, isPlaying, isPreloading };
}