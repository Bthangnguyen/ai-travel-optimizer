import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// SPEECH BUBBLE — Rounded callout with pointer tail
// Usage: Dialogue scenes, quote callouts, annotations
// ═══════════════════════════════════════════════════════════════════

interface SpeechBubbleProps {
  x: number;
  y: number;
  /** Text content inside the bubble */
  text: string;
  delay: number;
  duration?: number;
  /** Direction the tail points toward */
  tailDirection?: 'left' | 'right' | 'bottom' | 'top';
  /** Tail length in pixels */
  tailLength?: number;
  /** Background color */
  bgColor?: string;
  /** Text color */
  textColor?: string;
  /** Border color */
  borderColor?: string;
  /** Max width of the bubble */
  maxWidth?: number;
  /** Font size */
  fontSize?: number;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  x,
  y,
  text,
  delay,
  duration = 15,
  tailDirection = 'left',
  tailLength = 30,
  bgColor = 'rgba(255,255,255,0.08)',
  textColor = '#FFFFFF',
  borderColor = 'rgba(255,255,255,0.3)',
  maxWidth = 400,
  fontSize = 20,
}) => {
  const f = useCurrentFrame();

  const op = interpolate(f, [delay, delay + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(f, [delay, delay + duration], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const blur = interpolate(f, [delay, delay + 10], [6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tail SVG based on direction
  const tailSvg = React.useMemo(() => {
    const w = 20;
    const h = tailLength;
    let points = '';
    let svgStyle: React.CSSProperties = {};

    switch (tailDirection) {
      case 'left':
        points = `${w},0 0,${h / 2} ${w},${h}`;
        svgStyle = { position: 'absolute', left: -w, top: '50%', transform: 'translateY(-50%)' };
        break;
      case 'right':
        points = `0,0 ${w},${h / 2} 0,${h}`;
        svgStyle = { position: 'absolute', right: -w, top: '50%', transform: 'translateY(-50%)' };
        break;
      case 'bottom':
        points = `0,0 ${w / 2},${h} ${w},0`;
        svgStyle = { position: 'absolute', bottom: -h, left: '50%', transform: 'translateX(-50%)' };
        break;
      case 'top':
        points = `0,${h} ${w / 2},0 ${w},${h}`;
        svgStyle = { position: 'absolute', top: -h, left: '50%', transform: 'translateX(-50%)' };
        break;
    }

    return (
      <svg
        width={tailDirection === 'bottom' || tailDirection === 'top' ? w : w}
        height={tailDirection === 'bottom' || tailDirection === 'top' ? h : h}
        style={{ ...svgStyle, pointerEvents: 'none' }}
      >
        <polygon points={points} fill={bgColor} stroke={borderColor} strokeWidth={1.5} />
      </svg>
    );
  }, [tailDirection, tailLength, bgColor, borderColor]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: op,
        filter: `blur(${blur}px)`,
        zIndex: 20,
      }}
    >
      {/* Bubble body */}
      <div
        style={{
          position: 'relative',
          maxWidth,
          padding: '16px 24px',
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 16,
          backdropFilter: 'blur(3px)',
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: 1,
            textTransform: 'uppercase' as const,
          }}
        >
          {text}
        </div>
        {/* Tail */}
        {tailSvg}
      </div>
    </div>
  );
};
