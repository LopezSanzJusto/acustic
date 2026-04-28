// hooks/useSingleAudio.ts
import TrackPlayer, { usePlaybackState, useProgress, useActiveTrack, State } from 'react-native-track-player';

export function useSingleAudio(audioUrl?: string) {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress();

  const isOwner = !!audioUrl && activeTrack?.url === audioUrl;
  const isPlaying = isOwner && playbackState.state === State.Playing;
  const isLoading = isOwner && (playbackState.state === State.Loading || playbackState.state === State.Buffering);
  const positionMillis = isOwner ? progress.position * 1000 : 0;
  const durationMillis = isOwner ? progress.duration * 1000 : 0;

  const togglePlayPause = async () => {
    if (!audioUrl) return;

    if (!isOwner) {
      await TrackPlayer.reset();
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
