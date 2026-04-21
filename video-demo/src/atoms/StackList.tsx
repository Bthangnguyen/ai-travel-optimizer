import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// STACK LIST — Vertical list of text items with staggered reveal
// Usage: Bullet lists, rule lists, stacked reveals, enumerations
// ═══════════════════════════════════════════════════════════════════

interface StackListProps {
  x: number;
  y: number;
  /** Array of text items */
  items: string[];
  delay: number;
  /** Frames between each item appearing */
  stagger?: number;
  /** Animation duration per item */
  itemDuration?: number;
  /** Text color */
  color?: string;
  /** Highlight color for bullet/marker */
  accentColor?: string;
  /** Font size */
  fontSize?: number;
  /** Gap between items */
  gap?: number;
  /** Alignment */
  align?: 'left' | 'center';
  /** Show bullet markers */
  showBullets?: boolean;
  /** Max width */
  maxWidth?: number;
}

export const StackList: React.FC<StackListProps> = ({
  x,
  y,
  items,
  delay,
  stagger = 12,
  itemDuration = 10,
  color = '#FFFFFF',
  accentColor = '#F5E500',
  fontSize = 24,
  gap = 16,
  align = 'left',
  showBullets = true,
  maxWidth = 800,
}) => {
  const f = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: align === 'center' ? 'translateX(-50%)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap,
        maxWidth,
      }}
    >
      {items.map((item, i) => {
        const itemDelay = delay + i * stagger;
        const op = interpolate(f, [itemDelay, itemDelay + itemDuration * 0.6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const slideX = interpolate(f, [itemDelay, itemDelay + itemDuration], [40, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const blur = interpolate(f, [itemDelay, itemDelay + itemDuration * 0.8], [5, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              opacity: op,
              transform: `translateX(${slideX}px)`,
              filter: `blur(${blur}px)`,
            }}
          >
            {showBullets && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: accentColor,
                  borderRadius: '50%',
                  marginTop: fontSize * 0.35,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            )}
            <div
              style={{
                color,
                fontSize,
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: 1,
                textTransform: 'uppercase' as const,
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
};
