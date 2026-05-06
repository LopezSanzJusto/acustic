// hooks/useAudio.ts

import { useState, useEffect } from 'react';
import TrackPlayer, { usePlaybackState, useProgress, State } from 'react-native-track-player';
import { PointOfInterest } from '../data/points';

export function useAudio(points: PointOfInterest[], autoSelectFirst: boolean = false) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const playbackState = usePlaybackState();
  const progress = useProgress();

  const activePoint = activePointIndex !== null ? points[activePointIndex] : null;
  const audioUri = activePoint?.audio || null;

  const isPlaying = playbackState.state === State.Playing;
  const isPreloading = playbackState.state === State.Loading || playbackState.state === State.Buffering;
  const positionMillis = progress.position * 1000;
  const durationMillis = progress.duration * 1000;

  useEffect(() => {
    if (autoSelectFirst && points && points.length > 0 && activePointIndex === null) {
      setActivePointIndex(0);
    }
  }, [points, activePointIndex, autoSelectFirst]);

  useEffect(() => {
    if (!audioUri) return;
    const load = async () => {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          url: audioUri,
          title: activePoint?.name ?? '',
          artist: 'Acustic',
          artwork: activePoint?.image ?? undefined,
        });
        await TrackPlayer.setRate(playbackRate);
        await TrackPlayer.play();
      } catch (e) {
        console.error('[useAudio] TrackPlayer error:', e);
      }
    };
    load();
  }, [audioUri]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const seekTo = async (millis: number) => {
    await TrackPlayer.seekTo(millis / 1000);
  };

  const skipBy = async (millis: number) => {
    const newPos = Math.max(0, Math.min(positionMillis + millis, durationMillis));
    await TrackPlayer.seekTo(newPos / 1000);
  };

  const toggleSpeed = async () => {
    let newRate = 1.0;
    if (playbackRate === 1.0) newRate = 1.25;
    else if (playbackRate === 1.25) newRate = 1.5;
    else if (playbackRate === 1.5) newRate = 2.0;
    setPlaybackRate(newRate);
    await TrackPlayer.setRate(newRate);
  };

  const playNext = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex + 1) % points.length);
  };

  const playPrevious = () => {
    if (activePointIndex === null || points.length === 0) return;
    setActivePointIndex((activePointIndex - 1 + points.length) % points.length);
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
