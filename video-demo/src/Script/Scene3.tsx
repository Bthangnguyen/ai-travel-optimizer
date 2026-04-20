import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

/**
 * Scene 3 (13s - 18s, frames 390-540):
 * "One more video... one more book... everything will click."
 */

const LINES = [
  { text: 'One more video...', delay: 0 },
  { text: 'One more book...', delay: 40 },
  { text: 'Everything will finally click into place.', delay: 80, glow: true },
];

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneStart = 390;
  const localFrame = frame - sceneStart;

  const fadeOut = interpolate(frame, [520, 540], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < sceneStart) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        opacity: fadeOut,
      }}
    >
      {LINES.map((line, i) => {
        const lineSpring = spring({
          frame: localFrame - line.delay,
          fps,
          config: { damping: 14 },
        });

        const opacity = interpolate(lineSpring, [0, 1], [0, 1]);
        const translateY = interpolate(lineSpring, [0, 1], [40, 0]);

        return (
          <div
            key={i}
            style={{
              fontSize: line.glow ? '42px' : '36px',
              fontWeight: line.glow ? 700 : 400,
              color: line.glow ? 'white' : 'rgba(255,255,255,0.7)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontStyle: 'italic',
              transform: `translateY(${translateY}px)`,
              opacity,
              textShadow: line.glow
                ? '0 0 30px rgba(255,255,255,0.3)'
                : 'none',
              letterSpacing: '1px',
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
};
