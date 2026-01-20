//data/points.ts
export type PointOfInterest = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  audio: any;
};

export const POINTS: PointOfInterest[] = [
  {
    id: 1,
    name: "Ascensor A",
    latitude: 40.416775,
    longitude: -3.70379,
    audio: require("../assets/audioA.mp3"),
  },
  {
    id: 2,
    name: "Ascensor B",
    latitude: 40.4175,
    longitude: -3.7020,
    audio: require("../assets/audioB.mp3"),
  },
];
