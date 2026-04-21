import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, Audio } from 'remotion';

// ═══════════════════════════════════════════════════════════════════════════
// CORE DNA: Based on analysis of 28 Dark Needle videos
// ═══════════════════════════════════════════════════════════════════════════

// ── Design Tokens ─────────────────────────────────────────────────────────
const C = { bg: '#000', white: '#FFF', yellow: '#F5E500', red: '#CC0000' };
const GRAIN_OPACITY = 0.06;

// ── Film Grain (Core Effect — 79% of videos) ──────────────────────────────
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  // Pseudo-random grain using SVG filter
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: GRAIN_OPACITY }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed={frame * 3} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

// ── Vignette (Core Effect — 46% but very impactful) ───────────────────────
const Vignette: React.FC = () => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
  }} />
);

// ── Glow wrapper (Core Effect — 96% of videos!) ──────────────────────────
const Glow: React.FC<{ children: React.ReactNode; intensity?: number }> = ({ children, intensity = 0.35 }) => (
  <div style={{ filter: `drop-shadow(0 0 10px rgba(255,255,255,${intensity})) drop-shadow(0 0 20px rgba(255,255,255,${intensity * 0.5}))` }}>
    {children}
  </div>
);

// ── Stick Figure (Core: standing=100%, female dress) ──────────────────────
const StickFigure: React.FC<{
  gender?: 'male' | 'female';
  pose?: 'standing' | 'arms_up' | 'arms_crossed' | 'sitting_chair';
  x?: number; y?: number; scale?: number; color?: string;
  idle?: boolean;
}> = ({ gender = 'male', pose = 'standing', x = 0, y = 0, scale = 1, color = C.white, idle = true }) => {
  const frame = useCurrentFrame();
  // Idle breathing (Core: subtle oscillation)
  const breathe = idle ? Math.sin(frame / 20) * 1.5 : 0;
  const sway = idle ? Math.sin(frame / 30) * 0.8 : 0;

  // Pose-specific arm paths
  const armPaths: Record<string, string> = {
    standing: 'M50,55 Q70,65 80,50 M50,55 Q30,65 20,50',
    arms_up: 'M50,55 Q60,30 75,15 M50,55 Q40,30 25,15',
    arms_crossed: 'M50,55 Q60,60 40,70 M50,55 Q40,60 60,70',
    sitting_chair: 'M50,55 Q65,60 75,55 M50,55 Q35,60 25,55',
  };

  // Pose-specific leg paths
  const legPaths: Record<string, string> = {
    standing: 'M50,90 L35,140 M50,90 L65,140',
    arms_up: 'M50,90 L35,140 M50,90 L65,140',
    arms_crossed: 'M50,90 L35,140 M50,90 L65,140',
    sitting_chair: 'M50,90 Q40,110 35,130 M50,90 Q60,110 65,130',
  };

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `scale(${scale}) rotate(${sway}deg)`,
      transformOrigin: 'bottom center',
    }}>
      <Glow intensity={0.3}>
        <svg width="100" height="150" viewBox="0 0 100 150">
          {/* Head */}
          <circle cx="50" cy="25" r="14" stroke={color} strokeWidth="3" fill="none" />
          {/* Hair for female */}
          {gender === 'female' && (
            <path d="M36,20 Q34,35 30,45" stroke={color} strokeWidth="2.5" fill="none" />
          )}
          {/* Body */}
          <line x1="50" y1="39" x2="50" y2={90 + breathe} stroke={color} strokeWidth="3" />
          {/* Dress for female */}
          {gender === 'female' && (
            <path d={`M50,60 L35,${95 + breathe} L65,${95 + breathe} Z`} stroke={color} strokeWidth="2" fill="none" />
          )}
          {/* Arms */}
          <path d={armPaths[pose] || armPaths.standing} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Legs */}
          <path d={legPaths[pose] || legPaths.standing} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </Glow>
    </div>
  );
};

// ── Chair Prop (Core: 75% of videos) ──────────────────────────────────────
const Chair: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})` }}>
    <Glow intensity={0.2}>
      <svg width="80" height="90" viewBox="0 0 80 90">
        <path d="M15,30 L15,90 M65,30 L65,90 M15,30 L65,30 M10,30 L10,0 L70,0 L70,30" 
              stroke={C.white} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </Glow>
  </div>
);

// ── Arrow Connector (Core: 96% of videos!) ────────────────────────────────
const Arrow: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  color?: string; delay?: number;
}> = ({ x1, y1, x2, y2, color = C.yellow, delay = 0 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const dashOffset = len * (1 - progress);

  return (
    <svg style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' }} width="1920" height="1080">
      <defs>
        <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={color} opacity={progress} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="3" markerEnd="url(#arrowHead)"
            strokeDasharray={len} strokeDashoffset={dashOffset}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
};

// ── Badge Text (Core: 79% of videos!) ─────────────────────────────────────
const BadgeText: React.FC<{
  text: string; color?: string; bgColor?: string;
  x: number; y: number; delay?: number; size?: number;
}> = ({ text, color = C.white, bgColor = 'rgba(255,255,255,0.1)', x, y, delay = 0, size = 24 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [delay, delay + 8], [0.8, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      opacity, transform: `scale(${scale})`,
      padding: '8px 20px',
      border: `2px solid ${color}`,
      backgroundColor: bgColor,
      color, fontSize: size,
      fontWeight: 900, letterSpacing: 2,
      textTransform: 'uppercase' as const,
      fontFamily: "'Impact', 'Arial Black', sans-serif",
    }}>
      {text}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENES — 4 scenes in 20 seconds (600 frames @ 30fps)
// ═══════════════════════════════════════════════════════════════════════════

// Scene 1: text_only (Hook) — Frames 0-120 (4 seconds)
const Scene1TextOnly: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;

  const titleOp = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleBlur = interpolate(local, [0, 12], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOp = interpolate(local, [15, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subBlur = interpolate(local, [15, 27], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoom = interpolate(local, [0, end - start], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [end - start - 5, end - start], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', transform: `scale(${zoom})`, opacity: fadeOut }}>
      <Glow intensity={0.4}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: C.white, fontSize: 90, fontWeight: 900, letterSpacing: 4,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase', opacity: titleOp,
            filter: `blur(${titleBlur}px)`,
          }}>
            SHE LOST INTEREST
          </div>
          <div style={{
            color: C.yellow, fontSize: 50, fontWeight: 700, marginTop: 15,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase', opacity: subOp,
            filter: `blur(${subBlur}px)`,
          }}>
            HERE'S WHY
          </div>
        </div>
      </Glow>
    </AbsoluteFill>
  );
};

// Scene 2: dual_character (Core Layout) — Frames 120-300 (6 seconds)
const Scene2DualCharacter: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;

  const fig1Op = interpolate(local, [5, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fig1X = interpolate(local, [5, 15], [-100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const fig2Op = interpolate(local, [12, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fig2X = interpolate(local, [12, 22], [100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(local, [0, end - start], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [end - start - 5, end - start], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, transform: `scale(${zoom})`, opacity: fadeOut }}>
      {/* Title text */}
      <BadgeText text="YOU CHASED HER" color={C.red} x={680} y={80} delay={25} size={32} />

      {/* Male character — left, desperate */}
      <div style={{ opacity: fig1Op, transform: `translateX(${fig1X}px)` }}>
        <StickFigure gender="male" pose="arms_up" x={400} y={300} scale={3} />
      </div>

      {/* Female character — right, arms crossed */}
      <div style={{ opacity: fig2Op, transform: `translateX(${fig2X}px)` }}>
        <StickFigure gender="female" pose="arms_crossed" x={1150} y={300} scale={3} />
      </div>

      {/* Arrow from male to female */}
      <Arrow x1={650} y1={500} x2={1100} y2={500} color={C.yellow} delay={30} />

      {/* Label under male */}
      <BadgeText text="DESPERATE" color={C.red} bgColor="rgba(204,0,0,0.15)" x={370} y={800} delay={35} size={28} />
      {/* Label under female */}
      <BadgeText text="TURNED OFF" color={C.white} x={1130} y={800} delay={40} size={28} />
    </AbsoluteFill>
  );
};

// Scene 3: single_character_with_text — Frames 300-460 (5.3 seconds)
const Scene3SingleCharacter: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;

  const zoom = interpolate(local, [0, end - start], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const figOp = interpolate(local, [5, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textOp = interpolate(local, [15, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textBlur = interpolate(local, [15, 25], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const conceptScale = interpolate(local, [25, 33], [1.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const conceptOp = interpolate(local, [25, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [end - start - 5, end - start], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, flexDirection: 'row', transform: `scale(${zoom})`, opacity: fadeOut }}>
      {/* Left: Text */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>
        <div style={{
          color: C.white, fontSize: 36, fontWeight: 700, letterSpacing: 2,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase', opacity: textOp,
          filter: `blur(${textBlur}px)`,
        }}>
          SHE DIDN'T FEEL
        </div>
        <div style={{
          color: C.yellow, fontSize: 100, fontWeight: 900, letterSpacing: 4,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase', marginTop: 10,
          transform: `scale(${conceptScale})`, transformOrigin: 'left center',
          opacity: conceptOp,
          filter: `drop-shadow(0 0 20px ${C.yellow})`,
        }}>
          MYSTERY
        </div>
      </div>

      {/* Right: Character */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: figOp }}>
        <StickFigure gender="male" pose="standing" x={0} y={0} scale={4} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: text_only Impact Quote — Frames 460-600 (4.6 seconds)
const Scene4Impact: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const local = frame - start;

  const word1Op = interpolate(local, [5, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const word2Op = interpolate(local, [12, 17], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const word3Op = interpolate(local, [19, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const word3Scale = interpolate(local, [19, 27], [1.4, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const zoom = interpolate(local, [0, end - start], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
      transform: `scale(${zoom})`,
      fontFamily: "'Impact', 'Arial Black', sans-serif",
    }}>
      <Glow intensity={0.5}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.white, fontSize: 60, fontWeight: 700, opacity: word1Op, letterSpacing: 3, textTransform: 'uppercase' }}>
            STOP CHASING.
          </div>
          <div style={{ color: C.white, fontSize: 60, fontWeight: 700, opacity: word2Op, letterSpacing: 3, marginTop: 15, textTransform: 'uppercase' }}>
            START ATTRACTING.
          </div>
          <div style={{
            color: C.yellow, fontSize: 90, fontWeight: 900, opacity: word3Op, letterSpacing: 5,
            marginTop: 25, textTransform: 'uppercase',
            transform: `scale(${word3Scale})`,
            filter: `drop-shadow(0 0 30px ${C.yellow})`,
          }}>
            BE THE PRIZE.
          </div>
        </div>
      </Glow>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════
export const DemoTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* 4 Scenes */}
      <Scene1TextOnly start={0} end={120} />
      <Scene2DualCharacter start={120} end={300} />
      <Scene3SingleCharacter start={300} end={460} />
      <Scene4Impact start={460} end={600} />

      {/* Global Cinematic Effects */}
      <FilmGrain />
      <Vignette />
    </AbsoluteFill>
  );
};
