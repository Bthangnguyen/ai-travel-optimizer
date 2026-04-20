import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface ImpactWordProps {
  word: string;
  startFrame: number;
  endFrame: number;
  color?: string;
  flash?: boolean;
}

export const ImpactWord: React.FC<ImpactWordProps> = ({
  word,
  startFrame,
  endFrame,
  color = '#ff1a1a',
  flash = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const flashOpacity = flash
    ? interpolate(local, [0, 3, 8], [0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  const slam = spring({ frame: local - 3, fps, config: { damping: 8, mass: 1.2, stiffness: 200 } });
  const textScale = interpolate(slam, [0, 1], [3, 1]);
  const textOpacity = interpolate(slam, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  const fadeOut = interpolate(frame, [endFrame - 15, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (frame < startFrame || frame > endFrame + 5) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fadeOut }}>
      {flash && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', opacity: flashOpacity }} />}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontSize: 220, fontWeight: 900, color, letterSpacing: -4,
          transform: `scale(${textScale})`, opacity: textOpacity,
          textShadow: `0 0 60px ${color}99, 0 0 120px ${color}4D`,
        }}>{word}</div>
      </div>
    </div>
  );
};
