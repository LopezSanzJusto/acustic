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
    // 🌍 SIMULACIÓN WEB (Entorno de pruebas para Madrid - La Latina)
    if (simulateWeb && typeof window !== "undefined") {
      let step = 0;
      let interval: any;

      const path: Coords[] = [
        { latitude: 40.4120, longitude: -3.7105 }, // 0. Neutro (Plaza del Humilladero)
        
        { latitude: 40.4115, longitude: -3.7093 }, // 1. POI 1: Plaza de la Cebada (ENTRADA) [cite: 25]
        { latitude: 40.4116, longitude: -3.7094 }, // 2. POI 1: Dentro del radio
        
        { latitude: 40.4110, longitude: -3.7120 }, // 3. Neutro (Caminando hacia San Francisco)
        
        { latitude: 40.4103, longitude: -3.7144 }, // 4. POI 2: San Francisco el Grande (ENTRADA) [cite: 14]
        { latitude: 40.4104, longitude: -3.7145 }, // 5. POI 2: Dentro del radio
        
        { latitude: 40.4115, longitude: -3.7110 }, // 6. Neutro (Volviendo hacia Cava Baja)
        
        { latitude: 40.4128, longitude: -3.7088 }, // 7. POI 3: Calle Cava Baja (ENTRADA) [cite: 14]
        { latitude: 40.4129, longitude: -3.7089 }, // 8. POI 3: Dentro del radio
        
        { latitude: 40.4135, longitude: -3.7075 }  // 9. Neutro (Fin del tour)
      ];

      setLocation(path[0]);

      const startTimeout = setTimeout(() => {
        console.log("🚀 Iniciando movimiento simulado por La Latina...");
        
        interval = setInterval(() => {
          step = (step + 1) % path.length;
          console.log(`📍 Paso ${step} - Posición: ${path[step].latitude}, ${path[step].longitude}`);
          setLocation(path[step]);
        }, 8000); // 8 segundos por parada para dar tiempo a procesar el cambio de audio [cite: 25]
      }, 2000);

      return () => {
        clearTimeout(startTimeout);
        if (interval) clearInterval(interval);
      };
    }

    // 📱 DISPOSITIVO REAL
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

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [simulateWeb]);

  return { location, errorMsg };
};