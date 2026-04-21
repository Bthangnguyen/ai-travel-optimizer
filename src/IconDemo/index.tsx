import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══════════════════════════════════════════════════════════════════════════
// CORE DNA — Shared utilities (khóa cứng, không sửa)
// ═══════════════════════════════════════════════════════════════════════════
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000' };

// Film Grain (Core: 79%)
const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: 0.05 }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

// Vignette
const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
);

// Cinematic Wrapper — Slow zoom + fade out (Core: 75%)
const CinematicWrapper: React.FC<{ children: React.ReactNode; start: number; end: number }> = ({ children, start, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;
  const dur = end - start;
  const zoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [dur - 8, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      backgroundColor: C.bg, opacity: fadeIn * fadeOut, transform: `scale(${zoom})`,
      fontFamily: "'Impact','Arial Black',sans-serif"
    }}>
      {children}
    </AbsoluteFill>
  );
};

// SVG Icon — Invert black SVGs to white + add glow
const SvgIcon: React.FC<{
  src: string; width?: number; opacity?: number; glow?: number;
}> = ({ src, width = 300, opacity = 1, glow = 0.6 }) => (
  <div style={{ opacity, display: 'flex', justifyContent: 'center' }}>
    <Img src={src} style={{
      width,
      filter: `invert(1) drop-shadow(0 0 12px rgba(255,255,255,${glow})) drop-shadow(0 0 30px rgba(255,255,255,${glow * 0.3}))`
    }} />
  </div>
);

// Animated text with blur reveal
const RevealText: React.FC<{
  text: string; color?: string; size?: number; delay?: number;
  glow?: boolean; style?: React.CSSProperties;
}> = ({ text, color = C.white, size = 48, delay = 0, glow = false, style = {} }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const blur = interpolate(frame, [delay, delay + 15], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      color, fontSize: size, fontWeight: 900, letterSpacing: 3,
      textTransform: 'uppercase' as const, textAlign: 'center',
      opacity: op, filter: `blur(${blur}px)${glow ? ` drop-shadow(0 0 20px ${color})` : ''}`,
      ...style
    }}>
      {text}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENES — 3 scenes, 15 seconds (450 frames @ 30fps)
// ═══════════════════════════════════════════════════════════════════════════

const ICONS = {
  employee: staticFile("icons/Business Pictograms/employee-svgrepo-com.svg"),
  secretary: staticFile("icons/Business Pictograms/secretary-svgrepo-com.svg"),
  meeting: staticFile("icons/Business Pictograms/meeting-svgrepo-com.svg"),
  lecture: staticFile("icons/Business Pictograms/lecture-conference-svgrepo-com.svg"),
  happy: staticFile("icons/Business Pictograms/businessmen-happy-svgrepo-com.svg"),
  celebration: staticFile("icons/Business Pictograms/celebration-businessmen-svgrepo-com.svg"),
};

// Scene 1: single_character_with_text — Frame 0~150
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame;
  const iconOp = interpolate(local, [5, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const iconY = interpolate(local, [5, 20], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <CinematicWrapper start={0} end={150}>
      {/* Icon phía trên — chiếm 55% màn hình */}
      <div style={{
        position: 'absolute', top: 150, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        transform: `translateY(${iconY}px)`
      }}>
        <SvgIcon src={ICONS.employee} width={350} opacity={iconOp} glow={0.5} />
      </div>

      {/* Text phía dưới — cách xa icon */}
      <div style={{ position: 'absolute', bottom: 150, left: 0, right: 0 }}>
        <RevealText text="THE 9-5 GRIND" color={C.white} size={64} delay={30} />
      </div>
    </CinematicWrapper>
  );
};

// Scene 2: dual_character — Frame 150~300
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 150;
  const leftOp = interpolate(local, [5, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftX = interpolate(local, [5, 18], [-80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const rightOp = interpolate(local, [15, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightX = interpolate(local, [15, 28], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <CinematicWrapper start={150} end={300}>
      {/* 2 icon song song — tách rời rõ ràng */}
      <div style={{ display: 'flex', height: '65%', alignItems: 'center', justifyContent: 'center', gap: 200, paddingTop: 60 }}>
        {/* Left icon */}
        <div style={{ opacity: leftOp, transform: `translateX(${leftX}px)`, textAlign: 'center' }}>
          <SvgIcon src={ICONS.lecture} width={280} glow={0.4} />
          <RevealText text="ENDLESS TALKS" color={C.red} size={28} delay={25} style={{ marginTop: 30 }} />
        </div>
        {/* Right icon */}
        <div style={{ opacity: rightOp, transform: `translateX(${rightX}px)`, textAlign: 'center' }}>
          <SvgIcon src={ICONS.meeting} width={280} glow={0.4} />
          <RevealText text="DEAD MEETINGS" color={C.white} size={28} delay={35} style={{ marginTop: 30 }} />
        </div>
      </div>

      {/* Bottom impact text */}
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0 }}>
        <RevealText text="IS THIS IT?" color={C.yellow} size={90} delay={70} glow />
      </div>
    </CinematicWrapper>
  );
};

// Scene 3: text_only + character — Frame 300~450
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 300;
  const iconScale = interpolate(local, [5, 25], [1.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const iconOp = interpolate(local, [5, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <CinematicWrapper start={300} end={450}>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ transform: `scale(${iconScale})` }}>
          <SvgIcon src={ICONS.celebration} width={400} opacity={iconOp} glow={0.8} />
        </div>
        <div style={{ marginTop: 120 }}>
          <RevealText text="BREAK THE SYSTEM" color={C.yellow} size={80} delay={35} glow />
        </div>
      </div>
    </CinematicWrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export const IconDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Scene1 />
    <Scene2 />
    <Scene3 />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
