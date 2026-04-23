# Acustic

Aplicación móvil de audioguías turísticas. Descubre rutas, escucha audios en puntos de interés y sigue recorridos en un mapa interactivo.

---

## Requisitos previos

- Node.js 18+
- npm 9+
- Para Android: Android Studio con un emulador configurado (o dispositivo físico con depuración USB activada)
- Para iOS: macOS con Xcode 15+ instalado (solo en Mac)
- Java 17 (para Android). Verifica con `java -version`

---

## Instalación

```bash
git clone <url-del-repo>
cd acustic
npm install
```

Crea el fichero `.env` en la raíz con las claves (pídelas al equipo):

```
GOOGLE_MAPS_API_KEY_ANDROID=...
GOOGLE_MAPS_API_KEY_IOS=...
GOOGLE_MAPS_API_KEY_DIRECTIONS=...
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_MEASUREMENT_ID=...
```

---

## Development Build (obligatorio — la app NO funciona en Expo Go)

Esta app usa módulos nativos (`@react-native-firebase`, `expo-location`, `expo-audio`, etc.) que Expo Go no soporta. Hay que compilar un **development build** la primera vez.

### Android

**Opción A — Emulador (Android Studio)**

1. Abre Android Studio → `Device Manager` → arranca un emulador (API 33+ recomendado).
2. Compila e instala en el emulador:
   ```bash
   npx expo run:android
   ```
3. Una vez instalado, para futuros arranques solo necesitas:
   ```bash
   npx expo start --dev-client
   ```
   y pulsar `a` para abrir en el emulador.

**Opción B — Dispositivo físico**

1. Activa **Opciones de desarrollador** y **Depuración USB** en tu Android.
2. Conecta el cable USB y acepta el par de claves cuando lo pida el móvil.
3. Verifica que el dispositivo es visible:
   ```bash
   adb devices
   ```
4. Compila e instala:
   ```bash
   npx expo run:android
   ```
5. Arranques posteriores:
   ```bash
   npx expo start --dev-client
   ```

### iOS (solo macOS)

**Opción A — Simulador (Xcode)**

1. Abre Xcode al menos una vez para que descargue los simuladores.
2. Compila e instala:
   ```bash
   npx expo run:ios
   ```
3. Arranques posteriores:
   ```bash
   npx expo start --dev-client
   ```
   y pulsar `i`.

**Opción B — Dispositivo físico**

1. Necesitas una cuenta de desarrollador Apple (gratuita sirve para pruebas locales).
2. Conecta el iPhone por USB, confía en el ordenador cuando lo pida.
3. Registra el dispositivo en Xcode: `Window → Devices and Simulators`.
4. Compila:
   ```bash
   npx expo run:ios --device
   ```
5. Si hay error de firma, abre `ios/acustic.xcworkspace` en Xcode y asigna tu Apple ID en `Signing & Capabilities`.

---

## Comandos útiles

```bash
# Arrancar Metro (requiere dev build ya instalado)
npx expo start --dev-client

# Recompilar tras cambios en app.json o instalación de nuevos módulos nativos
npx expo run:android
npx expo run:ios

# Limpiar caché de Metro si algo va raro
npx expo start --dev-client --clear

# Lint
npx expo lint
```

---

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | Expo SDK ~55 |
| Runtime | React Native 0.83.4 + React 19.2.0 |
| Lenguaje | TypeScript |
| Routing | Expo Router (file-based) |
| Mapas | react-native-maps + react-native-maps-directions |
| Audio | expo-audio |
| Localización | expo-location |
| Auth | Firebase + Google Sign-In + Apple Authentication |
| Backend/DB | Firebase (Firestore + Storage) |
| Animaciones | react-native-reanimated |

---

## Estructura de carpetas

```
acustic/
├── app/                  # Rutas Expo Router
│   ├── (tabs)/           # Tabs principales
│   ├── active-tour/      # Pantalla de tour activo
│   ├── auth/             # Flujo de autenticación
│   ├── tour/             # Detalle de tour
│   └── profile/          # Pantallas de perfil
├── screens/              # Pantallas principales
├── components/           # Componentes reutilizables
├── hooks/                # Custom hooks
├── services/             # Lógica de negocio / APIs
├── utils/                # Utilidades
├── constants/            # Constantes globales
└── data/                 # Datos estáticos / mocks
```
