// app.config.js
// Extiende la configuración estática (app.json) con valores cargados desde
// variables de entorno (.env). Expo CLI carga .env automáticamente, por lo que
// NO se necesita `dotenv/config`.

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config || {}),
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
    },
  },
  android: {
    ...config.android,
    config: {
      ...(config.android?.config || {}),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },
  extra: {
    ...(config.extra || {}),
    directionsApiKey: process.env.GOOGLE_MAPS_API_KEY_DIRECTIONS,
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
  },
});
