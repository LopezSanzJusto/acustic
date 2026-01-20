//services/proximityService.ts

import { getDistanceInMeters } from "../utils/geo";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export const isWithinRadius = (
  user: Coordinates,
  point: Coordinates,
  radiusMeters: number
): boolean => {
  const distance = getDistanceInMeters(
    user.latitude,
    user.longitude,
    point.latitude,
    point.longitude
  );

  if (__DEV__) {
    console.log(`📏 Distance: ${distance.toFixed(2)} m`);
  }

  return distance <= radiusMeters;
};
