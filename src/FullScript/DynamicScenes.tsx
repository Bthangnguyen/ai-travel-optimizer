import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import presetsData from './animation_presets.json';

interface SceneProps {
  text: string;
  startFrame: number;
  endFrame: number;
  style?: {
    primaryColor?: string;
    fontSize?: number;
    preset?: string;
  };
}

export const DynamicScene: React.FC<SceneProps> = ({ text, startFrame, endFrame, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lấy cấu hình Preset nếu có
  const preset = presetsData.presets.find(p => p.name === style?.preset) || presetsData.presets[0];

  // Logic hiển thị
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, endFrame - 10, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Hiệu ứng Spring dựa trên Preset
  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: preset.config,
  });

  if (frame < startFrame || frame > endFrame) return null;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        opacity,
        padding: '0 100px',
      }}
    >
      <h1
        style={{
          color: style?.primaryColor || 'white',
          fontSize: style?.fontSize || 120,
          fontWeight: 900,
          textAlign: 'center',
          transform: `scale(${scale})`,
          textShadow: '0 10px 40px rgba(0,0,0,0.8)',
          maxWidth: '100%',
          lineHeight: 1.1,
          textTransform: 'uppercase',
          letterSpacing: '-2px',
        }}
      >
        {text}
      </h1>
    </AbsoluteFill>
  );
};
