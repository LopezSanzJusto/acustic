import 'dotenv/config';

export default {
  expo: {
    name: "acustic",
    slug: "acustic",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "acustic",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      usesAppleSignIn: true,
      bundleIdentifier: "com.acustic.app",
      config: {
        // Inyecta la llave de iOS en el código nativo de Apple
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
      }
    },
    android: {
      package: "com.acustic.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      config: {
        googleMaps: {
          // Inyecta la llave de Android en el código nativo de Google
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
        }
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      "expo-font",
      "expo-image",
      "expo-local-authentication"
    ],
    // Aquí metemos TODO lo que usaremos desde nuestro código React/TypeScript
    extra: {
      directionsApiKey: process.env.GOOGLE_MAPS_API_KEY_DIRECTIONS,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: "ed2edee7-8731-4647-af8b-d3b988bb050f" // Tu ID de proyecto en Expo
      }
    }
  }
};