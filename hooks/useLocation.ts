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
  // --- INICIO: LA LATINA ---
  { latitude: 40.4120, longitude: -3.7105 }, // 0. Neutro
  { latitude: 40.4115, longitude: -3.7093 }, // 1. Plaza de la Cebada (ENTRADA)
  { latitude: 40.4116, longitude: -3.7094 }, // 2. Plaza de la Cebada (DENTRO)
  
  { latitude: 40.4110, longitude: -3.7120 }, // 3. Caminando...
  
  { latitude: 40.4103, longitude: -3.7144 }, // 4. San Francisco (ENTRADA)
  { latitude: 40.4104, longitude: -3.7145 }, // 5. San Francisco (DENTRO)
  
  // --- TRAYECTO HACIA VISTILLAS ---
  { latitude: 40.4115, longitude: -3.7135 }, // 6. Caminando hacia el norte...
  { latitude: 40.4125, longitude: -3.7140 }, // 7. Casi llegando...

  // --- NUEVO PUNTO: JARDINES DE LAS VISTILLAS ---
  { latitude: 40.41310, longitude: -3.71415 }, // 8. Vistillas (ENTRADA - Borde del radio)
  { latitude: 40.41315, longitude: -3.71420 }, // 9. Vistillas (CENTRO EXACTO - ¡Debería sonar!)

  // --- VUELTA ---
  { latitude: 40.4128, longitude: -3.7088 }, // 10. Cava Baja (ENTRADA)
  { latitude: 40.4129, longitude: -3.7089 }, // 11. Cava Baja (DENTRO)
  
  { latitude: 40.4135, longitude: -3.7075 }  // 12. Fin
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