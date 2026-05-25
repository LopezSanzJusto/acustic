// components/GlowProgressBar.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Rect } from 'react-native-svg';

interface GlowProgressBarProps {
  progress: number;   // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
  glowRadius?: number;
  style?: object;
}

export const GlowProgressBar = ({
  progress,
  color = '#7F86FF',
  trackColor = '#DDDEFF',
  height = 4,
  glowRadius = 3,
  style,
}: GlowProgressBarProps) => {
  const [trackWidth, setTrackWidth] = useState(0);

  const pct = Math.min(100, Math.max(0, progress));
  const fillWidth = (pct / 100) * trackWidth;
  const svgHeight = height + glowRadius * 2;
  const yCenter = svgHeight / 2;
  const rx = height / 2;

  return (
    <View
      style={[{ height: svgHeight, justifyContent: 'center' }, style]}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {trackWidth > 0 && (
        <Svg
          width={trackWidth + glowRadius * 2}
          height={svgHeight}
          style={{ position: 'absolute', left: -glowRadius }}
        >
          <Defs>
            <Filter id="glow" x="-30%" y="-100%" width="160%" height="300%">
              <FeGaussianBlur stdDeviation={glowRadius} />
            </Filter>
          </Defs>

          {/* Track de fondo */}
          <Rect
            x={glowRadius} y={yCenter - height / 2}
            width={trackWidth} height={height}
            rx={rx} fill={trackColor}
          />

          {/* Capa glow (borrosa) */}
          {fillWidth > 0 && (
            <Rect
              x={glowRadius} y={yCenter - height / 2}
              width={fillWidth} height={height}
              rx={rx} fill={color}
              filter="url(#glow)"
              opacity={0.65}
            />
          )}

          {/* Barra rellena encima */}
          {fillWidth > 0 && (
            <Rect
              x={glowRadius} y={yCenter - height / 2}
              width={fillWidth} height={height}
              rx={rx} fill={color}
            />
          )}
        </Svg>
      )}
    </View>
  );
};
