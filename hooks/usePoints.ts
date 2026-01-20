// hooks/usePoints.ts

import { useState, useEffect } from "react";
import { POINTS, PointOfInterest } from "../data/points";
import { isWithinRadius } from "../services/proximityService";

type Coords = {
  latitude: number;
  longitude: number;
};

export function usePoints(
  userLocation: Coords | null,
  radius: number = 30
) {
  const [activePoint, setActivePoint] =
    useState<PointOfInterest | null>(null);

  const [visitedPoints, setVisitedPoints] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!userLocation) return;

    for (const point of POINTS) {
      const inside = isWithinRadius(
        userLocation,
        {
          latitude: point.latitude,
          longitude: point.longitude,
        },
        radius
      );

      if (inside) {
        setActivePoint(point);
        setVisitedPoints((prev) => new Set(prev).add(point.id));
        return;
      }
    }

    setActivePoint(null);
  }, [userLocation, radius]);

  return {
    points: POINTS,
    activePoint,
    visitedPoints,
  };
}
