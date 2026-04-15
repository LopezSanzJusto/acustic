// expo-notifications no es compatible con Expo Go desde SDK 53.
// Estas funciones son no-op hasta que se use un development build.
// Para activar notificaciones: npx expo install expo-notifications
// y descomentar la implementación real.

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function notifyPointReached(_pointName: string): Promise<void> {
  // no-op en Expo Go
}
