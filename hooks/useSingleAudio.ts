// hooks/useSingleAudio.ts
import { useRef } from 'react';
import TrackPlayer, { usePlaybackState, useProgress, useActiveTrack, State } from 'react-native-track-player';

// ID de la instancia que "posee" el player actualmente (módulo-level singleton)
let activeInstanceId: string | null = null;

export function useSingleAudio(audioUrl?: string) {
  // ID único por instancia del hook (persiste entre renders del mismo componente)
  const instanceId = useRef<string>(Math.random().toString(36).slice(2)).current;

  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress();

  // Es owner sólo si este componente fue el último en iniciar la reproducción
  const isOwner = !!audioUrl && activeTrack?.url === audioUrl && activeInstanceId === instanceId;
  const isPlaying = isOwner && playbackState.state === State.Playing;
  const isLoading = isOwner && (playbackState.state === State.Loading || playbackState.state === State.Buffering);
  const positionMillis = isOwner ? progress.position * 1000 : 0;
  const durationMillis = isOwner ? progress.duration * 1000 : 0;

  const togglePlayPause = async () => {
    if (!audioUrl) return;

    if (!isOwner) {
      // Reclamar propiedad del player para esta instancia
      activeInstanceId = instanceId;
      await TrackPlayer.reset();
      await TrackPlayer.setRate(1.0);
      await TrackPlayer.add({ url: audioUrl, title: '', artist: 'Acustic' });
      await TrackPlayer.play();
    } else {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        if (progress.duration > 0 && progress.position >= progress.duration - 0.5) {
          await TrackPlayer.seekTo(0);
        }
        await TrackPlayer.play();
      }
    }
  };

  const seekTo = async (millis: number) => {
    if (isOwner) await TrackPlayer.seekTo(millis / 1000);
  };

  return { isPlaying, isLoading, positionMillis, durationMillis, togglePlayPause, seekTo };
}
