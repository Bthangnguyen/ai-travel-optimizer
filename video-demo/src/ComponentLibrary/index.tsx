import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// CORE DNA TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };

// ═══════════════════════════════════════════════════════════════════
// GLOBAL EFFECTS
// ═══════════════════════════════════════════════════════════════════
const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: 0.05 }}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};

const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
);

// ═══════════════════════════════════════════════════════════════════
// SCENE WRAPPERS
// ═══════════════════════════════════════════════════════════════════
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

const OVScene: React.FC<{ children: React.ReactNode; start: number; dur: number; activeIdx: number }> =
  ({ children, start, dur, activeIdx }) => {
    const frame = useCurrentFrame();
    const end = start + dur;
    if (frame < start || frame >= end) return null;
    const local = frame - start;
    const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(local, [dur - 5, dur], [1, 0], { extrapolateRight: 'clamp' });
    const baseZoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateRight: 'clamp' });
    const pushZoom = interpolate(local, [dur - 22, dur], [1, 3.5], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
    });
    const origins = ['center 35%', 'center 50%', 'center 68%'];
    return (
      <AbsoluteFill style={{
        backgroundColor: C.bg, opacity: fadeIn * fadeOut,
        transform: `scale(${baseZoom * pushZoom})`, transformOrigin: origins[activeIdx],
      }}>
        {children}
      </AbsoluteFill>
    );
  };

// ═══════════════════════════════════════════════════════════════════
// ANIMATION PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

/** BlurReveal — Text fades in from blurred to sharp */
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

/** ScalePunch — Text slams in from large scale with glow */
const ScalePunch: React.FC<{ text: string; color?: string; size?: number; delay?: number }> =
  ({ text, color = C.red, size = 120, delay = 0 }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const s = interpolate(f, [delay, delay + 8], [3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 6, textAlign: 'center',
        textTransform: 'uppercase' as const, opacity: op, transform: `scale(${s})`,
        filter: `drop-shadow(0 0 30px ${color}) drop-shadow(0 0 60px ${color})` }}>{text}</div>
    );
  };

/** WordByWord — Each word appears sequentially */
const WordByWord: React.FC<{ words: string[]; color?: string; size?: number; start?: number; glow?: boolean }> =
  ({ words, color = C.yellow, size = 64, start = 0, glow = false }) => {
    const f = useCurrentFrame();
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18 }}>
        {words.map((w, i) => {
          const d = start + i * 5;
          const op = interpolate(f, [d, d + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(f, [d, d + 8], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
          return <span key={i} style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3,
            textTransform: 'uppercase' as const, opacity: op, transform: `translateY(${y}px)`, display: 'inline-block',
            filter: glow ? `drop-shadow(0 0 15px ${color})` : 'none' }}>{w}</span>;
        })}
      </div>
    );
  };

/** Badge — Box with text + optional strikethrough */
const Badge: React.FC<{ text: string; delay: number; strikeDelay?: number; color?: string }> =
  ({ text, delay, strikeDelay, color = C.white }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const x = interpolate(f, [delay, delay + 10], [-30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    const sw = strikeDelay ? interpolate(f, [strikeDelay, strikeDelay + 8], [0, 110], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    const so = strikeDelay ? interpolate(f, [strikeDelay, strikeDelay + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    return (
      <div style={{ opacity: op, transform: `translateX(${x}px)`, position: 'relative', display: 'inline-block' }}>
        <div style={{ padding: '10px 28px', border: `2px solid ${color}`, color, fontSize: 28, fontWeight: 900,
          letterSpacing: 2, textTransform: 'uppercase' as const }}>{text}</div>
        {strikeDelay && (
          <div style={{ position: 'absolute', top: '50%', left: '-5%', width: `${sw}%`, height: 4,
            backgroundColor: C.red, opacity: so, transform: 'translateY(-50%)',
            filter: `drop-shadow(0 0 6px ${C.red})` }} />
        )}
      </div>
    );
  };

/** SvgIcon — Renders SVG with white invert + glow */
const SvgIcon: React.FC<{ src: string; w?: number; op?: number; glow?: number }> = ({ src, w = 300, op = 1, glow = 0.5 }) => (
  <div style={{ opacity: op, display: 'flex', justifyContent: 'center' }}>
    <Img src={src} style={{ width: w,
      filter: `invert(1) drop-shadow(0 0 10px rgba(255,255,255,${glow})) drop-shadow(0 0 25px rgba(255,255,255,${glow * 0.3}))` }} />
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW FLOWCHART (Navigation Spine)
// ═══════════════════════════════════════════════════════════════════
const OverviewFlowchart: React.FC<{ offset: number; active: number; completed: number[]; items: string[] }> = ({ offset, active, completed, items }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0 }}>
        <BlurReveal text="OVERVIEW FLOWCHART" color={C.white} size={42} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, position: 'absolute', top: 230, left: 200, right: 200, bottom: 120 }}>
        {items.map((topic, i) => {
          const isCompleted = completed.includes(i);
          const isActive = i === active;
          const boxDelay = offset + 15 + i * 12;
          const op = interpolate(f, [boxDelay, boxDelay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const scaleVal = isActive
            ? interpolate(f, [boxDelay + 10, boxDelay + 18], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 1;
          let borderColor = C.white, textColor = C.white, bgColor = 'transparent', glowFilter = 'none', opacity = 0.4;
          if (isActive) {
            borderColor = C.yellow; textColor = C.yellow; bgColor = 'rgba(245, 229, 0, 0.06)';
            glowFilter = `drop-shadow(0 0 15px ${C.yellow}) drop-shadow(0 0 30px rgba(245,229,0,0.3))`; opacity = 1;
          } else if (isCompleted) { borderColor = C.green; textColor = C.green; opacity = 0.6; }
          return (
            <React.Fragment key={i}>
              <div style={{ opacity: op * opacity, transform: `scale(${scaleVal})`, filter: glowFilter, width: '100%' }}>
                <div style={{ padding: '20px 40px', border: `3px solid ${borderColor}`, color: textColor,
                  fontSize: 32, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const,
                  textAlign: 'center', backgroundColor: bgColor, position: 'relative' }}>
                  {isCompleted && <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 28, color: C.green }}>✓</span>}
                  <span style={{ fontSize: 20, opacity: 0.5, marginRight: 15 }}>0{i + 1}</span>
                  {topic}
                </div>
              </div>
              {i < items.length - 1 && <div style={{ opacity: op * 0.3, color: C.white, fontSize: 28 }}>▼</div>}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════
const ICONS = {
  person: staticFile("icons/Business Pictograms/employee-svgrepo-com.svg"),
  lecture: staticFile("icons/Business Pictograms/lecture-conference-svgrepo-com.svg"),
  happy: staticFile("icons/Business Pictograms/businessmen-happy-svgrepo-com.svg"),
  secretary: staticFile("icons/Business Pictograms/secretary-svgrepo-com.svg"),
  meeting: staticFile("icons/Business Pictograms/meeting-svgrepo-com.svg"),
};

// ═══════════════════════════════════════════════════════════════════
// SECTION LABEL — Shows which section we're demoing
// ═══════════════════════════════════════════════════════════════════
const SectionLabel: React.FC<{ label: string; sub: string; delay: number }> = ({ label, sub, delay }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [delay, delay + 6], [0, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 20, left: 40, opacity: op }}>
      <div style={{ color: C.yellow, fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' as const }}>{label}</div>
      <div style={{ color: C.white, fontSize: 13, opacity: 0.6, marginTop: 4 }}>{sub}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TIMELINE — 11 demo sections
// ═══════════════════════════════════════════════════════════════════
const D = [90, 120, 120, 120, 150, 90, 120, 150, 180, 120, 150];
const T: number[] = [];
let acc = 0;
for (const d of D) { T.push(acc); acc += d; }
// Total = 1410 frames = 47 seconds

// ─── S0: Title ───
const S0: React.FC = () => (
  <Scene start={T[0]} dur={D[0]}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <BlurReveal text="COMPONENT LIBRARY" color={C.yellow} size={72} delay={T[0] + 5} glow />
      <BlurReveal text="THE DARK NEEDLE ENGINE" color={C.white} size={28} delay={T[0] + 18} style={{ opacity: 0.5, letterSpacing: 8 }} />
    </div>
  </Scene>
);

// ─── S1: BlurReveal Demo ───
const S1: React.FC = () => (
  <Scene start={T[1]} dur={D[1]}>
    <SectionLabel label="PRIMITIVE 01" sub="BlurReveal — blur(15→0) + opacity(0→1)" delay={T[1]} />
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      <BlurReveal text="BLUR REVEAL" color={C.white} size={70} delay={T[1] + 10} />
      <BlurReveal text="WITH GLOW" color={C.yellow} size={50} delay={T[1] + 30} glow />
      <BlurReveal text="RED ALERT" color={C.red} size={50} delay={T[1] + 50} glow />
    </div>
  </Scene>
);

// ─── S2: WordByWord Demo ───
const S2: React.FC = () => (
  <Scene start={T[2]} dur={D[2]}>
    <SectionLabel label="PRIMITIVE 02" sub="WordByWord — Each word fades in sequentially" delay={T[2]} />
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <WordByWord words={['THIS', 'IS', 'WORD', 'BY', 'WORD']} color={C.yellow} size={72} start={T[2] + 10} glow />
      <WordByWord words={['SMALLER', 'WHITE', 'VARIANT']} color={C.white} size={40} start={T[2] + 40} />
    </div>
  </Scene>
);

// ─── S3: ScalePunch Demo ───
const S3: React.FC = () => (
  <Scene start={T[3]} dur={D[3]}>
    <SectionLabel label="PRIMITIVE 03 ★ RARE" sub="ScalePunch — scale(3→1) + glow explosion" delay={T[3]} />
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <ScalePunch text="IMPACT" color={C.red} size={130} delay={T[3] + 15} />
    </div>
  </Scene>
);

// ─── S4: Badge + Strikethrough Demo ───
const S4: React.FC = () => {
  const offset = T[4];
  return (
    <Scene start={T[4]} dur={D[4]}>
      <SectionLabel label="PRIMITIVE 04 ★ RARE" sub="Badge + Strikethrough — fade in → red line sweep" delay={offset} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center',
        position: 'absolute', top: 200, left: 200, right: 200 }}>
        <Badge text="NORMAL BADGE" delay={offset + 10} color={C.white} />
        <Badge text="WITH STRIKETHROUGH" delay={offset + 25} strikeDelay={offset + 70} color={C.white} />
        <Badge text="DELAYED STRIKE" delay={offset + 40} strikeDelay={offset + 85} color={C.white} />
      </div>
    </Scene>
  );
};

// ─── S5: Template — text_only ───
const S5: React.FC = () => (
  <Scene start={T[5]} dur={D[5]}>
    <SectionLabel label="TEMPLATE 01" sub="text_only — Central text on dark background" delay={T[5]} />
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 180px' }}>
      <BlurReveal text="TEXT ONLY TEMPLATE" color={C.yellow} size={68} delay={T[5] + 10} glow />
    </div>
  </Scene>
);

// ─── S6: Template — single_character_with_text ───
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const iconOp = interpolate(f, [T[6] + 5, T[6] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[6]} dur={D[6]}>
      <SectionLabel label="TEMPLATE 02" sub="single_character_with_text — 1 icon + concept" delay={T[6]} />
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <SvgIcon src={ICONS.lecture} w={340} op={iconOp} glow={0.4} />
      </div>
      <div style={{ position: 'absolute', bottom: 160, left: 0, right: 0 }}>
        <BlurReveal text="CONCEPT WORD" color={C.yellow} size={52} delay={T[6] + 22} glow />
      </div>
    </Scene>
  );
};

// ─── S7: Template — split_screen ───
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const lOp = interpolate(f, [T[7] + 5, T[7] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rOp = interpolate(f, [T[7] + 30, T[7] + 43], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const divH = interpolate(f, [T[7], T[7] + 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lIconOp = interpolate(f, [T[7] + 8, T[7] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rIconOp = interpolate(f, [T[7] + 33, T[7] + 43], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[7]} dur={D[7]}>
      <SectionLabel label="TEMPLATE 03" sub="split_screen — Left vs Right comparison" delay={T[7]} />
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: lOp }}>
          <SvgIcon src={ICONS.happy} w={220} op={lIconOp} glow={0.3} />
          <div style={{ color: C.green, fontSize: 36, fontWeight: 900, marginTop: 30, letterSpacing: 2, textTransform: 'uppercase' as const }}>POSITIVE</div>
          <div style={{ color: C.green, fontSize: 22, fontWeight: 700, marginTop: 6, opacity: 0.6 }}>LEFT SIDE</div>
        </div>
        <div style={{ width: 3, backgroundColor: C.white, opacity: 0.2, height: `${divH}%`, alignSelf: 'center' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: rOp }}>
          <SvgIcon src={ICONS.person} w={220} op={rIconOp} glow={0.3} />
          <div style={{ color: C.red, fontSize: 36, fontWeight: 900, marginTop: 30, letterSpacing: 2, textTransform: 'uppercase' as const }}>NEGATIVE</div>
          <div style={{ color: C.red, fontSize: 22, fontWeight: 700, marginTop: 6, opacity: 0.6 }}>RIGHT SIDE</div>
        </div>
      </div>
    </Scene>
  );
};

// ─── S8: Template — flowchart ───
const S8: React.FC = () => {
  const items = ['STEP ONE', 'STEP TWO', 'STEP THREE', 'STEP FOUR', 'STEP FIVE'];
  const offset = T[8];
  const gap = 14;
  return (
    <Scene start={T[8]} dur={D[8]}>
      <SectionLabel label="TEMPLATE 04" sub="flowchart — Sequential badges appearing one by one" delay={offset} />
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0 }}>
        <BlurReveal text="FLOWCHART DEMO" color={C.white} size={40} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center', alignItems: 'center',
        position: 'absolute', top: 200, left: 120, right: 120, bottom: 120 }}>
        {items.map((item, i) => (
          <Badge key={i} text={item} delay={offset + 20 + i * gap} color={C.white} />
        ))}
      </div>
    </Scene>
  );
};

// ─── S9: Template — environment_scene ───
const S9: React.FC = () => {
  const f = useCurrentFrame();
  const iconOp = interpolate(f, [T[9] + 5, T[9] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[9]} dur={D[9]}>
      <SectionLabel label="TEMPLATE 05" sub="environment_scene — Icon in context with descriptive text" delay={T[9]} />
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <SvgIcon src={ICONS.secretary} w={350} op={iconOp} glow={0.3} />
      </div>
      <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0 }}>
        <BlurReveal text="CONTEXT DESCRIPTION" color={C.white} size={42} delay={T[9] + 22} />
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0 }}>
        <BlurReveal text="SECONDARY DETAIL" color={C.red} size={28} delay={T[9] + 40} />
      </div>
    </Scene>
  );
};

// ─── S10: Template — overview_flowchart (with zoom-push) ───
const S10: React.FC = () => (
  <OVScene start={T[10]} dur={D[10]} activeIdx={0}>
    <SectionLabel label="TEMPLATE 06 ★ NEW" sub="overview_flowchart — Navigation spine with zoom-push transition" delay={T[10]} />
    <OverviewFlowchart offset={T[10]} active={0} completed={[]}
      items={['TOPIC ONE', 'TOPIC TWO', 'TOPIC THREE']} />
  </OVScene>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
export const ComponentLibrary: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    <S0 /><S1 /><S2 /><S3 /><S4 /><S5 /><S6 /><S7 /><S8 /><S9 /><S10 />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
