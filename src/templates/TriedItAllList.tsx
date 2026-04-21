import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface TriedItAllListProps {
  items: string[];
  startFrame: number;
  endFrame: number;
  lastItemAccent?: boolean;
  accentColor?: string;
}

export const TriedItAllList: React.FC<TriedItAllListProps> = ({
  items,
  startFrame,
  endFrame,
  lastItemAccent = true,
  accentColor = '#ff1a1a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const fadeOut = interpolate(frame, [endFrame - 25, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (frame < startFrame || frame > endFrame + 5) return null;

  const delayPerItem = Math.floor((endFrame - startFrame) * 0.75 / Math.max(items.length, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: fadeOut }}>
      {items.map((item, i) => {
        const isLast = lastItemAccent && i === items.length - 1;
        const s = spring({ frame: local - (i * delayPerItem), fps, config: { damping: 12, mass: 0.5 } });
        return (
          <div key={i} style={{
            fontSize: isLast ? 40 : 30, fontWeight: isLast ? 900 : 500,
            color: isLast ? accentColor : 'rgba(255,255,255,0.8)',
            transform: `translateX(${interpolate(s, [0, 1], [-100, 0])}px)`,
            opacity: interpolate(s, [0, 1], [0, 1]),
            letterSpacing: isLast ? 2 : 0,
            textShadow: isLast ? `0 0 20px ${accentColor}66` : 'none',
          }}>{item}</div>
        );
      })}
    </div>
  );
};
