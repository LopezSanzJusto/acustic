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
  // ---------------------------------------------------------
  // ORDEN 1: Monumento a Beatriz Galindo 
  // Ubicación real: Plaza de la Puerta de los Moros
  // ---------------------------------------------------------
  { latitude: 40.4112, longitude: -3.7116 }, // 1. EXACTO (Ajustado a La Latina real)

  // // ---------------------------------------------------------
  // // ORDEN 2: Mayrit Alcázar Madrid
  // // ---------------------------------------------------------
  { latitude: 40.4140, longitude: -3.7080 }, // Caminando hacia Ópera...
  { latitude: 40.416228, longitude: -3.706381 }, // 2. EXACTO 

  // // ---------------------------------------------------------
  // // ORDEN 3: Calle Toledo
  // // ---------------------------------------------------------
  { latitude: 40.4130, longitude: -3.7075 }, // Bajando...
  { latitude: 40.4116, longitude: -3.7078 }, // 3. EXACTO

  // // ---------------------------------------------------------
  // // ORDEN 4: Plaza de la Paja
  // // ---------------------------------------------------------
  { latitude: 40.4125, longitude: -3.7100 }, // Caminando...
  { latitude: 40.41293, longitude: -3.71163 }, // 4. EXACTO

  // // ---------------------------------------------------------
  // // ORDEN 5: San Andrés
  // // ---------------------------------------------------------
  { latitude: 40.41198, longitude: -3.71101 }, // 5. EXACTO

  // // ---------------------------------------------------------
  // // ORDEN 6: Mercado de la Cebada
  // // ---------------------------------------------------------
  { latitude: 40.4115, longitude: -3.7093 },   // 6. EXACTO

  // // ---------------------------------------------------------
  // // ORDEN 7: Ribera de Curtidores
  // // ---------------------------------------------------------
  { latitude: 40.4080, longitude: -3.7075 }, // Bajando...
  { latitude: 40.4058, longitude: -3.7071 },   // 7. EXACTO

  // // ---------------------------------------------------------
  // // ORDEN 8: Rastro
  // // ---------------------------------------------------------
  { latitude: 40.4086, longitude: -3.7073 },   // 8. EXACTO
];

export const useLocation = (simulate = false) => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // === MODO SIMULACIÓN ===
    if (simulate) {
      console.log("⚠️ MODO SIMULACIÓN ACTIVADO");
      let index = 0;
      setLocation(SIMULATED_PATH[0]); // Establecemos la posición inicial inmediatamente
      
      const interval = setInterval(() => {
        index = (index + 1) % SIMULATED_PATH.length; // Bucle infinito
        const nextPoint = SIMULATED_PATH[index];
        
        console.log(`📍 Simulación paso ${index}:`, nextPoint);
        setLocation(nextPoint);

      }, 4000); // Cambia de posición cada 4 segundos (ajusta esto si va muy rápido/lento)

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