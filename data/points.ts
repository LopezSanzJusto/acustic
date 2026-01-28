// data/points.ts

export interface PointOfInterest {
  id: string;          // En Firestore los IDs suelen ser strings
  name: string;        // Ej: "Calle de la Cava Baja"
  latitude: number;    // Ej: 40.4128
  longitude: number;   // Ej: -3.7088
  audio: string;    // URL de Cloudinary para el audio
  image: string;    // URL de la imagen del punto específico
  order: number;       // El orden en el que aparece en la ruta (1, 2, 3...)
}