import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

/**
 * Scene 5 (20s - 30s, frames 600-900):
 * "10,000 HOURS" counter + "6 YEARS"
 */
export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneStart = 600;
  const localFrame = frame - sceneStart;

  // Counter 0 → 10000 over 90 frames (3 seconds)
  const counterRaw = interpolate(localFrame, [10, 100], [0, 10000], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const counter = Math.round(counterRaw);
  const formattedCounter = counter.toLocaleString('en-US');

  // "HOURS" label
  const hoursSpring = spring({
    frame: localFrame - 70,
    fps,
    config: { damping: 14 },
  });
  const hoursOpacity = interpolate(hoursSpring, [0, 1], [0, 1]);

  // Subtitle "More than 6 years of my life"
  const sub1Opacity = interpolate(localFrame, [120, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle "digging through..."
  const sub2Opacity = interpolate(localFrame, [160, 190], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(localFrame / 15),
    [-1, 1],
    [0.2, 0.5]
  );

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
      }}
    >
      <div
        style={{
          fontSize: '160px',
          fontWeight: 900,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-4px',
          textShadow: `0 0 80px rgba(255,255,255,${glowIntensity})`,
        }}
      >
        {formattedCounter}
      </div>

      <div
        style={{
          fontSize: '48px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '20px',
          textTransform: 'uppercase',
          opacity: hoursOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginTop: '-10px',
        }}
      >
        Hours
      </div>

      <div
        style={{
          fontSize: '30px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.5)',
          marginTop: '50px',
          opacity: sub1Opacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        More than <span style={{ color: 'white', fontWeight: 700 }}>6 years</span> of my life
      </div>

      <div
        style={{
          fontSize: '26px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.4)',
          marginTop: '15px',
          opacity: sub2Opacity,
          fontStyle: 'italic',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        digging through the so-called self-improvement industry.
      </div>
    </div>
  );
};
