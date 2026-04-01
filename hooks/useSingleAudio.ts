// hooks/useSingleAudio.ts
import { useState, useEffect } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function useSingleAudio(audioUrl?: string) {
  // ✨ LAZY LOAD: Empezamos en null para no consumir RAM ni datos hasta pulsar Play
  const [source, setSource] = useState<string | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  // 1. Cargamos el reproductor de forma nativa (si source es null, no hace nada)
  const player = useAudioPlayer(source);
  
  // 2. Este hook mágico nos da el estado en tiempo real (adiós al setOnPlaybackStatusUpdate)
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  // Adaptamos los tiempos (expo-audio usa SEGUNDOS, tu app espera MILISEGUNDOS)
  const positionMillis = (status.currentTime || 0) * 1000;
  const durationMillis = (status.duration || 0) * 1000;

  // ✨ Está cargando si ya le dimos la URL pero el motor aún no ha decodificado la duración
  const isLoading = source !== null && status.duration === 0;

  // Reseteamos el estado si la URL original cambia
  useEffect(() => {
    setSource(null);
    setShouldAutoPlay(false);
  }, [audioUrl]);

  // Efecto para auto-reproducir justo en el momento en el que el Lazy Load termina de cargar
  useEffect(() => {
    if (shouldAutoPlay && player && status.duration > 0) {
      player.play();
      setShouldAutoPlay(false);
    }
  }, [player, status.duration, shouldAutoPlay]);

  const togglePlayPause = () => {
    if (!audioUrl) return;

    if (!source) {
      // CASO 1: LAZY LOAD - Es la primera vez que pulsa Play
      setSource(audioUrl); // Disparamos la carga del audio
      setShouldAutoPlay(true); // Le decimos que suene en cuanto esté listo
    } else {
      // CASO 2: El audio ya estaba cargado en memoria
      if (isPlaying) {
        player.pause();
      } else {
        // Si el audio llegó al final (con un pequeño margen de 0.5s), lo reiniciamos
        if (status.duration > 0 && status.currentTime >= status.duration - 0.5) {
          player.seekTo(0);
        }
        player.play();
      }
    }
  };

  const seekTo = (millis: number) => {
    if (!player) return;
    player.seekTo(millis / 1000); // Recordamos dividir por 1000 para expo-audio
  };

  return { isPlaying, isLoading, positionMillis, durationMillis, togglePlayPause, seekTo };
}