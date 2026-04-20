import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const PARTICLE_COUNT = 30;

const Particle: React.FC<{
  seed: number;
}> = ({ seed }) => {
  const frame = useCurrentFrame();
  const { height, width, durationInFrames } = useVideoConfig();

  // Deterministic "random" behavior based on seed
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const initialX = random(seed) * width;
  const initialY = random(seed + 1) * height;
  const size = random(seed + 2) * 4 + 1;
  const speed = random(seed + 3) * 0.5 + 0.2;

  // Drift effect
  const x = initialX + Math.sin(frame / 60 + seed) * 50;
  const y = initialY - (frame * speed);

  // Wrap around or fade
  const opacity = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 0.4, 0.4, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: 'white',
        borderRadius: '50%',
        opacity,
        filter: 'blur(1px)',
      }}
    />
  );
};

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} seed={i} />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
