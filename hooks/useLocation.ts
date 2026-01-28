// hooks/useLocation
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
    // Si estamos en modo simulación (para pruebas en casa), ignoramos el GPS real
    if (simulateWeb) {
      // ... (Aquí iría tu lógica de simulación antigua si la quieres conservar)
      return;
    }

    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        // 1. Verificar si los servicios de ubicación están activados en el móvil
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setErrorMsg("Activa el GPS de tu móvil");
          return;
        }

        // 2. Pedir permisos
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permiso denegado");
          return;
        }

        // 3. ESTRATEGIA "SALVAVIDAS": Obtener la última ubicación conocida
        // Esto es instantáneo y no falla en interiores (aunque sea de hace 1 hora)
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }

        // 4. SUSCRIPCIÓN EN TIEMPO REAL
        // Usamos 'Balanced' en lugar de 'High' para que funcione dentro de clase con Wifi/Antenas
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced, 
            distanceInterval: 5, // Actualizar cada 5 metros
            timeInterval: 2000,  // O cada 2 segundos mínimo
          },
          (newLocation) => {
            // Cuando el GPS "revive", actualizamos la posición
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            setErrorMsg(null); // Borramos errores si ya funciona
          }
        );

      } catch (error) {
        console.log("Error obteniendo ubicación:", error);
        // No bloqueamos la app, solo mostramos aviso discreto
        setErrorMsg("Buscando señal GPS...");
      }
    };

    startLocationTracking();

    // Limpieza al desmontar
    return () => {
      if (subscription) subscription.remove();
    };
  }, [simulateWeb]);

  return { location, errorMsg };
};