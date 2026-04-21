import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// CROSS OUT — Animated X/strikethrough drawn over content
// CIRCLE HIGHLIGHT — Animated circle drawn around content
// Usage: Negation, comparison (do/don't), warnings, emphasis
// ═══════════════════════════════════════════════════════════════════

// ── CrossOut ──────────────────────────────────────────────────────

interface CrossOutProps {
  /** Center X of the cross */
  x: number;
  /** Center Y of the cross */
  y: number;
  /** Size of the X (half-width) */
  size?: number;
  delay: number;
  duration?: number;
  color?: string;
  thickness?: number;
}

export const CrossOut: React.FC<CrossOutProps> = ({
  x,
  y,
  size = 60,
  delay,
  duration = 8,
  color = '#CC0000',
  thickness = 4,
}) => {
  const f = useCurrentFrame();
  const lineLen = size * 2 * Math.SQRT2;

  // First stroke: top-left to bottom-right
  const p1 = interpolate(f, [delay, delay + duration * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // Second stroke: top-right to bottom-left (starts slightly later)
  const p2 = interpolate(f, [delay + duration * 0.3, delay + duration * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(f, [delay, delay + 3], [0, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: 1920,
        height: 1080,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {/* First diagonal: \ */}
      <line
        x1={x - size}
        y1={y - size}
        x2={x + size}
        y2={y + size}
        stroke={color}
        strokeWidth={thickness}
        opacity={op}
        strokeDasharray={lineLen}
        strokeDashoffset={lineLen * (1 - p1)}
        strokeLinecap="round"
      />
      {/* Glow */}
      <line
        x1={x - size}
        y1={y - size}
        x2={x + size}
        y2={y + size}
        stroke={color}
        strokeWidth={thickness + 6}
        opacity={op * 0.2}
        strokeDasharray={lineLen}
        strokeDashoffset={lineLen * (1 - p1)}
        strokeLinecap="round"
      />
      {/* Second diagonal: / */}
      <line
        x1={x + size}
        y1={y - size}
        x2={x - size}
        y2={y + size}
        stroke={color}
        strokeWidth={thickness}
        opacity={op}
        strokeDasharray={lineLen}
        strokeDashoffset={lineLen * (1 - p2)}
        strokeLinecap="round"
      />
      <line
        x1={x + size}
        y1={y - size}
        x2={x - size}
        y2={y + size}
        stroke={color}
        strokeWidth={thickness + 6}
        opacity={op * 0.2}
        strokeDasharray={lineLen}
        strokeDashoffset={lineLen * (1 - p2)}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ── CircleHighlight ──────────────────────────────────────────────

interface CircleHighlightProps {
  /** Center X */
  x: number;
  /** Center Y */
  y: number;
  /** Radius */
  radius?: number;
  delay: number;
  duration?: number;
  color?: string;
  thickness?: number;
}

export const CircleHighlight: React.FC<CircleHighlightProps> = ({
  x,
  y,
  radius = 80,
  delay,
  duration = 15,
  color = '#CC0000',
  thickness = 3,
}) => {
  const f = useCurrentFrame();
  const circumference = 2 * Math.PI * radius;

  const progress = interpolate(f, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(f, [delay, delay + 5], [0, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: 1920,
        height: 1080,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {/* Glow */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness + 6}
        opacity={op * 0.2}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${x} ${y})`}
      />
      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        opacity={op}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${x} ${y})`}
      />
    </svg>
  );
};
