// hooks/useCustomRoute.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CustomPoint, PointOfInterest } from '../data/points';

interface RouteContextProps {
  customPoints: CustomPoint[];
  activeRoutePoints: CustomPoint[];
  setInitialPoints: (points: PointOfInterest[]) => void;
  togglePointVisibility: (id: string) => void;
  reorderPoints: (fromIndex: number, toIndex: number) => void; // ¡Listo para el futuro!
}

const RouteContext = createContext<RouteContextProps | undefined>(undefined);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [customPoints, setCustomPoints] = useState<CustomPoint[]>([]);

  // 1. Inicializa los puntos desde Firebase
  const setInitialPoints = useCallback((points: PointOfInterest[]) => {
    // Solo inicializamos si customPoints está vacío para no sobreescribir la edición del usuario
    if (customPoints.length === 0 && points.length > 0) {
      // Ordenamos por defecto basándonos en Firebase y añadimos isHidden
      const sorted = [...points].sort((a, b) => (a.order || 0) - (b.order || 0));
      setCustomPoints(sorted.map(p => ({ ...p, isHidden: false })));
    }
  }, [customPoints.length]);

  // 2. Alterna el estado de visibilidad
  const togglePointVisibility = useCallback((id: string) => {
    setCustomPoints(prev => 
      prev.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p)
    );
  }, []);

  // 3. Preparado para el futuro Drag & Drop
  const reorderPoints = useCallback((fromIndex: number, toIndex: number) => {
    setCustomPoints(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  // LA MAGIA ESTÁ AQUÍ: Filtramos los ocultos y recalculamos el 'order'
  const activeRoutePoints = useMemo(() => {
    return customPoints
      .filter(p => !p.isHidden)
      .map((p, index) => ({
         ...p,
         order: index + 1 // El mapa y el audio ahora verán esto como 1, 2, 3 siempre.
      }));
  }, [customPoints]);

  return (
    <RouteContext.Provider value={{ customPoints, activeRoutePoints, setInitialPoints, togglePointVisibility, reorderPoints }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useCustomRoute = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useCustomRoute debe usarse dentro de un RouteProvider");
  return context;
};