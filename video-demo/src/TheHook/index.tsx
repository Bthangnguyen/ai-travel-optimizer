import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// CORE DNA — Locked components (never modify)
// ═══════════════════════════════════════════════════════════════════
const C = {
  bg: '#0A0A0C',
  white: '#FFFFFF',
  yellow: '#F5E500',
  red: '#CC0000',
  darkRed: '#330000',
  green: '#22C55E',
};

// ── Film Grain ──
const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: 0.05 }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

// ── Vignette ──
const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
);

// ── Cinematic Scene Wrapper (zoom + cross-fade) ──
const Scene: React.FC<{ children: React.ReactNode; start: number; dur: number }> = ({ children, start, dur }) => {
  const frame = useCurrentFrame();
  const end = start + dur;
  if (frame < start || frame >= end) return null;
  const local = frame - start;
  const zoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateRight: 'clamp' });
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [dur - 8, dur], [1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeIn * fadeOut, transform: `scale(${zoom})` }}>
      {children}
    </AbsoluteFill>
  );
};

// ── SVG Icon ──
const Icon: React.FC<{ src: string; w?: number; op?: number; glow?: number }> = ({ src, w = 300, op = 1, glow = 0.5 }) => (
  <div style={{ opacity: op, display: 'flex', justifyContent: 'center' }}>
    <Img src={src} style={{ width: w,
      filter: `invert(1) drop-shadow(0 0 10px rgba(255,255,255,${glow})) drop-shadow(0 0 25px rgba(255,255,255,${glow * 0.3}))` }} />
  </div>
);

// ── Text Animations ──
const BlurReveal: React.FC<{ text: string; color?: string; size?: number; delay?: number; glow?: boolean; style?: React.CSSProperties }> =
  ({ text, color = C.white, size = 60, delay = 0, glow = false, style = {} }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const blur = interpolate(f, [delay, delay + 18], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return (
      <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3, textAlign: 'center',
        textTransform: 'uppercase' as const, lineHeight: 1.3, opacity: op,
        filter: `blur(${blur}px)${glow ? ` drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})` : ''}`,
        ...style }}>
        {text}
      </div>
    );
  };

const ScalePunch: React.FC<{ text: string; color?: string; size?: number; delay?: number }> =
  ({ text, color = C.red, size = 140, delay = 0 }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const s = interpolate(f, [delay, delay + 8], [3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 8, textAlign: 'center',
        textTransform: 'uppercase' as const, opacity: op, transform: `scale(${s})`,
        filter: `drop-shadow(0 0 30px ${color}) drop-shadow(0 0 60px ${color})` }}>
        {text}
      </div>
    );
  };

const WordByWord: React.FC<{ words: string[]; color?: string; size?: number; startDelay?: number; glow?: boolean }> =
  ({ words, color = C.yellow, size = 64, startDelay = 0, glow = false }) => {
    const f = useCurrentFrame();
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18 }}>
        {words.map((word, i) => {
          const d = startDelay + i * 5;
          const op = interpolate(f, [d, d + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(f, [d, d + 8], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
          return (
            <span key={i} style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3,
              textTransform: 'uppercase' as const, opacity: op, transform: `translateY(${y}px)`, display: 'inline-block',
              filter: glow ? `drop-shadow(0 0 15px ${color})` : 'none' }}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

// ── Flowchart Badge ──
const Badge: React.FC<{ text: string; delay: number; strikeDelay?: number; color?: string }> =
  ({ text, delay, strikeDelay, color = C.white }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const x = interpolate(f, [delay, delay + 10], [-30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    const strikeW = strikeDelay ? interpolate(f, [strikeDelay, strikeDelay + 6], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    const strikeOp = strikeDelay ? interpolate(f, [strikeDelay, strikeDelay + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    return (
      <div style={{ opacity: op, transform: `translateX(${x}px)`, position: 'relative', display: 'inline-block' }}>
        <div style={{ padding: '10px 28px', border: `2px solid ${color}`, color, fontSize: 30, fontWeight: 900,
          letterSpacing: 2, textTransform: 'uppercase' as const }}>
          {text}
        </div>
        {strikeDelay && (
          <div style={{ position: 'absolute', top: '50%', left: 0, width: `${strikeW}%`, height: 3,
            backgroundColor: C.red, opacity: strikeOp, transform: 'translateY(-50%)' }} />
        )}
      </div>
    );
  };

// ═══════════════════════════════════════════════════════════════════
// ICONS (Map to available SVGs)
// ═══════════════════════════════════════════════════════════════════
const ICONS = {
  person: staticFile("icons/Business Pictograms/employee-svgrepo-com.svg"),
  lecture: staticFile("icons/Business Pictograms/lecture-conference-svgrepo-com.svg"),
  celebration: staticFile("icons/Business Pictograms/celebration-businessmen-svgrepo-com.svg"),
};

// ═══════════════════════════════════════════════════════════════════
// 8 SCENES — "THE HOOK" (32 seconds = 960 frames @ 30fps)
// ═══════════════════════════════════════════════════════════════════

// Timeline: [0, 120, 270, 345, 465, 645, 735, 885, 960]
const T = [0, 120, 270, 345, 465, 645, 735, 885];
const D = [120, 150, 75, 120, 180, 90, 150, 75];

// Scene 1: text_only — "YOU ARE WATCHING THIS BECAUSE YOU WANT TO CHANGE"
const S1: React.FC = () => (
  <Scene start={T[0]} dur={D[0]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 200px' }}>
      <WordByWord words={['YOU','ARE','WATCHING','THIS','BECAUSE','YOU','WANT','TO','CHANGE']} color={C.yellow} size={64} startDelay={5} glow />
    </div>
  </Scene>
);

// Scene 2: environment_scene — Person with books/videos
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - T[1];
  const iconOp = interpolate(local, [5, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const iconY = interpolate(local, [5, 18], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <Scene start={T[1]} dur={D[1]}>
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${iconY}px)` }}>
        <Icon src={ICONS.lecture} w={380} op={iconOp} glow={0.4} />
      </div>
      <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0 }}>
        <BlurReveal text="ONE MORE VIDEO..." color={C.white} size={50} delay={T[1] + 25} />
      </div>
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0 }}>
        <BlurReveal text="ONE MORE BOOK..." color={C.white} size={50} delay={T[1] + 40} />
      </div>
    </Scene>
  );
};

// Scene 3: ★ RARE ★ text_only — "WRONG." (scale_punch)
const S3: React.FC = () => (
  <Scene start={T[2]} dur={D[2]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <ScalePunch text="WRONG." color={C.red} size={160} delay={T[2] + 5} />
    </div>
  </Scene>
);

// Scene 4: single_character_with_text — "10,000 HOURS"
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - T[3];
  const iconOp = interpolate(local, [5, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[3]} dur={D[3]}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 100 }}>
        <div style={{ flex: '0 0 auto' }}>
          <Icon src={ICONS.person} w={320} op={iconOp} glow={0.4} />
        </div>
        <div>
          <BlurReveal text="10,000" color={C.yellow} size={120} delay={T[3] + 10} glow />
          <BlurReveal text="HOURS" color={C.yellow} size={80} delay={T[3] + 18} glow style={{ marginTop: -10 }} />
          <BlurReveal text="6 YEARS OF MY LIFE" color={C.white} size={32} delay={T[3] + 30} style={{ marginTop: 30, opacity: 0.8 }} />
        </div>
      </div>
    </Scene>
  );
};

// Scene 5: flowchart + ★ RARE strikethrough ★
// Flow: All badges fade in one-by-one → pause → then strikethrough sweeps all
// NOTE: Badge uses global frame, so all delays offset by T[4] (=465)
const S5: React.FC = () => {
  const items = ['BOOKS', 'VIDEOS', 'PODCASTS', 'PRODUCTIVITY', 'MINDSET', 'MANIFESTING'];
  const offset = T[4];              // = 465 (scene start in global timeline)
  const badgeGap = 12;              // frames between each badge appearing
  const firstBadge = offset + 15;   // first badge at global frame 480
  const lastBadgeEnd = firstBadge + (items.length - 1) * badgeGap + 10; // ~555
  const strikePause = 20;           // pause after all visible
  const strikeGap = 8;              // frames between each strikethrough
  return (
    <Scene start={T[4]} dur={D[4]}>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0 }}>
        <BlurReveal text="I TRIED EVERYTHING" color={C.white} size={48} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'center',
        position: 'absolute', top: 220, left: 150, right: 150, bottom: 150 }}>
        {items.map((item, i) => (
          <Badge key={i} text={item} delay={firstBadge + i * badgeGap} strikeDelay={lastBadgeEnd + strikePause + i * strikeGap} color={C.white} />
        ))}
      </div>
    </Scene>
  );
};

// Scene 6: text_only — "THE SHOCKING TRUTH"
const S6: React.FC = () => (
  <Scene start={T[5]} dur={D[5]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 200px' }}>
      <BlurReveal text="THE SHOCKING TRUTH" color={C.yellow} size={80} delay={T[5] + 5} glow />
    </div>
  </Scene>
);

// Scene 7: split_screen — 10,000 vs 500
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - T[6];
  const leftOp = interpolate(local, [5, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightOp = interpolate(local, [30, 42], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const strikeW = interpolate(local, [18, 28], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dividerH = interpolate(local, [0, 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[6]} dur={D[6]}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Left — 10,000 (red, crossed out) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: leftOp, backgroundColor: 'rgba(50,0,0,0.3)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ color: C.red, fontSize: 120, fontWeight: 900, letterSpacing: 4, opacity: 0.6 }}>10,000</div>
            <div style={{ position: 'absolute', top: '50%', left: '-5%', width: `${strikeW}%`, height: 5,
              backgroundColor: C.red, transform: 'translateY(-50%)', filter: `drop-shadow(0 0 8px ${C.red})` }} />
          </div>
          <div style={{ color: C.red, fontSize: 28, fontWeight: 700, marginTop: 15, opacity: 0.5 }}>HOURS</div>
        </div>

        {/* Divider */}
        <div style={{ width: 3, backgroundColor: C.white, opacity: 0.3, height: `${dividerH}%`, alignSelf: 'center' }} />

        {/* Right — 500 (yellow, glowing) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: rightOp }}>
          <div style={{ color: C.yellow, fontSize: 140, fontWeight: 900, letterSpacing: 4,
            filter: `drop-shadow(0 0 25px ${C.yellow}) drop-shadow(0 0 50px ${C.yellow})` }}>500</div>
          <div style={{ color: C.yellow, fontSize: 28, fontWeight: 700, marginTop: 15 }}>HOURS</div>
        </div>
      </div>
    </Scene>
  );
};

// Scene 8: text_only — word by word closing
const S8: React.FC = () => (
  <Scene start={T[7]} dur={D[7]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 180px' }}>
      <WordByWord words={['IN', 'THE', 'EXACT', 'RIGHT', 'DIRECTION']} color={C.yellow} size={72} startDelay={T[7] + 5} glow />
    </div>
  </Scene>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════
export const TheHook: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    <S1 /><S2 /><S3 /><S4 /><S5 /><S6 /><S7 /><S8 />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
