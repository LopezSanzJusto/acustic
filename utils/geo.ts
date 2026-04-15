//utils/geo.ts

export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000; // metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateRealTimeProgress(
  points: any[], 
  currentIndex: number, 
  currentLocation: { latitude: number; longitude: number } | null
) {
  if (!points || points.length < 2) {
    return { totalMeters: 0, traveledMeters: 0, percentage: 0 };
  }

  let totalMeters = 0;
  let traveledMeters = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
      // Distancia total de este segmento
      const dist = getDistanceInMeters(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      totalMeters += dist;
      
      if (i < currentIndex) {
        // 1. Tramos ya completados al 100%
        traveledMeters += dist;
      } else if (i === currentIndex && currentLocation) {
        // 2. Tramo actual en progreso: Calculamos la distancia desde el último punto 
        // hasta donde está el usuario parado ahora mismo.
        const distToUser = getDistanceInMeters(
          p1.latitude, p1.longitude, 
          currentLocation.latitude, currentLocation.longitude
        );
        
        // Usamos Math.min para evitar que si el usuario se desvía de la ruta, 
        // sume más metros de los que tiene el tramo realmente.
        traveledMeters += Math.min(distToUser, dist);
      }
    }
  }

  const percentage = totalMeters > 0 ? (traveledMeters / totalMeters) * 100 : 0;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  return { totalMeters, traveledMeters, percentage: safePercentage };
}