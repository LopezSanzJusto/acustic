// hooks/useCustomRoute.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from '../services/firebaseConfig';
import { CustomPoint, PointOfInterest } from '../data/points';

const STORAGE_PREFIX = '@custom_routes:';
const ANON_KEY = `${STORAGE_PREFIX}anon`;
const buildKey = (uid: string | null) => (uid ? `${STORAGE_PREFIX}${uid}` : ANON_KEY);

interface RouteContextProps {
  routes: Record<string, CustomPoint[]>;
  loaded: boolean;
  setRoutePoints: (tourId: string, points: CustomPoint[]) => void;
}

const RouteContext = createContext<RouteContextProps | undefined>(undefined);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [routes, setRoutes] = useState<Record<string, CustomPoint[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [storageKey, setStorageKey] = useState<string>(ANON_KEY);

  // Escuchamos cambios de sesión: cada usuario tiene su propio "cajón" en AsyncStorage.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const nextKey = buildKey(user?.uid ?? null);
      setStorageKey(nextKey);
      setLoaded(false);
      // Reseteamos en memoria mientras cargamos los datos del nuevo usuario
      setRoutes({});

      AsyncStorage.getItem(nextKey)
        .then(raw => {
          if (raw) {
            try { setRoutes(JSON.parse(raw)); } catch {}
          }
        })
        .finally(() => setLoaded(true));
    });
    return unsubscribe;
  }, []);

  const setRoutePoints = useCallback((tourId: string, points: CustomPoint[]) => {
    setRoutes(prev => {
      const next = { ...prev, [tourId]: points };
      AsyncStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  return (
    <RouteContext.Provider value={{ routes, loaded, setRoutePoints }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useCustomRoute = (tourId: string) => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useCustomRoute debe usarse dentro de un RouteProvider");

  const customPoints = context.routes[tourId] || [];

  const setInitialPoints = useCallback((points: PointOfInterest[]) => {
    if (!context.loaded || points.length === 0) return;

    const sorted = [...points].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (customPoints.length === 0) {
      context.setRoutePoints(tourId, sorted.map(p => ({ ...p, isHidden: false })));
      return;
    }

    // Sincroniza solo si algo cambió realmente — evita bucle infinito
    const freshById = new Map(sorted.map(p => [p.id, p]));
    const hasChanges = customPoints.some(cp => {
      const fresh = freshById.get(cp.id);
      if (!fresh) return false;
      return (
        cp.latitude !== fresh.latitude ||
        cp.longitude !== fresh.longitude ||
        cp.audio !== fresh.audio ||
        cp.image !== fresh.image ||
        cp.name !== fresh.name
      );
    });

    if (!hasChanges) return;

    const synced = customPoints.map(cp => {
      const fresh = freshById.get(cp.id);
      if (!fresh) return cp;
      return { ...cp, latitude: fresh.latitude, longitude: fresh.longitude, audio: fresh.audio, image: fresh.image, name: fresh.name };
    });
    context.setRoutePoints(tourId, synced);
  }, [context.loaded, customPoints, tourId, context]);

  const togglePointVisibility = useCallback((id: string) => {
    const updated = customPoints.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p);
    context.setRoutePoints(tourId, updated);
  }, [customPoints, tourId, context]);

  const reorderPoints = useCallback((fromIndex: number, toIndex: number) => {
    const result = Array.from(customPoints);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    context.setRoutePoints(tourId, result);
  }, [customPoints, tourId, context]);

  const activeRoutePoints = useMemo(() => {
    return customPoints
      .filter(p => !p.isHidden)
      .map((p, index) => ({
         ...p,
         order: index + 1
      }));
  }, [customPoints]);

  return { customPoints, activeRoutePoints, setInitialPoints, togglePointVisibility, reorderPoints };
};
