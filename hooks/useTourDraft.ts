// hooks/useTourDraft.ts
//
// Hook con el estado completo del draft del panel de creador:
//   - Carga inicial (recupera draft existente o crea uno nuevo).
//   - Estado local optimista para que la UI vaya fluida al teclear.
//   - Autosave con debounce (~700ms) acumulando los campos cambiados en un
//     único `updateDoc` por tanda.
//   - `publish` y `discardAndRestart` también esperan al flush antes de actuar.
//
// IMPORTANTE: pensado para instanciarse una sola vez (dentro del Provider
// del CreatorContext). Si varias pantallas lo llaman por separado se
// duplican estados y los autosaves se pisan.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  findActiveDraft,
  getOrCreateActiveDraft,
  updateDraft as updateDraftRemote,
  discardDraft,
  publishTour,
  listTourPoints,
  createEmptyPoint,
  deletePoint as deletePointRemote,
  reorderPoints as reorderPointsRemote,
} from '@/services/creatorService';
import type { TourDraft, TourDraftInput, TourPoint } from '@/types/tour';

const AUTOSAVE_DEBOUNCE_MS = 700;

export interface UseTourDraftResult {
  draft: TourDraft | null;
  points: TourPoint[];
  /** `true` durante la carga inicial. No vuelve a true después. */
  loading: boolean;
  /** `true` mientras hay una escritura en vuelo (o pendiente de debounce). */
  saving: boolean;
  error: Error | null;

  /** Aplica un cambio en local de inmediato y agenda autosave. */
  updateField: <K extends keyof TourDraftInput>(key: K, value: TourDraftInput[K]) => void;
  /** Aplica múltiples campos a la vez (ej. cuando termina una subida con
   *  url + storagePath + duration). */
  updateFields: (patch: TourDraftInput) => void;
  /** Fuerza el guardado pendiente ya (sin esperar al debounce). */
  flushSave: () => Promise<void>;

  /** Recarga la lista de points desde Firestore (útil tras volver del editor). */
  refreshPoints: () => Promise<void>;

  /** Crea un point vacío al final de la lista y lo devuelve. El consumidor
   *  decide si navegar al editor con el id devuelto. */
  addPoint: () => Promise<TourPoint>;
  /** Borra un point del draft (incluye sus blobs). */
  removePoint: (pointId: string) => Promise<void>;
  /** Persiste un nuevo orden de points. Recibe la lista ya reordenada. */
  persistPointsOrder: (ordered: TourPoint[]) => Promise<void>;

  /** Descarta el draft actual (con sus blobs) y crea uno nuevo vacío. */
  discardAndRestart: () => Promise<void>;
  /** Publica el draft. Lanza si la validación falla. */
  publish: () => Promise<void>;
}

export function useTourDraft(creatorId: string | null): UseTourDraftResult {
  const [draft, setDraft] = useState<TourDraft | null>(null);
  const [points, setPoints] = useState<TourPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Patch acumulado pendiente de enviar (se vacía tras cada flush).
  const pendingPatchRef = useRef<TourDraftInput>({});
  // Timer del debounce.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Para evitar setState tras unmount.
  const mountedRef = useRef<boolean>(true);
  // Última promesa de guardado en vuelo: permite que flush/publish/discard la esperen.
  const inFlightSaveRef = useRef<Promise<void> | null>(null);

  // ───────── Carga inicial ─────────
  useEffect(() => {
    mountedRef.current = true;
    if (!creatorId) {
      setDraft(null);
      setPoints([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const d = await getOrCreateActiveDraft(creatorId);
        if (!mountedRef.current) return;
        setDraft(d);
        // Si el draft tenía points (caso de continuar), los cargamos.
        const ps = await listTourPoints(d.id);
        if (!mountedRef.current) return;
        setPoints(ps);
      } catch (e: any) {
        if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [creatorId]);

  // ───────── Autosave ─────────
  const performSave = useCallback(async (): Promise<void> => {
    const tourId = draft?.id;
    const patch = pendingPatchRef.current;
    if (!tourId || Object.keys(patch).length === 0) return;

    pendingPatchRef.current = {};
    try {
      await updateDraftRemote(tourId, patch);
    } catch (e: any) {
      if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
      // Reinyectamos el patch para que el siguiente flush vuelva a intentarlo.
      pendingPatchRef.current = { ...patch, ...pendingPatchRef.current };
      throw e;
    }
  }, [draft?.id]);

  const flushSave = useCallback(async (): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Si ya hay una escritura en vuelo, espérala antes de la siguiente.
    if (inFlightSaveRef.current) {
      try { await inFlightSaveRef.current; } catch {}
    }
    const p = performSave();
    inFlightSaveRef.current = p.finally(() => {
      if (inFlightSaveRef.current === p) inFlightSaveRef.current = null;
      if (mountedRef.current) setSaving(Object.keys(pendingPatchRef.current).length > 0);
    });
    await p;
  }, [performSave]);

  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaving(true);
    debounceTimerRef.current = setTimeout(() => {
      flushSave().catch(() => { /* error ya capturado en performSave */ });
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const applyLocalPatch = useCallback((patch: TourDraftInput) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    scheduleAutosave();
  }, [scheduleAutosave]);

  const updateField = useCallback(<K extends keyof TourDraftInput>(key: K, value: TourDraftInput[K]) => {
    applyLocalPatch({ [key]: value } as TourDraftInput);
  }, [applyLocalPatch]);

  const updateFields = useCallback((patch: TourDraftInput) => {
    applyLocalPatch(patch);
  }, [applyLocalPatch]);

  // ───────── Points ─────────
  const refreshPoints = useCallback(async () => {
    if (!draft?.id) return;
    const ps = await listTourPoints(draft.id);
    if (mountedRef.current) setPoints(ps);
  }, [draft?.id]);

  // ───────── Mutaciones de points ─────────
  const addPoint = useCallback(async (): Promise<TourPoint> => {
    if (!draft?.id || !creatorId) {
      throw new Error('addPoint: draft o creatorId no disponibles');
    }
    const nextOrder = points.length;
    const created = await createEmptyPoint(draft.id, creatorId, nextOrder);
    if (mountedRef.current) {
      // Optimismo local: lo añadimos al final sin esperar a refreshPoints.
      setPoints((prev) => [...prev, created]);
    }
    return created;
  }, [draft?.id, creatorId, points.length]);

  const removePoint = useCallback(async (pointId: string): Promise<void> => {
    if (!draft?.id) return;
    const target = points.find((p) => p.id === pointId);
    if (!target) return;
    // Optimismo local: lo quitamos de la lista antes de esperar a Firestore.
    if (mountedRef.current) {
      setPoints((prev) => prev.filter((p) => p.id !== pointId));
    }
    try {
      await deletePointRemote(draft.id, target);
    } catch (e) {
      // Si falla, recargamos para no quedar inconsistentes.
      await refreshPoints();
      throw e;
    }
  }, [draft?.id, points, refreshPoints]);

  const persistPointsOrder = useCallback(async (ordered: TourPoint[]): Promise<void> => {
    if (!draft?.id || ordered.length === 0) return;
    // Optimismo local: actualizamos el campo `order` en memoria.
    const reindexed = ordered.map((p, i) => ({ ...p, order: i }));
    if (mountedRef.current) setPoints(reindexed);
    try {
      await reorderPointsRemote(draft.id, ordered.map((p) => p.id));
    } catch (e) {
      await refreshPoints();
      throw e;
    }
  }, [draft?.id, refreshPoints]);

  // ───────── Descartar y reiniciar ─────────
  const discardAndRestart = useCallback(async () => {
    if (!draft || !creatorId) return;
    // Cancela autosaves pendientes; no queremos resucitar el draft tras borrarlo.
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingPatchRef.current = {};

    setLoading(true);
    try {
      await discardDraft(draft);
      const fresh = await getOrCreateActiveDraft(creatorId);
      if (!mountedRef.current) return;
      setDraft(fresh);
      setPoints([]);
      setError(null);
    } catch (e: any) {
      if (mountedRef.current) setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [draft, creatorId]);

  // ───────── Publicar ─────────
  const publish = useCallback(async () => {
    if (!draft) throw new Error('No hay draft cargado');
    // Asegura que los últimos cambios estén persistidos antes de validar.
    await flushSave();
    await publishTour(draft.id);
    // Tras publicar el draft deja de existir como tal. Refrescamos a otro
    // draft (vacío) para que el wizard quede en estado neutro si reaparece.
    if (!creatorId) return;
    const next = await findActiveDraft(creatorId);
    if (!mountedRef.current) return;
    setDraft(next); // null si no hay otro draft
    setPoints([]);
  }, [draft, creatorId, flushSave]);

  // ───────── Cleanup al desmontar ─────────
  useEffect(() => {
    return () => {
      // Si quedan cambios pendientes, intenta flush silencioso al desmontar
      // (best effort: no podemos await aquí).
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (Object.keys(pendingPatchRef.current).length > 0 && draft?.id) {
        // Promise huérfana, intencional: no podemos await en cleanup síncrono.
        updateDraftRemote(draft.id, pendingPatchRef.current).catch(() => {});
        pendingPatchRef.current = {};
      }
    };
  }, [draft?.id]);

  return {
    draft,
    points,
    loading,
    saving,
    error,
    updateField,
    updateFields,
    flushSave,
    refreshPoints,
    addPoint,
    removePoint,
    persistPointsOrder,
    discardAndRestart,
    publish,
  };
}
