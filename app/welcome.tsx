// app/welcome.tsx

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Imagen 1024×1536 → ratio 2:3. La altura en pantalla es ancho × 1.5
const IMAGE_HEIGHT = SCREEN_WIDTH * (1536 / 1024);

const HANDLE_SIZE = 42;
const SLIDER_PADDING = 5;
const SLIDER_WIDTH = SCREEN_WIDTH - 48;
const MAX_TRANSLATE = SLIDER_WIDTH - HANDLE_SIZE - SLIDER_PADDING * 2;
const SWIPE_THRESHOLD = MAX_TRANSLATE * 0.55;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);

  const goToExplore = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, [router]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, MAX_TRANSLATE));
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(MAX_TRANSLATE, { damping: 20 });
        runOnJS(goToExplore)();
      } else {
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.8],
      [1, 0],
      Extrapolate.CLAMP,
    ),
  }));

  return (
    <View style={styles.container}>
      {/* Imagen con altura exacta según su ratio natural */}
      <Image
        source={require('../assets/images/welcome-bg.png')}
        style={styles.heroImage}
        contentFit="cover"
        contentPosition="top center"
      />

      {/* Contenido flotante en la franja inferior */}
      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.sliderTrack}>
          <Animated.Text style={[styles.sliderLabel, labelOpacity]}>
            Descubre tu primer destino
          </Animated.Text>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.handle, handleAnimatedStyle]}>
              <Ionicons name="play" size={22} color="#7B5EA7" />
            </Animated.View>
          </GestureDetector>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/auth/register' as any)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.registerText}>
            ¿Aún no tienes cuenta?{' '}
            <Text style={styles.registerLink}>Crea una</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7B5EA7',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  bottomContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 22,
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 50,
    backgroundColor: 'rgba(123, 94, 167, 0.88)',
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SLIDER_PADDING,
    overflow: 'hidden',
  },
  sliderLabel: {
    position: 'absolute',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    paddingLeft: HANDLE_SIZE * 0.6,
  },
  handle: {
    position: 'absolute',
    left: SLIDER_PADDING,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  registerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  registerLink: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
