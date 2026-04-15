// hooks/useGeoAudioSync.ts

import { useEffect, useMemo, useRef } from 'react';
import { PointOfInterest } from '../data/points';
import { isWithinRadius } from '../services/proximityService';

interface UseGeoAudioSyncProps {
  location: { latitude: number; longitude: number } | null;
  points: PointOfInterest[];
  radius: number;
  isPreloading: boolean;
  pointsLoading: boolean;
  onPointReached: (index: number, point: PointOfInterest) => void;
}

export const useGeoAudioSync = ({
  location,
  points,
  radius,
  isPreloading,
  pointsLoading,
  onPointReached
}: UseGeoAudioSyncProps) => {

  const playedPoints = useRef<Set<string>>(new Set());

  const gpsActivePoint = useMemo(() => {
    if (!location || points.length === 0) return null;

    return (
      points.find((p) =>
        isWithinRadius(
          location,
          { latitude: p.latitude, longitude: p.longitude },
          radius
        )
      ) || null
    );
  }, [location, points, radius]);

  useEffect(() => {
    if (isPreloading || pointsLoading) return;
    if (!gpsActivePoint) return;
    if (playedPoints.current.has(gpsActivePoint.id)) return;

    const index = points.findIndex(p => p.id === gpsActivePoint.id);
    if (index !== -1) {
      playedPoints.current.add(gpsActivePoint.id);
      onPointReached(index, gpsActivePoint);
    }
  }, [gpsActivePoint, isPreloading, pointsLoading, points, onPointReached]);

  return { gpsActivePoint };
};