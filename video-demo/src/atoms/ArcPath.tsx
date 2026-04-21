import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// ARC PATH — Curved bezier SVG path connecting multiple points
// Usage: Journey maps, timelines, story arcs, roadmaps
// ═══════════════════════════════════════════════════════════════════

interface ArcPathProps {
  /** Array of {x, y} points the arc passes through */
  points: { x: number; y: number }[];
  /** Frame to start drawing */
  delay: number;
  /** Duration of the draw animation in frames */
  duration?: number;
  /** Stroke color */
  color?: string;
  /** Stroke width */
  thickness?: number;
  /** How much the curve arcs (positive = arc upward) */
  curvature?: number;
  /** Show arrowhead at end */
  arrow?: boolean;
  /** Glow intensity (0 = none) */
  glow?: number;
}

/**
 * Generates a smooth cubic bezier SVG path through given points
 * with a configurable curvature (how much it bows upward/downward).
 */
function buildArcPath(
  points: { x: number; y: number }[],
  curvature: number
): string {
  if (points.length < 2) return '';
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    // Control point offset: apply curvature perpendicular to the segment
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    // Perpendicular direction (normalized), scaled by curvature * segment length
    const nx = -dy / len;
    const ny = dx / len;
    const cpx = mx + nx * curvature * len * 0.3;
    const cpy = my + ny * curvature * len * 0.3;
    d += ` Q ${cpx} ${cpy} ${p1.x} ${p1.y}`;
  }
  
  return d;
}

export const ArcPath: React.FC<ArcPathProps> = ({
  points,
  delay,
  duration = 30,
  color = '#FFFFFF',
  thickness = 2,
  curvature = -1, // negative = arc upward
  arrow = false,
  glow = 0,
}) => {
  const f = useCurrentFrame();
  const pathD = buildArcPath(points, curvature);

  // Estimate total path length (rough approx)
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalLen += Math.sqrt(dx * dx + dy * dy) * 1.3; // factor for curvature
  }

  const progress = interpolate(f, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const opacity = interpolate(f, [delay, delay + 5], [0, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dashOffset = totalLen * (1 - progress);

  // Arrow at end
  const lastP = points[points.length - 1];
  const prevP = points[points.length - 2] || points[0];
  const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x);
  const aSize = 12;
  const arrowOp = interpolate(f, [delay + duration - 5, delay + duration], [0, 0.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowFilter = glow > 0
    ? `drop-shadow(0 0 ${glow}px ${color}) drop-shadow(0 0 ${glow * 2}px ${color})`
    : 'none';

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: 1920,
        height: 1080,
        pointerEvents: 'none',
        zIndex: 5,
        filter: glowFilter,
      }}
    >
      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={thickness + 6}
        opacity={opacity * 0.15}
        strokeDasharray={totalLen}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {/* Main path */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        opacity={opacity}
        strokeDasharray={totalLen}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      {arrow && (
        <polygon
          points={`${lastP.x},${lastP.y} ${lastP.x - aSize * Math.cos(angle - 0.35)},${lastP.y - aSize * Math.sin(angle - 0.35)} ${lastP.x - aSize * Math.cos(angle + 0.35)},${lastP.y - aSize * Math.sin(angle + 0.35)}`}
          fill={color}
          opacity={arrowOp}
        />
      )}
    </svg>
  );
};
