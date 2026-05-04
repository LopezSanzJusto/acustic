// hooks/useLocation.ts
import { useState, useEffect } from "react";
import * as Location from "expo-location";

// Definimos el tipo aquí para no depender de otros archivos
type Coords = {
  latitude: number;
  longitude: number;
};

// ✅ TU RUTA HARDCODEADA (Añade o modifica puntos aquí según necesites)
const SIMULATED_PATH: Coords[] = [
  { latitude: 40.4113, longitude: -3.7088 }, // 1. Monumento a Beatriz Galindo
  { latitude: 40.4143, longitude: -3.7133 }, // 2. Mayrit Alcázar Madrid
  { latitude: 40.4130, longitude: -3.7110 }, // intermedio
  { latitude: 40.4116, longitude: -3.7078 }, // 3. Calle Toledo
  { latitude: 40.4122, longitude: -3.7097 }, // 4. Plaza de la Paja
  { latitude: 40.41198, longitude: -3.71101 }, // 5. San Andrés / San Isidro
  { latitude: 40.4115, longitude: -3.7093 }, // 6. Mercado de la Cebada
  { latitude: 40.4080, longitude: -3.7075 }, // intermedio
  { latitude: 40.4058, longitude: -3.7071 }, // 7. Ribera de Curtidores
  { latitude: 40.4072, longitude: -3.7073 }, // 8. El Rastro
];

export const useLocation = (simulate = false) => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // === MODO SIMULACIÓN ===
    if (simulate) {
      let index = 0;
      setLocation(SIMULATED_PATH[0]);

      const interval = setInterval(() => {
        index = (index + 1) % SIMULATED_PATH.length;
        setLocation(SIMULATED_PATH[index]);
      }, 15000);

      return () => clearInterval(interval);
    }

    // === MODO GPS REAL (Tu código original) ===
    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setErrorMsg("Activa el GPS de tu móvil");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permiso denegado");
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            setErrorMsg(null);
          }
        );
      } catch (error) {
        console.log("Error obteniendo ubicación:", error);
        setErrorMsg("Buscando señal GPS...");
      }
    };

    startLocationTracking();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [simulate]);

  return { location, errorMsg };
};