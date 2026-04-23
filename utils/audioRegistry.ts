// utils/audioRegistry.ts
// Singleton que garantiza que solo un reproductor esté activo a la vez.
// Usa un contador de versión para que cada hook pueda limpiar su propio registro
// al desmontarse sin interferir con el reproductor que haya tomado el relevo.

let currentStop: (() => void) | null = null;
let currentVersion = 0;

export function registerActiveAudio(stop: () => void): number {
  if (currentStop) {
    try {
      currentStop();
    } catch {
      // El player nativo ya fue liberado por expo-audio al desmontar el componente.
      // No hace falta hacer nada, solo limpiar la referencia muerta.
    }
  }
  currentStop = stop;
  return ++currentVersion;
}

export function unregisterActiveAudio(version: number) {
  // Solo limpiamos si seguimos siendo el reproductor activo (no otro que haya tomado el relevo)
  if (version === currentVersion) currentStop = null;
}

export function stopActiveAudio() {
  if (currentStop) {
    try { currentStop(); } catch { /* player ya liberado */ }
    currentStop = null;
  }
}
