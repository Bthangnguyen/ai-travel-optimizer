import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from 'remotion';
import { StickFigure, StickFigureProps } from '../components/StickFigure';
import { COLORS, FONTS, TIMING } from '../motion/tokens';

export type DarkBeatProps = {
  startFrame: number;
  endFrame: number;
  conceptWord: string;
  supportText: string;
  conceptColor?: string;
  headType?: StickFigureProps['headType'];
  posture?: StickFigureProps['posture'];
};

export const DarkBeat: React.FC<DarkBeatProps> = ({ 
  startFrame,
  endFrame,
  conceptWord, 
  supportText, 
  conceptColor = COLORS.accent,
  headType = 'circle',
  posture = 'upright'
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Only render during this scene's frame range
  if (frame < startFrame || frame > endFrame) return null;

  // Local frame (resets to 0 at the start of this scene)
  const local = frame - startFrame;

  // ── Phase timings (relative to scene start) ──
  const BLACK_OPEN      = TIMING.blackOpen;       // 6f
  const FIGURE_ENTER    = BLACK_OPEN;              // figure fades in at 6f
  const TEXT_ENTER      = FIGURE_ENTER + TIMING.textDelay;   // text enters at 12f
  const CONCEPT_ENTER   = TEXT_ENTER + TIMING.conceptDelay;  // concept word punches at 18f

  // ── Fade out near the end ──
  const sceneDuration = endFrame - startFrame;
  const fadeOutStart = sceneDuration - 5;
  const outOpacity = interpolate(local, [fadeOutStart, sceneDuration], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // ── Figure opacity (fade in 0.3s) ──
  const figureOpacity = interpolate(local, [FIGURE_ENTER, FIGURE_ENTER + 9], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ── Support text: slide + fade ──
  const textOpacity = interpolate(local, [TEXT_ENTER, TEXT_ENTER + 9], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const textSlideX = interpolate(local, [TEXT_ENTER, TEXT_ENTER + 9], [-120, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // ── Concept word: scale punch 1.2→1.0 + fade ──
  const conceptOpacity = interpolate(local, [CONCEPT_ENTER, CONCEPT_ENTER + 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const conceptScale = interpolate(local, [CONCEPT_ENTER, CONCEPT_ENTER + 6], [1.2, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: COLORS.background, 
      flexDirection: "row", 
      fontFamily: "'Impact', 'Arial Black', 'Bebas Neue', sans-serif",
      opacity: outOpacity,
    }}>
      
      {/* LEFT: Text Zone */}
      <div style={{ 
        flex: 1, display: "flex", flexDirection: "column", 
        justifyContent: "center", padding: "0 80px" 
      }}>
        {/* Support Text - White, slides in from left */}
        <div style={{ 
          opacity: textOpacity, 
          transform: `translateX(${textSlideX}px)`,
          color: COLORS.textPrimary, 
          fontSize: FONTS.support.fontSize,
          fontWeight: FONTS.support.fontWeight,
          letterSpacing: FONTS.support.letterSpacing,
          lineHeight: FONTS.support.lineHeight,
          textTransform: "uppercase" as const,
        }}>
          {supportText}
        </div>
        
        {/* Concept Word - Yellow, scale punch */}
        <div style={{ 
          transform: `scale(${conceptScale})`, 
          transformOrigin: 'left center',
          opacity: conceptOpacity,
          color: conceptColor, 
          fontSize: FONTS.hero.fontSize,
          fontWeight: FONTS.hero.fontWeight,
          letterSpacing: FONTS.hero.letterSpacing,
          lineHeight: FONTS.hero.lineHeight,
          textTransform: "uppercase" as const,
          marginTop: 10,
        }}>
          {conceptWord}
        </div>
      </div>
      
      {/* RIGHT: Figure Zone */}
      <div style={{ 
        flex: 1, display: "flex", alignItems: "center", 
        justifyContent: "center", opacity: figureOpacity 
      }}>
        <StickFigure 
          headType={headType} 
          posture={posture}
          delay={0}
          scale={1.5}
        />
      </div>

    </AbsoluteFill>
  );
};
