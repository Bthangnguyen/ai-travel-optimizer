import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// PHASE LABEL — "STEP 1", "PHASE 4" styled label
// Usage: Step-by-step flows, phase indicators, numbered lists
// ═══════════════════════════════════════════════════════════════════

interface PhaseLabelProps {
  x: number;
  y: number;
  /** The phase/step number */
  number: number;
  /** Prefix text: "STEP", "PHASE", "CHAPTER", etc. */
  prefix?: string;
  /** Subtitle text */
  subtitle?: string;
  delay: number;
  duration?: number;
  color?: string;
  subtitleColor?: string;
  /** Size multiplier */
  scale?: number;
}

export const PhaseLabel: React.FC<PhaseLabelProps> = ({
  x,
  y,
  number,
  prefix = 'STEP',
  subtitle,
  delay,
  duration = 15,
  color = '#F5E500',
  subtitleColor = '#FFFFFF',
  scale = 1,
}) => {
  const f = useCurrentFrame();

  const op = interpolate(f, [delay, delay + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scaleAnim = interpolate(f, [delay, delay + duration], [1.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const blur = interpolate(f, [delay, delay + 12], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle fade in later
  const subOp = subtitle
    ? interpolate(f, [delay + 10, delay + 18], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scaleAnim * scale})`,
        opacity: op,
        filter: `blur(${blur}px)`,
        textAlign: 'center',
      }}
    >
      {/* Prefix + Number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            color,
            fontSize: 28 * scale,
            fontWeight: 900,
            letterSpacing: 6,
            textTransform: 'uppercase' as const,
            opacity: 0.7,
          }}
        >
          {prefix}
        </span>
        <span
          style={{
            color,
            fontSize: 64 * scale,
            fontWeight: 900,
            lineHeight: 1,
            filter: `drop-shadow(0 0 15px ${color}) drop-shadow(0 0 30px ${color})`,
          }}
        >
          {number}
        </span>
      </div>

      {/* Divider line */}
      <div
        style={{
          width: 80 * scale,
          height: 2,
          backgroundColor: color,
          margin: '8px auto',
          opacity: 0.4,
        }}
      />

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            color: subtitleColor,
            fontSize: 22 * scale,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase' as const,
            opacity: subOp,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
