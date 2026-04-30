import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadEntry, DownloadStatus } from '../services/offlineTypes';
import { isTourAvailableOffline, deleteTour } from '../services/offlineTourService';

export type { DownloadEntry, DownloadStatus };

// ─── Context ──────────────────────────────────────────────────────────────

interface DownloadsContextType {
  downloads: Record<string, DownloadEntry>;
  updateDownload: (tourId: string, patch: Partial<DownloadEntry>) => void;
  removeDownload: (tourId: string) => void;
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

const STORAGE_KEY = '@offline_downloads';

const DEFAULT_ENTRY: DownloadEntry = {
  status: 'idle',
  progress: 0,
  bytesDownloaded: 0,
  totalBytes: 0,
};

// ─── Provider ─────────────────────────────────────────────────────────────

export const DownloadsProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloads, setDownloads] = useState<Record<string, DownloadEntry>>({});

  // Carga el estado persistido al arrancar y limpia entradas inconsistentes.
  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      let saved: Record<string, DownloadEntry>;
      try {
        saved = JSON.parse(raw);
      } catch {
        return;
      }

      // Cualquier descarga en curso cuando la app murió → 'paused'
      for (const id of Object.keys(saved)) {
        if (saved[id].status === 'downloading') saved[id].status = 'paused';
      }

      setDownloads(saved);

      // Limpieza asíncrona en segundo plano (no bloquea el arranque)
      for (const [id, entry] of Object.entries(saved)) {
        if (entry.status === 'completed') {
          // El manifest no existe en disco → descarga incompleta o archivos borrados
          const available = await isTourAvailableOffline(id);
          if (!available) {
            setDownloads((prev) => {
              const next = { ...prev };
              delete next[id];
              AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
        } else if (entry.status === 'error') {
          // Archivos parciales en disco → limpiar para no ocupar espacio
          try {
            await deleteTour(id);
          } catch {}
          setDownloads((prev) => {
            const next = { ...prev };
            delete next[id];
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      }
    };

    load();
  }, []);

  // Persiste solo en cambios de estado relevantes (no en cada tick de progreso)
  const persist = useCallback((state: Record<string, DownloadEntry>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const updateDownload = useCallback(
    (tourId: string, patch: Partial<DownloadEntry>) => {
      setDownloads((prev) => {
        const current = prev[tourId] ?? DEFAULT_ENTRY;
        const next = { ...prev, [tourId]: { ...current, ...patch } };

        // Persiste solo cuando cambia el status o el tamaño total (no en cada byte)
        const shouldPersist =
          patch.status !== undefined || patch.totalBytes !== undefined;
        if (shouldPersist) persist(next);

        return next;
      });
    },
    [persist],
  );

  const removeDownload = useCallback(
    (tourId: string) => {
      setDownloads((prev) => {
        const next = { ...prev };
        delete next[tourId];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return (
    <DownloadsContext.Provider value={{ downloads, updateDownload, removeDownload }}>
      {children}
    </DownloadsContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useDownloads() {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads debe usarse dentro de DownloadsProvider');
  return ctx;
}

// Hook de conveniencia para un tour específico
export function useTourDownload(tourId: string) {
  const { downloads, updateDownload, removeDownload } = useDownloads();
  const entry = downloads[tourId];
  return {
    downloadState: entry,
    isDownloaded: entry?.status === 'completed',
    isDownloading: entry?.status === 'downloading',
    isPaused: entry?.status === 'paused',
    isIdle: !entry || entry.status === 'idle',
    update: (patch: Partial<DownloadEntry>) => updateDownload(tourId, patch),
    remove: () => removeDownload(tourId),
  };
}
