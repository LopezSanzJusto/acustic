// data/points.ts

export interface PointOfInterest {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  audio: string;
  image: string;
  order: number;
  audioDuration?: string; // Ej: "2:34" — se guarda en Firestore en cada punto
}

// NUEVO: Extendemos para manejar el estado local en la app
export interface CustomPoint extends PointOfInterest {
  isHidden?: boolean; 
}