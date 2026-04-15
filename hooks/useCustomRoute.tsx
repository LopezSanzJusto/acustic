// hooks/useCustomRoute.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomPoint, PointOfInterest } from '../data/points';

const STORAGE_KEY = '@custom_routes';

interface RouteContextProps {
  routes: Record<string, CustomPoint[]>;
  loaded: boolean;
  setRoutePoints: (tourId: string, points: CustomPoint[]) => void;
}

const RouteContext = createContext<RouteContextProps | undefined>(undefined);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [routes, setRoutes] = useState<Record<string, CustomPoint[]>>({});
  const [loaded, setLoaded] = useState(false);

  // Carga desde AsyncStorage al arrancar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setRoutes(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const setRoutePoints = useCallback((tourId: string, points: CustomPoint[]) => {
    setRoutes(prev => {
      const next = { ...prev, [tourId]: points };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <RouteContext.Provider value={{ routes, loaded, setRoutePoints }}>
      {children}
    </RouteContext.Provider>
  );
};

// 2. El hook AHORA EXIGE un tourId para saber de qué cajón sacar los datos
export const useCustomRoute = (tourId: string) => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useCustomRoute debe usarse dentro de un RouteProvider");

  // Extraemos SOLO los puntos de ESTA audioguía específica
  const customPoints = context.routes[tourId] || [];

  const setInitialPoints = useCallback((points: PointOfInterest[]) => {
    // Solo inicializa si AsyncStorage ya cargó y no hay datos guardados para este tour
    if (context.loaded && customPoints.length === 0 && points.length > 0) {
      const sorted = [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
      context.setRoutePoints(tourId, sorted.map(p => ({ ...p, isHidden: false })));
    }
  }, [context.loaded, customPoints.length, tourId, context]);

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