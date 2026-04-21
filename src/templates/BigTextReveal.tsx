import React from 'react';
import { useCurrentFrame } from 'remotion';
import { useFadeIn, useScalePunch, useSlideIn } from '../motion/hooks';
import { COLORS, FONTS, TIMING } from '../motion/tokens';

interface BigTextRevealProps {
  subtitle?: string;
  mainText: string;
  startFrame: number;
  endFrame: number;
  accentColor?: string;
}

export const BigTextReveal: React.FC<BigTextRevealProps> = ({
  subtitle,
  mainText,
  startFrame,
  endFrame,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();

  // Timings
  const BLACK_OPEN = TIMING.blackOpen;
  const TEXT_ENTER = BLACK_OPEN;
  const CONCEPT_ENTER = TEXT_ENTER + TIMING.conceptDelay;

  // Hooks use absolute frames, so we add startFrame to the delay
  const textOpacity = useFadeIn(startFrame + TEXT_ENTER, 9);
  const textX = useSlideIn("top", 50, startFrame + TEXT_ENTER, 9);
  
  const conceptScale = useScalePunch(startFrame + CONCEPT_ENTER, 6);
  const conceptOpacity = useFadeIn(startFrame + CONCEPT_ENTER, 4);

  // Fade out logic manually at the very end frame range
  let outOpacity = 1;
  const fadeOutFrames = 5;
  if (frame > endFrame - fadeOutFrames && frame <= endFrame) {
    outOpacity = (endFrame - frame) / fadeOutFrames;
  }

  if (frame < startFrame || frame > endFrame) return null;

  return (
    <div style={{ 
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', opacity: outOpacity,
      backgroundColor: COLORS.background, fontFamily: 'Impact, sans-serif'
    }}>
      {subtitle && (
        <div style={{ 
          opacity: textOpacity, 
          transform: textX, 
          color: COLORS.textPrimary,
          ...FONTS.support,
          marginBottom: 16
        }}>
          {subtitle}
        </div>
      )}
      <div style={{
        color: accentColor, 
        ...FONTS.hero,
        transform: `scale(${conceptScale})`, 
        opacity: conceptOpacity,
      }}>
        {mainText}
      </div>
    </div>
  );
};

