import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

interface CounterRevealProps {
  targetNumber: number;
  label: string;
  subtitle1?: string;
  subtitle2?: string;
  highlightWord?: string;
  startFrame: number;
  endFrame: number;
  color?: string;
  strikethroughText?: string;
}

export const CounterReveal: React.FC<CounterRevealProps> = ({
  targetNumber,
  label,
  subtitle1,
  subtitle2,
  highlightWord,
  startFrame,
  endFrame,
  color = 'white',
  strikethroughText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const sceneDuration = endFrame - startFrame;

  // Counter animation (first 40% of scene)
  const counterEnd = Math.floor(sceneDuration * 0.4);
  const counter = Math.round(interpolate(local, [10, counterEnd], [0, targetNumber], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }));

  const hoursOp = interpolate(spring({ frame: local - counterEnd + 10, fps, config: { damping: 14 } }), [0, 1], [0, 1]);

  // Strikethrough line animation
  const strikeW = strikethroughText
    ? interpolate(local, [30, 60], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) })
    : 0;
  const strikeOp = interpolate(local, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const sub1Op = interpolate(local, [Math.floor(sceneDuration * 0.55), Math.floor(sceneDuration * 0.65)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub2Op = interpolate(local, [Math.floor(sceneDuration * 0.7), Math.floor(sceneDuration * 0.8)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const glow = interpolate(Math.sin(local / 12), [-1, 1], [0.2, 0.6]);

  if (frame < startFrame || frame > endFrame + 5) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {strikethroughText && (
        <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.5)', opacity: strikeOp, position: 'relative', marginBottom: 40 }}>
          {strikethroughText}
          <div style={{ position: 'absolute', top: '50%', left: 0, width: `${strikeW}%`, height: 3, backgroundColor: '#ff1a1a' }} />
        </div>
      )}
      <div style={{ fontSize: 160, fontWeight: 900, color, letterSpacing: -4, textShadow: `0 0 80px ${color === 'white' ? `rgba(255,255,255,${glow})` : color + Math.round(glow * 255).toString(16).padStart(2, '0')}` }}>
        {counter.toLocaleString('en-US')}
      </div>
      <div style={{ fontSize: 48, fontWeight: 300, color: color === 'white' ? 'rgba(255,255,255,0.6)' : color + '99', letterSpacing: 20, textTransform: 'uppercase', opacity: hoursOp, marginTop: -10 }}>
        {label}
      </div>
      {subtitle1 && (
        <div style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginTop: 50, opacity: sub1Op }}>
          {highlightWord ? (
            <>{subtitle1.split(highlightWord)[0]}<span style={{ color: color === 'white' ? 'white' : color, fontWeight: 700 }}>{highlightWord}</span>{subtitle1.split(highlightWord)[1]}</>
          ) : subtitle1}
        </div>
      )}
      {subtitle2 && (
        <div style={{ fontSize: 26, fontWeight: 300, color: 'rgba(255,255,255,0.4)', marginTop: 15, opacity: sub2Op, fontStyle: 'italic' }}>
          {subtitle2}
        </div>
      )}
    </div>
  );
};
