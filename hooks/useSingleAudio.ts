// hooks/useSingleAudio.ts
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useSingleAudio(audioUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✨ Nuevo estado para el loading
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Limpiamos la memoria si el componente se desmonta (cambiamos de pestaña, etc.)
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const togglePlayPause = async () => {
    if (!audioUrl) return;

    // ✨ Obligamos a que suene aunque el móvil (ej. iPhone) esté en silencio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    try {
      if (soundRef.current) {
        // 1. El audio ya estaba cargado previamente
        if (isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          await soundRef.current.playAsync();
        }
      } else {
        // 2. LAZY LOAD: Cargamos el audio SOLO si es la primera vez que pulsa Play
        setIsLoading(true);
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }, // Lo reproducimos inmediatamente tras cargar
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              setPositionMillis(status.positionMillis);
              setDurationMillis(status.durationMillis ?? 0);

              // Si el audio termina, lo volvemos a poner al principio
              if (status.didJustFinish) {
                setIsPlaying(false);
                sound.setPositionAsync(0);
              }
            }
          }
        );
        soundRef.current = sound;
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error reproduciendo audio:", error);
      setIsLoading(false);
    }
  };

  const seekTo = async (millis: number) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(millis);
  };

  return { isPlaying, isLoading, positionMillis, durationMillis, togglePlayPause, seekTo };
}