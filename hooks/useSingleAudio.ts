// hooks/useSingleAudio.ts
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useSingleAudio(audioUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    let isMounted = true;

    const loadAudio = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (status) => {
            if (isMounted && status.isLoaded) {
              setIsPlaying(status.isPlaying);
              setPositionMillis(status.positionMillis);
              setDurationMillis(status.durationMillis ?? 0);
            }
          }
        );
        if (isMounted) soundRef.current = sound;
      } catch (error) {
        console.error("Error cargando el audio:", error);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    isPlaying ? await soundRef.current.pauseAsync() : await soundRef.current.playAsync();
  };

  const seekTo = async (millis: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(millis);
  };

  return { isPlaying, positionMillis, durationMillis, togglePlayPause, seekTo };
}