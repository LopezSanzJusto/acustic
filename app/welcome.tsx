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
const HANDLE_SIZE = 54;
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
      <Image
        source={require('../assets/images/welcome-bg.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="top center"
      />

      <View style={styles.overlay} />

      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.description}>
          Escucha historias sobre cultura y rincones{'\n'}
          ocultos con nuestras{' '}
          <Text style={styles.bold}>audio-guías de viaje</Text>
        </Text>

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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    top: '52%',
    backgroundColor: 'rgba(15, 5, 35, 0.72)',
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
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 62,
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
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
  },
  registerLink: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
