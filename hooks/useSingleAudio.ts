// hooks/useSingleAudio.ts
import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { registerActiveAudio, unregisterActiveAudio } from '../utils/audioRegistry';

export function useSingleAudio(audioUrl?: string) {
  const [source, setSource] = useState<string | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const regVersion = useRef(0);

  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const positionMillis = (status.currentTime || 0) * 1000;
  const durationMillis = (status.duration || 0) * 1000;
  const isLoading = source !== null && status.duration === 0;

  // Limpieza al desmontarse: si somos el activo, dejamos el registry libre
  useEffect(() => {
    return () => { unregisterActiveAudio(regVersion.current); };
  }, []);

  // Reseteamos el estado si la URL original cambia
  useEffect(() => {
    setSource(null);
    setShouldAutoPlay(false);
  }, [audioUrl]);

  // Auto-reproducir cuando el lazy load termina de cargar
  useEffect(() => {
    if (shouldAutoPlay && player && status.duration > 0) {
      regVersion.current = registerActiveAudio(() => player.pause());
      player.play();
      setShouldAutoPlay(false);
    }
  }, [player, status.duration, shouldAutoPlay]);

  const togglePlayPause = () => {
    if (!audioUrl) return;

    if (!source) {
      // LAZY LOAD: paramos al reproductor anterior ya, y guardamos una stop-fn
      // que además cancela el autoplay si nos paran antes de que cargue
      regVersion.current = registerActiveAudio(() => { player.pause(); setShouldAutoPlay(false); });
      setSource(audioUrl);
      setShouldAutoPlay(true);
    } else {
      if (isPlaying) {
        player.pause();
      } else {
        regVersion.current = registerActiveAudio(() => player.pause());
        if (status.duration > 0 && status.currentTime >= status.duration - 0.5) {
          player.seekTo(0);
        }
        player.play();
      }
    }
  };

  const seekTo = (millis: number) => {
    if (!player) return;
    player.seekTo(millis / 1000);
  };

  return { isPlaying, isLoading, positionMillis, durationMillis, togglePlayPause, seekTo };
}
