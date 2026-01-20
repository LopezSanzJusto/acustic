// hooks/useLocation.ts

import { useState, useEffect } from "react";
import * as Location from "expo-location";

type Coords = {
  latitude: number;
  longitude: number;
};

export const useLocation = (simulateWeb = false) => {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 🌍 SIMULACIÓN WEB (Entorno de pruebas)
    if (simulateWeb && typeof window !== "undefined") {
      let step = 0;
      // Usamos 'any' o 'NodeJS.Timeout | number' para evitar el conflicto de tipos
      let interval: any; 

      const path: Coords[] = [
        { latitude: 40.4173, longitude: -3.7031 }, // Punto inicial (fuera de todo)

        { latitude: 40.4167, longitude: -3.7037 }, // PUNTO A
        { latitude: 40.4167, longitude: -3.7035 }, // Repetimos para asegurar detección
        
        { latitude: 40.4173, longitude: -3.7031 }, // Punto intermedio (Camino a B)

        { latitude: 40.41755, longitude: -3.7023 }, // PUNTO B
        { latitude: 40.4175, longitude: -3.7017 }, // Repetimos para asegurar detección
        
        { latitude: 40.4170, longitude: -3.7035 }, // Punto intermedio (Camino a C)

        { latitude: 40.41602, longitude: -3.70454 }, // PUNTO C
        { latitude: 40.41607, longitude: -3.70448 }  // Repetimos para asegurar detección
      ];

      setLocation(path[0]);

      const startTimeout = setTimeout(() => {
        console.log("🚀 Iniciando movimiento simulado...");
        
        interval = setInterval(() => {
          step = (step + 1) % path.length;
          console.log(`📍 Posición simulada [Paso ${step}]:`, path[step]);
          setLocation(path[step]);
        }, 5000); 
      }, 2000);

      return () => {
        clearTimeout(startTimeout);
        if (interval) clearInterval(interval);
      };
    }

    // 📱 DISPOSITIVO REAL (Geolocalización estándar)
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErrorMsg("Permiso de ubicación denegado");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Guardamos la suscripción para poder limpiarla [cite: 28]
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, 
          },
          (locUpdate) => {
            setLocation({
              latitude: locUpdate.coords.latitude,
              longitude: locUpdate.coords.longitude,
            });
          }
        );
      } catch (e) {
        console.error("Error en geolocalización:", e);
        setErrorMsg("Error obteniendo ubicación");
      }
    })();

    // Limpieza de la suscripción al desmontar el hook
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [simulateWeb]);

  return { location, errorMsg };
};