// hooks/useCustomRoute.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CustomPoint, PointOfInterest } from '../data/points';

// 1. El estado ahora es un Diccionario: Record<ID_DEL_TOUR, PUNTOS>
interface RouteContextProps {
  routes: Record<string, CustomPoint[]>;
  setRoutePoints: (tourId: string, points: CustomPoint[]) => void;
}

const RouteContext = createContext<RouteContextProps | undefined>(undefined);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [routes, setRoutes] = useState<Record<string, CustomPoint[]>>({});

  const setRoutePoints = useCallback((tourId: string, points: CustomPoint[]) => {
    setRoutes(prev => ({ ...prev, [tourId]: points }));
  }, []);

  return (
    <RouteContext.Provider value={{ routes, setRoutePoints }}>
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
    if (customPoints.length === 0 && points.length > 0) {
      const sorted = [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
      context.setRoutePoints(tourId, sorted.map(p => ({ ...p, isHidden: false })));
    }
  }, [customPoints.length, tourId, context]); // ✅ CORREGIDO: Quitamos 'points' de aquí

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