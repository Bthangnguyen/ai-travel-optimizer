import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// CORE DNA
// ═══════════════════════════════════════════════════════════════════
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };

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

// ── OVScene: Overview with zoom-push transition into active topic box ──
// At the end of the scene, camera zooms dramatically toward the active box
const OVScene: React.FC<{ children: React.ReactNode; start: number; dur: number; activeIdx: number }> =
  ({ children, start, dur, activeIdx }) => {
    const frame = useCurrentFrame();
    const end = start + dur;
    if (frame < start || frame >= end) return null;
    const local = frame - start;

    const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(local, [dur - 5, dur], [1, 0], { extrapolateRight: 'clamp' });

    // Base subtle zoom
    const baseZoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateRight: 'clamp' });

    // Zoom-push in last 22 frames → dramatic dive into active box
    const pushZoom = interpolate(local, [dur - 22, dur], [1, 3.5], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });

    // transformOrigin targets the Y-position of each box
    const origins = ['center 35%', 'center 50%', 'center 68%'];

    return (
      <AbsoluteFill style={{
        backgroundColor: C.bg,
        opacity: fadeIn * fadeOut,
        transform: `scale(${baseZoom * pushZoom})`,
        transformOrigin: origins[activeIdx],
      }}>
        {children}
      </AbsoluteFill>
    );
  };

const Icon: React.FC<{ src: string; w?: number; op?: number; glow?: number }> = ({ src, w = 300, op = 1, glow = 0.5 }) => (
  <div style={{ opacity: op, display: 'flex', justifyContent: 'center' }}>
    <Img src={src} style={{ width: w,
      filter: `invert(1) drop-shadow(0 0 10px rgba(255,255,255,${glow})) drop-shadow(0 0 25px rgba(255,255,255,${glow * 0.3}))` }} />
  </div>
);

// ── Text Primitives ──
const Blur: React.FC<{ text: string; color?: string; size?: number; delay?: number; glow?: boolean; style?: React.CSSProperties }> =
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

const Punch: React.FC<{ text: string; color?: string; size?: number; delay?: number }> =
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

const WbW: React.FC<{ words: string[]; color?: string; size?: number; start?: number; glow?: boolean }> =
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

const FlowBadge: React.FC<{ text: string; delay: number; strikeDelay?: number; color?: string }> =
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

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW FLOWCHART — Reusable component
// Shows 3 main topics vertically with arrows between them.
// `active` = currently highlighted (yellow glow)
// `completed` = array of completed indices (green + checkmark)
// ═══════════════════════════════════════════════════════════════════
const TOPICS = [
  'TRENDS ARE NOT THE TRUTH',
  "YOUR DREAM ≠ 30 MINUTES",
  'RESPONSIBILITY ≠ SELF-ABUSE',
];

const OverviewFlowchart: React.FC<{ offset: number; active: number; completed: number[] }> = ({ offset, active, completed }) => {
  const f = useCurrentFrame();
  return (
    <>
      {/* Title */}
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0 }}>
        <Blur text="3 THINGS TO REDEFINE" color={C.white} size={42} delay={offset + 5} />
      </div>

      {/* 3 Topic boxes stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, position: 'absolute', top: 230, left: 200, right: 200, bottom: 120 }}>
        {TOPICS.map((topic, i) => {
          const isCompleted = completed.includes(i);
          const isActive = i === active;
          const boxDelay = offset + 15 + i * 12;
          const op = interpolate(f, [boxDelay, boxDelay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const scaleVal = isActive
            ? interpolate(f, [boxDelay + 10, boxDelay + 18], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 1;

          let borderColor = C.white;
          let textColor = C.white;
          let bgColor = 'transparent';
          let glowFilter = 'none';
          let opacity = 0.4;

          if (isActive) {
            borderColor = C.yellow;
            textColor = C.yellow;
            bgColor = 'rgba(245, 229, 0, 0.06)';
            glowFilter = `drop-shadow(0 0 15px ${C.yellow}) drop-shadow(0 0 30px rgba(245,229,0,0.3))`;
            opacity = 1;
          } else if (isCompleted) {
            borderColor = C.green;
            textColor = C.green;
            opacity = 0.6;
          }

          return (
            <React.Fragment key={i}>
              <div style={{ opacity: op * opacity, transform: `scale(${scaleVal})`, filter: glowFilter, width: '100%' }}>
                <div style={{ padding: '20px 40px', border: `3px solid ${borderColor}`, color: textColor,
                  fontSize: 32, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const,
                  textAlign: 'center', backgroundColor: bgColor, position: 'relative' }}>
                  {isCompleted && (
                    <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 28, color: C.green }}>✓</span>
                  )}
                  <span style={{ fontSize: 20, opacity: 0.5, marginRight: 15 }}>0{i + 1}</span>
                  {topic}
                </div>
              </div>
              {/* Arrow between boxes */}
              {i < 2 && (
                <div style={{ opacity: op * 0.3, color: C.white, fontSize: 28 }}>▼</div>
              )}
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
};

// ═══════════════════════════════════════════════════════════════════
// TIMELINE — 16 scenes
// ═══════════════════════════════════════════════════════════════════
//                    OV1  S1t  S1f  S1c  S1sp OV2  S2t  S2e  S2p  S2w  OV3  S3t  S3sp S3st S3y  S3c
const D =           [120,  90, 180, 120, 150,  90,  90, 120,  90,  90,  90,  90, 150, 150, 120,  90];
const T: number[] = [];
let acc = 0;
for (const d of D) { T.push(acc); acc += d; }
// Total = 1830 frames = 61 seconds

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW → SECTION 1 → OVERVIEW → SECTION 2 → OVERVIEW → SECTION 3
// ═══════════════════════════════════════════════════════════════════

// ── OV1: Overview — highlight #1 → zoom-push into top box ──
const OV1: React.FC = () => (
  <OVScene start={T[0]} dur={D[0]} activeIdx={0}>
    <OverviewFlowchart offset={T[0]} active={0} completed={[]} />
  </OVScene>
);

// ══════ SECTION 1: TRENDS ══════

const S1_Title: React.FC = () => (
  <Scene start={T[1]} dur={D[1]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 180px' }}>
      <Blur text="TRENDS ARE NOT THE TRUTH" color={C.red} size={70} delay={T[1] + 8} glow />
    </div>
  </Scene>
);

const S1_Flow: React.FC = () => {
  const items = ['SYSTEMS', 'MANIFESTING', 'DOPAMINE DETOX', 'DEEP WORK', 'STOICISM', '5AM ROUTINE'];
  const gap = 14;
  const offset = T[2];
  return (
    <Scene start={T[2]} dur={D[2]}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0 }}>
        <Blur text="SOUNDS FAMILIAR?" color={C.white} size={40} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center', alignItems: 'center',
        position: 'absolute', top: 180, left: 120, right: 120, bottom: 120 }}>
        {items.map((item, i) => (
          <FlowBadge key={i} text={item} delay={offset + 20 + i * gap} color={C.white} />
        ))}
      </div>
    </Scene>
  );
};

const S1_Char: React.FC = () => {
  const f = useCurrentFrame();
  const iconOp = interpolate(f, [T[3] + 5, T[3] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[3]} dur={D[3]}>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Icon src={ICONS.lecture} w={340} op={iconOp} glow={0.4} />
      </div>
      <div style={{ position: 'absolute', bottom: 160, left: 0, right: 0 }}>
        <Blur text="THEY USE THEM AS RELIGIONS" color={C.red} size={52} delay={T[3] + 20} glow />
      </div>
    </Scene>
  );
};

const S1_Split: React.FC = () => {
  const f = useCurrentFrame();
  const lOp = interpolate(f, [T[4] + 5, T[4] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rOp = interpolate(f, [T[4] + 30, T[4] + 43], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const divH = interpolate(f, [T[4], T[4] + 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[4]} dur={D[4]}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0 }}>
        <Blur text="A TREND IS JUST A HAMMER" color={C.yellow} size={48} delay={T[4] + 5} glow />
      </div>
      <div style={{ display: 'flex', height: '100%', paddingTop: 180 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: lOp }}>
          <div style={{ color: C.green, fontSize: 56, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const,
            filter: `drop-shadow(0 0 15px ${C.green})` }}>BUILD</div>
          <div style={{ color: C.green, fontSize: 36, fontWeight: 700, marginTop: 10, opacity: 0.7 }}>A HOUSE</div>
        </div>
        <div style={{ width: 3, backgroundColor: C.white, opacity: 0.2, height: `${divH}%`, alignSelf: 'center' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: rOp }}>
          <div style={{ color: C.red, fontSize: 56, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const,
            filter: `drop-shadow(0 0 15px ${C.red})` }}>SMASH</div>
          <div style={{ color: C.red, fontSize: 36, fontWeight: 700, marginTop: 10, opacity: 0.7 }}>YOUR FOOT</div>
        </div>
      </div>
    </Scene>
  );
};

// ── OV2: Overview — #1 done ✓, highlight #2 → zoom-push into center box ──
const OV2: React.FC = () => (
  <OVScene start={T[5]} dur={D[5]} activeIdx={1}>
    <OverviewFlowchart offset={T[5]} active={1} completed={[0]} />
  </OVScene>
);

// ══════ SECTION 2: YOUR DREAM ══════

const S2_Title: React.FC = () => (
  <Scene start={T[6]} dur={D[6]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 150px' }}>
      <Blur text={"YOU CAN'T FIND YOUR DREAM IN 30 MINUTES"} color={C.yellow} size={56} delay={T[6] + 8} glow />
    </div>
  </Scene>
);

const S2_Env: React.FC = () => {
  const f = useCurrentFrame();
  const iconOp = interpolate(f, [T[7] + 5, T[7] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[7]} dur={D[7]}>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Icon src={ICONS.secretary} w={350} op={iconOp} glow={0.3} />
      </div>
      <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0 }}>
        <Blur text="YOUR BRAIN CAN'T FORCE A DREAM" color={C.white} size={42} delay={T[7] + 22} />
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0 }}>
        <Blur text="IT REVEALS ITSELF THROUGH ACTION" color={C.red} size={30} delay={T[7] + 40} />
      </div>
    </Scene>
  );
};

const S2_Punch: React.FC = () => (
  <Scene start={T[8]} dur={D[8]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 120px' }}>
      <Punch text="LIVE HARDER" color={C.yellow} size={110} delay={T[8] + 5} />
    </div>
  </Scene>
);

const S2_Close: React.FC = () => (
  <Scene start={T[9]} dur={D[9]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 150px' }}>
      <WbW words={['DO', 'SOMETHING.', 'LIVE', 'DEEPLY.']} color={C.yellow} size={72} start={T[9] + 8} glow />
    </div>
  </Scene>
);

// ── OV3: Overview — #1-2 done ✓✓, highlight #3 → zoom-push into bottom box ──
const OV3: React.FC = () => (
  <OVScene start={T[10]} dur={D[10]} activeIdx={2}>
    <OverviewFlowchart offset={T[10]} active={2} completed={[0, 1]} />
  </OVScene>
);

// ══════ SECTION 3: RESPONSIBILITY ══════

const S3_Title: React.FC = () => (
  <Scene start={T[11]} dur={D[11]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 140px' }}>
      <Blur text="RESPONSIBILITY IS NOT SELF-ABUSE" color={C.red} size={60} delay={T[11] + 8} glow />
    </div>
  </Scene>
);

const S3_Split: React.FC = () => {
  const f = useCurrentFrame();
  const lOp = interpolate(f, [T[12] + 5, T[12] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rOp = interpolate(f, [T[12] + 30, T[12] + 43], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const divH = interpolate(f, [T[12], T[12] + 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lIconOp = interpolate(f, [T[12] + 8, T[12] + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rIconOp = interpolate(f, [T[12] + 33, T[12] + 43], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Scene start={T[12]} dur={D[12]}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: lOp }}>
          <Icon src={ICONS.happy} w={250} op={lIconOp} glow={0.3} />
          <div style={{ color: C.green, fontSize: 36, fontWeight: 900, marginTop: 40, letterSpacing: 2, textTransform: 'uppercase' as const }}>DISCIPLINED</div>
          <div style={{ color: C.green, fontSize: 24, fontWeight: 700, marginTop: 8, opacity: 0.6 }}>OUTSIDE</div>
        </div>
        <div style={{ width: 3, backgroundColor: C.white, opacity: 0.2, height: `${divH}%`, alignSelf: 'center' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: rOp }}>
          <Icon src={ICONS.person} w={250} op={rIconOp} glow={0.3} />
          <div style={{ color: C.red, fontSize: 36, fontWeight: 900, marginTop: 40, letterSpacing: 2, textTransform: 'uppercase' as const }}>SELF-HATRED</div>
          <div style={{ color: C.red, fontSize: 24, fontWeight: 700, marginTop: 8, opacity: 0.6 }}>INSIDE</div>
        </div>
      </div>
    </Scene>
  );
};

const S3_Strike: React.FC = () => {
  const items = ["I'M SO USELESS", "I'LL NEVER GET BETTER", "I'M A COMPLETE FAILURE"];
  const offset = T[13];
  const gap = 18;
  const firstBadge = offset + 10;
  const allDone = firstBadge + (items.length - 1) * gap + 12;
  const strikeStart = allDone + 15;
  const strikeGap = 10;
  return (
    <Scene start={T[13]} dur={D[13]}>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0 }}>
        <Blur text="STOP SAYING" color={C.white} size={42} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center',
        position: 'absolute', top: 220, left: 200, right: 200 }}>
        {items.map((item, i) => (
          <FlowBadge key={i} text={item} delay={firstBadge + i * gap} strikeDelay={strikeStart + i * strikeGap} color={C.white} />
        ))}
      </div>
    </Scene>
  );
};

const S3_Yes: React.FC = () => (
  <Scene start={T[14]} dur={D[14]}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      <Blur text="YES. THIS IS ON ME." color={C.white} size={60} delay={T[14] + 5} />
      <Blur text="YES. I MESSED UP." color={C.white} size={50} delay={T[14] + 25} />
      <Blur text="YES. I WILL FIX THIS." color={C.yellow} size={56} delay={T[14] + 45} glow />
    </div>
  </Scene>
);

const S3_Close: React.FC = () => (
  <Scene start={T[15]} dur={D[15]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 180px' }}>
      <WbW words={['CLARITY.', 'NOT', 'HUMILIATION.']} color={C.yellow} size={80} start={T[15] + 8} glow />
    </div>
  </Scene>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — 16 scenes
// ═══════════════════════════════════════════════════════════════════
export const Part1Redefine: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    {/* Overview → Section 1 */}
    <OV1 />
    <S1_Title /><S1_Flow /><S1_Char /><S1_Split />
    {/* Overview → Section 2 */}
    <OV2 />
    <S2_Title /><S2_Env /><S2_Punch /><S2_Close />
    {/* Overview → Section 3 */}
    <OV3 />
    <S3_Title /><S3_Split /><S3_Strike /><S3_Yes /><S3_Close />
    {/* Core DNA overlays */}
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
