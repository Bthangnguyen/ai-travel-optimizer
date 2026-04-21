import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface KeywordCardsProps {
  subtitle?: string;
  keywords: string[];
  startFrame: number;
  endFrame: number;
}

export const KeywordCards: React.FC<KeywordCardsProps> = ({
  subtitle,
  keywords,
  startFrame,
  endFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const fadeIn = interpolate(frame, [startFrame, startFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [endFrame - 30, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(local, [0, 20], [0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (frame < startFrame || frame > endFrame + 5) return null;

  // Spread keyword delays evenly across scene duration
  const sceneDuration = endFrame - startFrame;
  const delayPerKeyword = Math.floor(sceneDuration * 0.6 / Math.max(keywords.length, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeIn * fadeOut }}>
      {subtitle && (
        <div style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 50, opacity: subOp }}>
          {subtitle}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, maxWidth: 1200 }}>
        {keywords.map((kw, i) => {
          const s = spring({ frame: local - (i * delayPerKeyword), fps, config: { damping: 12, mass: 0.6 } });
          return (
            <div key={i} style={{
              padding: '18px 36px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 28, fontWeight: 600,
              transform: `scale(${interpolate(s, [0, 1], [0.5, 1])}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              opacity: interpolate(s, [0, 1], [0, 1]),
            }}>{kw}</div>
          );
        })}
      </div>
    </div>
  );
};
