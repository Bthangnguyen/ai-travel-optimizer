import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface SequentialLinesProps {
  lines: string[];
  startFrame: number;
  endFrame: number;
  glowLastLine?: boolean;
}

export const SequentialLines: React.FC<SequentialLinesProps> = ({
  lines,
  startFrame,
  endFrame,
  glowLastLine = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const fadeOut = interpolate(frame, [endFrame - 20, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (frame < startFrame || frame > endFrame + 5) return null;

  const delayPerLine = Math.floor((endFrame - startFrame) * 0.6 / Math.max(lines.length, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: fadeOut }}>
      {lines.map((line, i) => {
        const isLast = glowLastLine && i === lines.length - 1;
        const s = spring({ frame: local - (i * delayPerLine), fps, config: { damping: 14 } });
        return (
          <div key={i} style={{
            fontSize: isLast ? 42 : 36, fontWeight: isLast ? 700 : 400,
            color: isLast ? 'white' : 'rgba(255,255,255,0.7)', fontStyle: 'italic',
            transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
            opacity: interpolate(s, [0, 1], [0, 1]),
            textShadow: isLast ? '0 0 30px rgba(255,255,255,0.3)' : 'none', letterSpacing: 1,
          }}>{line}</div>
        );
      })}
    </div>
  );
};
