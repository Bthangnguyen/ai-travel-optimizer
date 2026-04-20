import React from 'react';
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

/**
 * Scene 2 (4s - 13s, frames 120-390):
 * Keywords pop in: book, videos, discipline, plan, 5AM
 */

const KEYWORDS = [
  { text: '📖  Self-Help Book', delay: 0 },
  { text: '📹  Dozens of Videos', delay: 30 },
  { text: '💪  Build Discipline', delay: 60 },
  { text: '📋  Plan Your Life', delay: 90 },
  { text: '⏰  Wake Up at 5 AM', delay: 120 },
];

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneStart = 120;
  const localFrame = frame - sceneStart;

  const fadeIn = interpolate(frame, [sceneStart, sceneStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [370, 390], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(localFrame, [0, 20], [0, 0.5], {
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
        opacity: fadeIn * fadeOut,
      }}
    >
      <div
        style={{
          fontSize: '22px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '50px',
          opacity: subtitleOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        You might be holding right now...
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '20px',
          maxWidth: '1200px',
        }}
      >
        {KEYWORDS.map((kw, i) => {
          const kwSpring = spring({
            frame: localFrame - kw.delay,
            fps,
            config: { damping: 12, mass: 0.6 },
          });

          const scale = interpolate(kwSpring, [0, 1], [0.5, 1]);
          const opacity = interpolate(kwSpring, [0, 1], [0, 1]);
          const translateY = interpolate(kwSpring, [0, 1], [30, 0]);

          return (
            <div
              key={i}
              style={{
                padding: '18px 36px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '28px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
              }}
            >
              {kw.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};
