import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { ArcPath, PhaseLabel, SpeechBubble, StackList, CrossOut, CircleHighlight } from '../atoms';

// ═══════════════════════════════════════════════════════════════════
// DNA TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };

// ═══════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════
const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: 0.05 }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
);

const Scene: React.FC<{ children: React.ReactNode; start: number; dur: number }> = ({ children, start, dur }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= start + dur) return null;
  const local = frame - start;
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [dur - 8, dur], [1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeIn * fadeOut }}>
      {children}
    </AbsoluteFill>
  );
};

const BlurReveal: React.FC<{ text: string; color?: string; size?: number; delay?: number; glow?: boolean; style?: React.CSSProperties }> =
  ({ text, color = C.white, size = 60, delay = 0, glow = false, style = {} }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const bl = interpolate(f, [delay, delay + 18], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return (
      <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3, textAlign: 'center',
        textTransform: 'uppercase' as const, lineHeight: 1.3, opacity: op,
        filter: `blur(${bl}px)${glow ? ` drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})` : ''}`,
        ...style }}>{text}</div>
    );
  };

const Label: React.FC<{ label: string; sub: string; delay: number }> = ({ label, sub, delay }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [delay, delay + 6], [0, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 20, left: 40, opacity: op, zIndex: 50 }}>
      <div style={{ color: C.yellow, fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' as const }}>{label}</div>
      <div style={{ color: C.white, fontSize: 13, opacity: 0.6, marginTop: 4 }}>{sub}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TIMELINE — 5 scenes × 60 frames each = 300 frames = 10 seconds
// ═══════════════════════════════════════════════════════════════════
const SCENE_DUR = 60;
const T = [0, 60, 120, 180, 240];

// ═══════════════════════════════════════════════════════════════════
// S0: TITLE — "NEW ATOMS"
// ═══════════════════════════════════════════════════════════════════
const S0: React.FC = () => (
  <Scene start={T[0]} dur={SCENE_DUR}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <BlurReveal text="NEW ATOMS" color={C.yellow} size={80} delay={5} glow />
      <BlurReveal text="EXTRACTED FROM · THE DARK NEEDLE" color={C.white} size={22} delay={18} style={{ opacity: 0.5, letterSpacing: 8 }} />
    </div>
  </Scene>
);

// ═══════════════════════════════════════════════════════════════════
// S1: ARC PATH + PHASE LABELS — "Journey Map"
// A large arc with labeled steps along it
// ═══════════════════════════════════════════════════════════════════
const S1: React.FC = () => {
  const o = T[1];
  const arcPoints = [
    { x: 200, y: 700 },
    { x: 560, y: 250 },
    { x: 960, y: 200 },
    { x: 1360, y: 250 },
    { x: 1720, y: 700 },
  ];

  return (
    <Scene start={T[1]} dur={SCENE_DUR}>
      <Label label="ATOM 01" sub="ArcPath + PhaseLabel — Journey Map Composition" delay={o} />

      <BlurReveal text="THE JOURNEY" color={C.white} size={28} delay={o + 3}
        style={{ position: 'absolute', top: 80, left: 0, right: 0 }} />

      {/* Arc path */}
      <ArcPath
        points={arcPoints}
        delay={o + 8}
        duration={25}
        color={C.white}
        thickness={2}
        curvature={-0.5}
        glow={8}
      />

      {/* Phase labels at arc positions */}
      <PhaseLabel x={200} y={620} number={1} subtitle="REALIZE" delay={o + 12} color={C.yellow} />
      <PhaseLabel x={560} y={190} number={2} subtitle="ACCEPT" delay={o + 18} color={C.yellow} />
      <PhaseLabel x={960} y={140} number={3} subtitle="TRANSFORM" delay={o + 24} color={C.green} />
      <PhaseLabel x={1360} y={190} number={4} subtitle="DETACH" delay={o + 30} color={C.yellow} />
      <PhaseLabel x={1720} y={620} number={5} subtitle="LIVE" delay={o + 36} color={C.green} />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S2: SPEECH BUBBLE — "Dialogue Scene"
// ═══════════════════════════════════════════════════════════════════
const S2: React.FC = () => {
  const o = T[2];

  return (
    <Scene start={T[2]} dur={SCENE_DUR}>
      <Label label="ATOM 02" sub="SpeechBubble — Dialogue & Quote Callouts" delay={o} />

      {/* Figure placeholder */}
      <div style={{ position: 'absolute', left: 300, top: 500, transform: 'translate(-50%, -50%)' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid white', margin: '0 auto' }} />
        <div style={{ width: 3, height: 80, backgroundColor: 'white', margin: '0 auto' }} />
      </div>

      {/* Bubbles */}
      <SpeechBubble
        x={600} y={320}
        text="I saw something that reminded me of you..."
        delay={o + 10}
        tailDirection="left"
        fontSize={22}
        maxWidth={350}
      />

      <SpeechBubble
        x={1200} y={500}
        text="Keep it short. Half of the story is enough."
        delay={o + 25}
        tailDirection="bottom"
        borderColor="rgba(245,229,0,0.4)"
        bgColor="rgba(245,229,0,0.06)"
        textColor={C.yellow}
        fontSize={20}
        maxWidth={380}
      />

      <SpeechBubble
        x={900} y={750}
        text="Never explain why it reminded you of her."
        delay={o + 38}
        tailDirection="top"
        borderColor="rgba(204,0,0,0.5)"
        bgColor="rgba(204,0,0,0.06)"
        textColor={C.red}
        fontSize={18}
        maxWidth={400}
      />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S3: STACK LIST — "Rule List"
// ═══════════════════════════════════════════════════════════════════
const S3: React.FC = () => {
  const o = T[3];

  return (
    <Scene start={T[3]} dur={SCENE_DUR}>
      <Label label="ATOM 03" sub="StackList — Staggered Vertical Reveal" delay={o} />

      <BlurReveal text="SIGNS YOU'RE STILL CHASING" color={C.red} size={36} delay={o + 3}
        style={{ position: 'absolute', top: 120, left: 0, right: 0 }} glow />

      <StackList
        x={200} y={260}
        items={[
          "You soften what you said because you're not sure how she took it",
          "You add one more message when you should've stopped",
          "You respond a little too fast",
          "You check if she's online before you text",
          "You overthink every word before hitting send",
        ]}
        delay={o + 15}
        stagger={7}
        fontSize={22}
        gap={20}
        accentColor={C.red}
      />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S4: CROSS OUT + CIRCLE HIGHLIGHT — "Do / Don't"
// ═══════════════════════════════════════════════════════════════════
const S4: React.FC = () => {
  const o = T[4];

  return (
    <Scene start={T[4]} dur={SCENE_DUR}>
      <Label label="ATOM 04" sub="CrossOut + CircleHighlight — Negation & Emphasis" delay={o} />

      {/* "DON'T" with CrossOut */}
      <BlurReveal text="CHASE HER" color={C.white} size={72} delay={o + 5}
        style={{ position: 'absolute', top: 280, left: 200, right: 0, textAlign: 'left', width: 500 }} />

      <CrossOut x={450} y={310} size={120} delay={o + 20} color={C.red} thickness={5} />

      {/* "DO" with CircleHighlight */}
      <BlurReveal text="REBUILD YOU" color={C.green} size={72} delay={o + 15} glow
        style={{ position: 'absolute', top: 550, left: 900, right: 0, textAlign: 'left', width: 600 }} />

      <CircleHighlight x={1200} y={590} radius={160} delay={o + 30} color={C.green} thickness={3} />

      {/* Connector label */}
      <BlurReveal text="DON'T" color={C.red} size={28} delay={o + 8}
        style={{ position: 'absolute', top: 200, left: 200, letterSpacing: 8 }} />
      <BlurReveal text="DO" color={C.green} size={28} delay={o + 18}
        style={{ position: 'absolute', top: 470, left: 900, letterSpacing: 8 }} />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
export const AtomShowcase: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    <S0 /><S1 /><S2 /><S3 /><S4 />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
