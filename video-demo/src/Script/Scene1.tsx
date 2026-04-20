import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

/**
 * Scene 1 (0s - 4s, frames 0-120):
 * "YOU WANT TO CHANGE"
 */
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const textScale = interpolate(textSpring, [0, 1], [0.6, 1]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  const lineWidth = interpolate(frame, [30, 70], [0, 600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const subtitleOpacity = interpolate(frame, [5, 30], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontSize: '28px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          marginBottom: '20px',
          opacity: subtitleOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        You are watching this because
      </div>
      <div
        style={{
          fontSize: '100px',
          fontWeight: 900,
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          transform: `scale(${textScale})`,
          opacity: textOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textShadow: '0 0 40px rgba(255,255,255,0.15)',
        }}
      >
        You want to change
      </div>
      <div
        style={{
          width: `${lineWidth}px`,
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          marginTop: '20px',
          borderRadius: '2px',
        }}
      />
    </div>
  );
};
