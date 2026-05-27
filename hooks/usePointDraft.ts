// hooks/usePointDraft.ts
//
// Hook con el estado del editor de una parada concreta.
//   - `updateField` / `updateFields` cambian SOLO el estado local y marcan
//     el draft como "dirty". No persisten — la persistencia es explícita.
//   - `commitFields` aplica el cambio en local Y persiste de inmediato.
//     Pensado para uploads (imagen, audio): cuando el blob ya está en
//     Storage queremos asegurar que el doc del point también referencia
//     ese blob, aunque el creador no llegue a pulsar "Guardar".
//   - `save` persiste el patch acumulado (lo que se cambió con
//     updateField/updateFields). Usar al pulsar el botón Guardar.
//   - `refresh` re-lee el doc desde Firestore. Útil al volver de la
//     pantalla del mapa fullscreen, que persiste las coordenadas por
//     fuera del hook.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPoint,
  updatePoint as updatePointRemote,
} from '@/services/creatorService';
import type { TourPoint, TourPointInput } from '@/types/tour';

export interface UsePointDraftResult {
  point: TourPoint | null;
  loading: boolean;
  /** `true` mientras hay un commit/save en vuelo. */
  saving: boolean;
  /** `true` cuando hay cambios pendientes de `save()`. */
  isDirty: boolean;
  error: Error | null;

  /** Cambia el estado local y marca dirty. NO persiste. */
  updateField: <K extends keyof TourPointInput>(key: K, value: TourPointInput[K]) => void;
  /** Cambia el estado local con varios campos y marca dirty. NO persiste. */
  updateFields: (patch: TourPointInput) => void;
  /** Cambia el estado local y persiste de inmediato (para uploads). */
  commitFields: (patch: TourPointInput) => Promise<void>;
  /** Persiste el patch pendiente acumulado por updateField/updateFields. */
  save: () => Promise<void>;
  /** Recarga el point desde Firestore (descarta el patch local pendiente). */
  refresh: () => Promise<void>;
}

export function usePointDraft(
  tourId: string | null,
  pointId: string | null,
): UsePointDraftResult {
  const [point, setPoint] = useState<TourPoint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Patch acumulado pendiente de persistir (sólo lo que entró por
  // updateField/updateFields, no lo que se persistió por commitFields).
  const dirtyPatchRef = useRef<TourPointInput>({});
  const mountedRef = useRef<boolean>(true);

  // ───────── Carga inicial ─────────
  useEffect(() => {
    mountedRef.current = true;
    if (!tourId || !pointId) {
      setPoint(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const p = await getPoint(tourId, pointId);
        if (!mountedRef.current) return;
        setPoint(p);
      } catch (e: any) {
        if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [tourId, pointId]);

  // ───────── Mutaciones locales (sin persistir) ─────────
  const applyLocalPatch = useCallback((patch: TourPointInput) => {
    setPoint((prev) => (prev ? { ...prev, ...patch } : prev));
    dirtyPatchRef.current = { ...dirtyPatchRef.current, ...patch };
    setIsDirty(true);
  }, []);

  const updateField = useCallback(
    <K extends keyof TourPointInput>(key: K, value: TourPointInput[K]) => {
      applyLocalPatch({ [key]: value } as TourPointInput);
    },
    [applyLocalPatch],
  );

  const updateFields = useCallback((patch: TourPointInput) => {
    applyLocalPatch(patch);
  }, [applyLocalPatch]);

  // ───────── Persistencia inmediata (para uploads) ─────────
  const commitFields = useCallback(
    async (patch: TourPointInput): Promise<void> => {
      if (!tourId || !pointId) return;
      // Aplica local primero para que la UI refleje el cambio sin esperar
      // a la confirmación de Firestore.
      setPoint((prev) => (prev ? { ...prev, ...patch } : prev));
      setSaving(true);
      try {
        await updatePointRemote(tourId, pointId, patch);
      } catch (e: any) {
        if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
        throw e;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [tourId, pointId],
  );

  // ───────── Save explícito (botón Guardar) ─────────
  const save = useCallback(async (): Promise<void> => {
    if (!tourId || !pointId) return;
    const patch = dirtyPatchRef.current;
    if (Object.keys(patch).length === 0) {
      // Nada pendiente: salida temprana, mantenemos dirty=false.
      return;
    }
    setSaving(true);
    try {
      await updatePointRemote(tourId, pointId, patch);
      dirtyPatchRef.current = {};
      if (mountedRef.current) setIsDirty(false);
    } catch (e: any) {
      if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [tourId, pointId]);

  // ───────── Refresh desde Firestore ─────────
  const refresh = useCallback(async (): Promise<void> => {
    if (!tourId || !pointId) return;
    try {
      const fresh = await getPoint(tourId, pointId);
      if (!mountedRef.current) return;
      // Aplicamos el patch dirty encima de lo recién leído, para no perder
      // cambios locales aún sin guardar (caso: el creador escribió en el
      // nombre y abrió el mapa fullscreen).
      setPoint({ ...fresh, ...dirtyPatchRef.current });
    } catch (e: any) {
      if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [tourId, pointId]);

  return {
    point,
    loading,
    saving,
    isDirty,
    error,
    updateField,
    updateFields,
    commitFields,
    save,
    refresh,
  };
}
