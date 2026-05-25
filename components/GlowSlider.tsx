// components/GlowSlider.tsx
import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Rect } from 'react-native-svg';

interface GlowSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onSlidingComplete: (value: number) => void;
  style?: object;
}

const THUMB_SIZE = 10;
const THUMB_GLOW = 13;
const TRACK_HEIGHT = 5;
const GLOW_COLOR = '#8874F7';

export const GlowSlider = ({
  value,
  minimumValue,
  maximumValue,
  onSlidingComplete,
  style,
}: GlowSliderProps) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  // Refs para que el PanResponder (creado una sola vez) siempre lea valores actuales
  const trackWidthRef = useRef(0);
  const minimumValueRef = useRef(minimumValue);
  const maximumValueRef = useRef(maximumValue);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  minimumValueRef.current = minimumValue;
  maximumValueRef.current = maximumValue;
  onSlidingCompleteRef.current = onSlidingComplete;

  // Después de seek, mantener dragValue hasta que el prop value se acerque al target
  const seekTargetRef = useRef<number | null>(null);
  useEffect(() => {
    if (seekTargetRef.current === null) return;
    const tolerance = (maximumValue - minimumValue) * 0.02 + 1000; // 2% del rango o mín 1s
    if (Math.abs(value - seekTargetRef.current) < tolerance) {
      seekTargetRef.current = null;
      setDragValue(null);
    }
  }, [value, minimumValue, maximumValue]);

  const range = maximumValue - minimumValue || 1;
  const displayValue = dragValue !== null ? dragValue : value;
  const progress = Math.max(0, Math.min(1, (displayValue - minimumValue) / range));
  const thumbLeft = progress * trackWidth - THUMB_GLOW / 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const tw = trackWidthRef.current;
        const min = minimumValueRef.current;
        const rng = maximumValueRef.current - min || 1;
        isDragging.current = true;
        startX.current = Math.max(0, Math.min(evt.nativeEvent.locationX, tw));
        const v = min + (startX.current / tw) * rng;
        setDragValue(v);
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidthRef.current;
        const min = minimumValueRef.current;
        const rng = maximumValueRef.current - min || 1;
        const x = Math.max(0, Math.min(startX.current + gs.dx, tw));
        setDragValue(min + (x / tw) * rng);
      },
      onPanResponderRelease: (_, gs) => {
        const tw = trackWidthRef.current;
        const min = minimumValueRef.current;
        const rng = maximumValueRef.current - min || 1;
        const x = Math.max(0, Math.min(startX.current + gs.dx, tw));
        const finalValue = min + (x / tw) * rng;
        isDragging.current = false;
        // Mantener dragValue en la posición del seek hasta que TrackPlayer confirme
        seekTargetRef.current = finalValue;
        setDragValue(finalValue);
        onSlidingCompleteRef.current(finalValue);
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        seekTargetRef.current = null;
        setDragValue(null);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const fillWidth = Math.max(0, progress * trackWidth);
  const svgHeight = TRACK_HEIGHT + 12;
  const yCenter = svgHeight / 2;
  const rx = TRACK_HEIGHT / 2;

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      {/* Track SVG con glow */}
      {trackWidth > 0 && (
        <Svg
          width={trackWidth}
          height={svgHeight}
          style={{ position: 'absolute' }}
        >
          <Defs>
            <Filter id="glowTrack" x="-30%" y="-100%" width="160%" height="300%">
              <FeGaussianBlur stdDeviation={3} />
            </Filter>
          </Defs>

          {/* Fondo */}
          <Rect
            x={0} y={yCenter - TRACK_HEIGHT / 2}
            width={trackWidth} height={TRACK_HEIGHT}
            rx={rx}
            fill="#FFFFFF"
            stroke={GLOW_COLOR}
            strokeWidth={0.8}
          />

          {/* Glow capa */}
          {fillWidth > 0 && (
            <Rect
              x={0} y={yCenter - TRACK_HEIGHT / 2}
              width={fillWidth} height={TRACK_HEIGHT}
              rx={rx} fill={GLOW_COLOR}
              filter="url(#glowTrack)"
              opacity={0.65}
            />
          )}

          {/* Relleno */}
          {fillWidth > 0 && (
            <Rect
              x={0} y={yCenter - TRACK_HEIGHT / 2}
              width={fillWidth} height={TRACK_HEIGHT}
              rx={rx} fill={GLOW_COLOR}
            />
          )}
        </Svg>
      )}

      {/* Thumb con halo y glow */}
      {trackWidth > 0 && (
        <View style={[styles.thumbHalo, { left: thumbLeft }]}>
          <View style={styles.thumb} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: THUMB_GLOW + 8,
    justifyContent: 'center',
    overflow: 'visible',
  },
  thumbHalo: {
    position: 'absolute',
    width: THUMB_GLOW,
    height: THUMB_GLOW,
    borderRadius: THUMB_GLOW / 2,
    backgroundColor: '#8874F718',
    justifyContent: 'center',
    alignItems: 'center',
    // Glow exterior iOS
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: GLOW_COLOR,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    // Glow interior iOS
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
});
