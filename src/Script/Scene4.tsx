import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

/**
 * Scene 4 (18s - 20s, frames 540-600):
 * "WRONG." - The dramatic slam.
 */
export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneStart = 540;
  const localFrame = frame - sceneStart;

  // Screen flash
  const flashOpacity = interpolate(localFrame, [0, 3, 8], [0.8, 0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text slam - heavy spring
  const slamSpring = spring({
    frame: localFrame - 3,
    fps,
    config: {
      damping: 8,
      mass: 1.2,
      stiffness: 200,
    },
  });

  const textScale = interpolate(slamSpring, [0, 1], [3, 1]);
  const textOpacity = interpolate(slamSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out
  const fadeOut = interpolate(frame, [585, 600], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < sceneStart) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'white',
          opacity: flashOpacity,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '220px',
            fontWeight: 900,
            color: '#ff1a1a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-4px',
            transform: `scale(${textScale})`,
            opacity: textOpacity,
            textShadow:
              '0 0 60px rgba(255,26,26,0.6), 0 0 120px rgba(255,26,26,0.3)',
          }}
        >
          WRONG.
        </div>
      </div>
    </div>
  );
};
