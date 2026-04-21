import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';

// ═══════════════════════════════════════════════════════════════════
// DNA TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = { bg: '#0A0A0C', white: '#FFF', yellow: '#F5E500', red: '#CC0000', green: '#22C55E' };

const FilmGrain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 999, pointerEvents: 'none', opacity: 0.05 }}>
      <filter id="g2"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#g2)" />
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
  if (frame < start || frame >= start + dur) return null;
  const local = frame - start;
  const zoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateRight: 'clamp' });
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [dur - 8, dur], [1, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeIn * fadeOut, transform: `scale(${zoom})` }}>{children}</AbsoluteFill>;
};

const OVScene: React.FC<{ children: React.ReactNode; start: number; dur: number; activeIdx: number }> =
  ({ children, start, dur, activeIdx }) => {
    const frame = useCurrentFrame();
    if (frame < start || frame >= start + dur) return null;
    const local = frame - start;
    const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(local, [dur - 5, dur], [1, 0], { extrapolateRight: 'clamp' });
    const baseZoom = interpolate(local, [0, dur], [1, 1.04], { extrapolateRight: 'clamp' });
    const pushZoom = interpolate(local, [dur - 22, dur], [1, 3.5], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
    });
    const origins = ['center 25%', 'center 37%', 'center 50%', 'center 63%', 'center 75%'];
    return (
      <AbsoluteFill style={{ backgroundColor: C.bg, opacity: fadeIn * fadeOut,
        transform: `scale(${baseZoom * pushZoom})`, transformOrigin: origins[activeIdx] }}>
        {children}
      </AbsoluteFill>
    );
  };

// ═══════════════════════════════════════════════════════════════════
// TEXT PRIMITIVES
// ═══════════════════════════════════════════════════════════════════
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
  ({ text, color = C.red, size = 100, delay = 0 }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const s = interpolate(f, [delay, delay + 8], [3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 6, textAlign: 'center',
        textTransform: 'uppercase' as const, opacity: op, transform: `scale(${s})`,
        filter: `drop-shadow(0 0 30px ${color}) drop-shadow(0 0 60px ${color})` }}>{text}</div>
    );
  };

const Badge: React.FC<{ text: string; delay: number; color?: string }> =
  ({ text, delay, color = C.white }) => {
    const f = useCurrentFrame();
    const op = interpolate(f, [delay, delay + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const x = interpolate(f, [delay, delay + 10], [-30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ opacity: op, transform: `translateX(${x}px)`, display: 'inline-block' }}>
        <div style={{ padding: '10px 28px', border: `2px solid ${color}`, color, fontSize: 26, fontWeight: 900,
          letterSpacing: 2, textTransform: 'uppercase' as const }}>{text}</div>
      </div>
    );
  };

// ═══════════════════════════════════════════════════════════════════
// LINE PRIMITIVES
// ═══════════════════════════════════════════════════════════════════
const LineNode: React.FC<{
  type: 'icon' | 'word' | 'boxword'; content: string;
  x: number; y: number; delay: number;
  color?: string; size?: number; iconSrc?: string; glow?: boolean;
}> = ({ type, content, x, y, delay, color = C.white, size = 36, iconSrc, glow = false }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [delay, delay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s = interpolate(f, [delay, delay + 12], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const gf = glow ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 25px ${color})` : 'none';
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, opacity: op, filter: gf }}>
      {type === 'icon' && iconSrc && <Img src={iconSrc} style={{ width: size * 3, filter: `invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.5))` }} />}
      {type === 'word' && <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>{content}</div>}
      {type === 'boxword' && <div style={{ padding: '8px 24px', border: `2px solid ${color}`, color, fontSize: size * 0.85, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const, whiteSpace: 'nowrap', backgroundColor: `${color}08` }}>{content}</div>}
    </div>
  );
};

const AnimLine: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  delay: number; duration?: number; color?: string; arrow?: boolean; thickness?: number;
}> = ({ x1, y1, x2, y2, delay, duration = 15, color = C.white, arrow = true, thickness = 2 }) => {
  const f = useCurrentFrame();
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const progress = interpolate(f, [delay, delay + duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dashOff = len * (1 - progress);
  const op = interpolate(f, [delay, delay + 3], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const aS = 10;
  const aOp = interpolate(f, [delay + duration - 3, delay + duration], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 5 }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={thickness + 4} opacity={op * 0.2} strokeDasharray={len} strokeDashoffset={dashOff} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={thickness} opacity={op} strokeDasharray={len} strokeDashoffset={dashOff} strokeLinecap="round" />
      {arrow && <polygon points={`${x2},${y2} ${x2 - aS * Math.cos(angle - 0.35)},${y2 - aS * Math.sin(angle - 0.35)} ${x2 - aS * Math.cos(angle + 0.35)},${y2 - aS * Math.sin(angle + 0.35)}`} fill={color} opacity={aOp} />}
    </svg>
  );
};

const Camera: React.FC<{ children: React.ReactNode; keyframes: { frame: number; x: number; y: number; scale: number }[] }> =
  ({ children, keyframes }) => {
    const f = useCurrentFrame();
    if (keyframes.length === 0) return <>{children}</>;
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
    let cx = sorted[0].x, cy = sorted[0].y, cs = sorted[0].scale;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (f >= sorted[i].frame && f <= sorted[i + 1].frame) {
        const t = interpolate(f, [sorted[i].frame, sorted[i + 1].frame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
        cx = sorted[i].x + (sorted[i + 1].x - sorted[i].x) * t;
        cy = sorted[i].y + (sorted[i + 1].y - sorted[i].y) * t;
        cs = sorted[i].scale + (sorted[i + 1].scale - sorted[i].scale) * t;
        break;
      }
      if (f > sorted[i + 1].frame) { cx = sorted[i + 1].x; cy = sorted[i + 1].y; cs = sorted[i + 1].scale; }
    }
    return (
      <div style={{ position: 'absolute', inset: 0, width: 1920, height: 1080,
        transform: `translate(${960 - cx * cs}px, ${540 - cy * cs}px) scale(${cs})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    );
  };

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW FLOWCHART (5 items)
// ═══════════════════════════════════════════════════════════════════
const TOPICS = ['FOCUS & INTEGRITY', 'LEVERAGE MINDSET', 'SOCIAL CONNECTION', 'PLANNING & MINDFULNESS', 'THE INITIAL PUSH'];

const Overview: React.FC<{ offset: number; active: number; completed: number[] }> = ({ offset, active, completed }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: 'absolute', top: 50, left: 0, right: 0 }}>
        <Blur text="THE 5 REAL PRIORITIES" color={C.white} size={36} delay={offset + 5} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, position: 'absolute', top: 160, left: 250, right: 250, bottom: 60 }}>
        {TOPICS.map((topic, i) => {
          const isDone = completed.includes(i);
          const isActive = i === active;
          const bd = offset + 12 + i * 8;
          const op = interpolate(f, [bd, bd + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sv = isActive ? interpolate(f, [bd + 8, bd + 16], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
          let bc = C.white, tc = C.white, bg = 'transparent', gf = 'none', o = 0.35;
          if (isActive) { bc = C.yellow; tc = C.yellow; bg = 'rgba(245,229,0,0.06)'; gf = `drop-shadow(0 0 12px ${C.yellow})`; o = 1; }
          else if (isDone) { bc = C.green; tc = C.green; o = 0.5; }
          return (
            <React.Fragment key={i}>
              <div style={{ opacity: op * o, transform: `scale(${sv})`, filter: gf, width: '100%' }}>
                <div style={{ padding: '14px 30px', border: `2px solid ${bc}`, color: tc,
                  fontSize: 26, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const,
                  textAlign: 'center', backgroundColor: bg, position: 'relative' }}>
                  {isDone && <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 22, color: C.green }}>✓</span>}
                  <span style={{ fontSize: 16, opacity: 0.5, marginRight: 12 }}>0{i + 1}</span>{topic}
                </div>
              </div>
              {i < 4 && <div style={{ opacity: op * 0.25, color: C.white, fontSize: 20 }}>▼</div>}
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
const ICO = {
  person: staticFile("icons/Business Pictograms/employee-svgrepo-com.svg"),
  lecture: staticFile("icons/Business Pictograms/lecture-conference-svgrepo-com.svg"),
  happy: staticFile("icons/Business Pictograms/businessmen-happy-svgrepo-com.svg"),
  secretary: staticFile("icons/Business Pictograms/secretary-svgrepo-com.svg"),
  meeting: staticFile("icons/Business Pictograms/meeting-svgrepo-com.svg"),
};

// ═══════════════════════════════════════════════════════════════════
// TIMELINE — 17 scenes
// ═══════════════════════════════════════════════════════════════════
//          OV1  S1t  S1ln OV2  S2t  S2ch S2pu OV3  S3t  S3rd OV4  S4t  S4ch OV5  S5t  S5fl S5pu
const D = [120,  90, 240,  90,  90, 210,  90,  90,  90, 240,  90,  90, 210,  90,  90, 180,  90];
const T: number[] = []; let a = 0; for (const d of D) { T.push(a); a += d; }
// Total = 2190 frames = 73 seconds

// ═══════════════════════════════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════════════════════════════

const OV1: React.FC = () => (<OVScene start={T[0]} dur={D[0]} activeIdx={0}><Overview offset={T[0]} active={0} completed={[]} /></OVScene>);

// ══ SECTION 1: FOCUS & INTEGRITY ══
const S1_Title: React.FC = () => (
  <Scene start={T[1]} dur={D[1]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
      <Blur text="FOCUS & PERSONAL INTEGRITY" color={C.red} size={64} delay={T[1] + 8} glow />
    </div>
  </Scene>
);

const S1_Line: React.FC = () => {
  const o = T[2];
  const cx = 960, cy = 440;
  const kids = [
    { content: 'HABITS', x: 440, y: 280, color: C.yellow },
    { content: 'INTEGRITY', x: 440, y: 620, color: C.yellow },
    { content: 'DAILY PROMISES', x: 1480, y: 440, color: C.green },
  ];
  return (
    <Scene start={T[2]} dur={D[2]}>
      <Camera keyframes={[
        // Start: zoomed into center icon
        { frame: o, x: cx, y: cy, scale: 2.5 },
        { frame: o + 30, x: cx, y: cy, scale: 2.5 },
        // Sweep to HABITS (top-left)
        { frame: o + 50, x: kids[0].x, y: kids[0].y, scale: 2.2 },
        { frame: o + 80, x: kids[0].x, y: kids[0].y, scale: 2.2 },
        // Sweep to INTEGRITY (bottom-left)
        { frame: o + 100, x: kids[1].x, y: kids[1].y, scale: 2.2 },
        { frame: o + 130, x: kids[1].x, y: kids[1].y, scale: 2.2 },
        // Sweep to DAILY PROMISES (right)
        { frame: o + 150, x: kids[2].x, y: kids[2].y, scale: 2.0 },
        { frame: o + 180, x: kids[2].x, y: kids[2].y, scale: 2.0 },
        // Pull back — full picture
        { frame: o + 210, x: 960, y: 440, scale: 0.95 },
        { frame: o + 235, x: 960, y: 440, scale: 0.95 },
      ]}>
        {/* Center icon — always visible, large */}
        <LineNode type="icon" content="" x={cx} y={cy} delay={o + 5} iconSrc={ICO.lecture} size={70} />
        <LineNode type="word" content="FOCUS" x={cx} y={cy + 120} delay={o + 12} color={C.yellow} size={32} glow />
        {/* Children appear when camera arrives */}
        <AnimLine x1={cx - 60} y1={cy - 50} x2={kids[0].x + 60} y2={kids[0].y + 20} delay={o + 40} color={kids[0].color} duration={10} />
        <LineNode type="boxword" content={kids[0].content} x={kids[0].x} y={kids[0].y} delay={o + 48} color={kids[0].color} size={28} glow />
        <AnimLine x1={cx - 60} y1={cy + 50} x2={kids[1].x + 60} y2={kids[1].y - 20} delay={o + 90} color={kids[1].color} duration={10} />
        <LineNode type="boxword" content={kids[1].content} x={kids[1].x} y={kids[1].y} delay={o + 98} color={kids[1].color} size={28} glow />
        <AnimLine x1={cx + 80} y1={cy} x2={kids[2].x - 80} y2={kids[2].y} delay={o + 140} color={kids[2].color} duration={10} />
        <LineNode type="boxword" content={kids[2].content} x={kids[2].x} y={kids[2].y} delay={o + 148} color={kids[2].color} size={28} glow />
      </Camera>
    </Scene>
  );
};

const OV2: React.FC = () => (<OVScene start={T[3]} dur={D[3]} activeIdx={1}><Overview offset={T[3]} active={1} completed={[0]} /></OVScene>);

// ══ SECTION 2: LEVERAGE MINDSET ══
const S2_Title: React.FC = () => (
  <Scene start={T[4]} dur={D[4]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
      <Blur text="LEVERAGE MINDSET" color={C.yellow} size={68} delay={T[4] + 8} glow />
    </div>
  </Scene>
);

const S2_Chain: React.FC = () => {
  const o = T[5];
  const nodes = [
    { content: 'INFORMATION', x: 250, y: 440, color: C.white },
    { content: 'TOOLS', x: 660, y: 440, color: C.yellow },
    { content: 'PEOPLE', x: 1060, y: 440, color: C.green },
    { content: 'METHODS', x: 1520, y: 440, color: C.yellow },
  ];
  return (
    <Scene start={T[5]} dur={D[5]}>
      <Camera keyframes={[
        // Start zoomed into first word
        { frame: o, x: nodes[0].x, y: nodes[0].y, scale: 2.5 },
        { frame: o + 25, x: nodes[0].x, y: nodes[0].y, scale: 2.5 },
        // Sweep aggressively to TOOLS
        { frame: o + 50, x: nodes[1].x, y: nodes[1].y, scale: 2.2 },
        { frame: o + 70, x: nodes[1].x, y: nodes[1].y, scale: 2.2 },
        // Sweep to PEOPLE
        { frame: o + 95, x: nodes[2].x, y: nodes[2].y, scale: 2.2 },
        { frame: o + 115, x: nodes[2].x, y: nodes[2].y, scale: 2.2 },
        // Sweep to METHODS
        { frame: o + 140, x: nodes[3].x, y: nodes[3].y, scale: 2.0 },
        { frame: o + 160, x: nodes[3].x, y: nodes[3].y, scale: 2.0 },
        // Pull back — full chain visible
        { frame: o + 185, x: 960, y: 440, scale: 0.95 },
        { frame: o + 205, x: 960, y: 440, scale: 0.95 },
      ]}>
        {/* Each word appears when camera arrives */}
        <LineNode type="word" content={nodes[0].content} x={nodes[0].x} y={nodes[0].y} delay={o + 5} color={nodes[0].color} size={44} glow />
        <AnimLine x1={nodes[0].x + 80} y1={nodes[0].y} x2={nodes[1].x - 60} y2={nodes[1].y} delay={o + 30} color={nodes[1].color} thickness={3} duration={10} />
        <LineNode type="word" content={nodes[1].content} x={nodes[1].x} y={nodes[1].y} delay={o + 42} color={nodes[1].color} size={44} glow />
        <AnimLine x1={nodes[1].x + 60} y1={nodes[1].y} x2={nodes[2].x - 60} y2={nodes[2].y} delay={o + 75} color={nodes[2].color} thickness={3} duration={10} />
        <LineNode type="word" content={nodes[2].content} x={nodes[2].x} y={nodes[2].y} delay={o + 87} color={nodes[2].color} size={44} glow />
        <AnimLine x1={nodes[2].x + 60} y1={nodes[2].y} x2={nodes[3].x - 70} y2={nodes[3].y} delay={o + 120} color={nodes[3].color} thickness={3} duration={10} />
        <LineNode type="word" content={nodes[3].content} x={nodes[3].x} y={nodes[3].y} delay={o + 132} color={nodes[3].color} size={44} glow />
      </Camera>
    </Scene>
  );
};

const S2_Punch: React.FC = () => (
  <Scene start={T[6]} dur={D[6]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 100px' }}>
      <Punch text="DO THE RIGHT THING" color={C.yellow} size={90} delay={T[6] + 8} />
    </div>
  </Scene>
);

const OV3: React.FC = () => (<OVScene start={T[7]} dur={D[7]} activeIdx={2}><Overview offset={T[7]} active={2} completed={[0, 1]} /></OVScene>);

// ══ SECTION 3: SOCIAL CONNECTION ══
const S3_Title: React.FC = () => (
  <Scene start={T[8]} dur={D[8]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
      <Blur text="SOCIAL CONNECTION" color={C.green} size={68} delay={T[8] + 8} glow />
    </div>
  </Scene>
);

const S3_Radial: React.FC = () => {
  const o = T[9];
  const cx = 960, cy = 440;
  const kids = [
    { icon: ICO.meeting, word: 'FAMILY', x: 400, y: 240, color: C.yellow },
    { icon: ICO.happy, word: 'FRIENDS', x: 400, y: 640, color: C.yellow },
    { icon: ICO.secretary, word: 'PARTNER', x: 1520, y: 280, color: C.green },
    { icon: ICO.lecture, word: 'MENTOR', x: 1520, y: 600, color: C.green },
  ];
  return (
    <Scene start={T[9]} dur={D[9]}>
      <Camera keyframes={[
        // Start: zoomed into center person
        { frame: o, x: cx, y: cy, scale: 2.5 },
        { frame: o + 25, x: cx, y: cy, scale: 2.5 },
        // Sweep to FAMILY (top-left)
        { frame: o + 45, x: kids[0].x, y: kids[0].y, scale: 2.2 },
        { frame: o + 65, x: kids[0].x, y: kids[0].y, scale: 2.2 },
        // Sweep to FRIENDS (bottom-left)
        { frame: o + 85, x: kids[1].x, y: kids[1].y, scale: 2.2 },
        { frame: o + 105, x: kids[1].x, y: kids[1].y, scale: 2.2 },
        // Sweep to PARTNER (top-right)
        { frame: o + 125, x: kids[2].x, y: kids[2].y, scale: 2.0 },
        { frame: o + 145, x: kids[2].x, y: kids[2].y, scale: 2.0 },
        // Sweep to MENTOR (bottom-right)
        { frame: o + 165, x: kids[3].x, y: kids[3].y, scale: 2.0 },
        { frame: o + 185, x: kids[3].x, y: kids[3].y, scale: 2.0 },
        // Pull back — full picture
        { frame: o + 210, x: 960, y: 440, scale: 0.85 },
        { frame: o + 235, x: 960, y: 440, scale: 0.85 },
      ]}>
        {/* Center person icon — always visible */}
        <LineNode type="icon" content="" x={cx} y={cy} delay={o + 5} iconSrc={ICO.person} size={65} />
        {/* Each child appears when camera sweeps to it */}
        <AnimLine x1={cx - 60} y1={cy - 50} x2={kids[0].x + 50} y2={kids[0].y + 20} delay={o + 35} color={kids[0].color} duration={8} />
        <LineNode type="icon" content="" x={kids[0].x} y={kids[0].y} delay={o + 42} iconSrc={kids[0].icon} size={35} />
        <LineNode type="word" content={kids[0].word} x={kids[0].x} y={kids[0].y + 65} delay={o + 48} color={kids[0].color} size={22} glow />
        <AnimLine x1={cx - 60} y1={cy + 50} x2={kids[1].x + 50} y2={kids[1].y - 20} delay={o + 75} color={kids[1].color} duration={8} />
        <LineNode type="icon" content="" x={kids[1].x} y={kids[1].y} delay={o + 82} iconSrc={kids[1].icon} size={35} />
        <LineNode type="word" content={kids[1].word} x={kids[1].x} y={kids[1].y + 65} delay={o + 88} color={kids[1].color} size={22} glow />
        <AnimLine x1={cx + 80} y1={cy - 30} x2={kids[2].x - 50} y2={kids[2].y + 10} delay={o + 115} color={kids[2].color} duration={8} />
        <LineNode type="icon" content="" x={kids[2].x} y={kids[2].y} delay={o + 122} iconSrc={kids[2].icon} size={35} />
        <LineNode type="word" content={kids[2].word} x={kids[2].x} y={kids[2].y + 65} delay={o + 128} color={kids[2].color} size={22} glow />
        <AnimLine x1={cx + 80} y1={cy + 30} x2={kids[3].x - 50} y2={kids[3].y - 10} delay={o + 155} color={kids[3].color} duration={8} />
        <LineNode type="icon" content="" x={kids[3].x} y={kids[3].y} delay={o + 162} iconSrc={kids[3].icon} size={35} />
        <LineNode type="word" content={kids[3].word} x={kids[3].x} y={kids[3].y + 65} delay={o + 168} color={kids[3].color} size={22} glow />
      </Camera>
    </Scene>
  );
};

const OV4: React.FC = () => (<OVScene start={T[10]} dur={D[10]} activeIdx={3}><Overview offset={T[10]} active={3} completed={[0, 1, 2]} /></OVScene>);

// ══ SECTION 4: PLANNING & MINDFULNESS ══
const S4_Title: React.FC = () => (
  <Scene start={T[11]} dur={D[11]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 140px' }}>
      <Blur text="PLANNING & MINDFULNESS" color={C.yellow} size={64} delay={T[11] + 8} glow />
    </div>
  </Scene>
);

const S4_Chain: React.FC = () => {
  const o = T[12];
  const questions = [
    { content: 'WHAT DO I ACTUALLY WANT?', x: 960, y: 260, color: C.white },
    { content: 'AM I LIVING MY OWN GOALS?', x: 960, y: 480, color: C.yellow },
    { content: 'IS THIS TAKING ME ANYWHERE?', x: 960, y: 700, color: C.red },
  ];
  return (
    <Scene start={T[12]} dur={D[12]}>
      <Camera keyframes={[
        // Start: zoomed into first question
        { frame: o, x: 960, y: questions[0].y, scale: 2.5 },
        { frame: o + 30, x: 960, y: questions[0].y, scale: 2.5 },
        // Drop to second question
        { frame: o + 60, x: 960, y: questions[1].y, scale: 2.2 },
        { frame: o + 90, x: 960, y: questions[1].y, scale: 2.2 },
        // Drop to third question
        { frame: o + 120, x: 960, y: questions[2].y, scale: 2.2 },
        { frame: o + 150, x: 960, y: questions[2].y, scale: 2.2 },
        // Pull back — all 3 visible
        { frame: o + 180, x: 960, y: 440, scale: 0.95 },
        { frame: o + 205, x: 960, y: 440, scale: 0.95 },
      ]}>
        {/* Q1 appears immediately */}
        <LineNode type="word" content={questions[0].content} x={960} y={questions[0].y} delay={o + 5} color={questions[0].color} size={38} glow />
        {/* Line + Q2 */}
        <AnimLine x1={960} y1={questions[0].y + 30} x2={960} y2={questions[1].y - 30} delay={o + 40} color={questions[1].color} duration={10} />
        <LineNode type="word" content={questions[1].content} x={960} y={questions[1].y} delay={o + 52} color={questions[1].color} size={38} glow />
        {/* Line + Q3 */}
        <AnimLine x1={960} y1={questions[1].y + 30} x2={960} y2={questions[2].y - 30} delay={o + 100} color={questions[2].color} duration={10} />
        <LineNode type="word" content={questions[2].content} x={960} y={questions[2].y} delay={o + 112} color={questions[2].color} size={38} glow />
      </Camera>
    </Scene>
  );
};

const OV5: React.FC = () => (<OVScene start={T[13]} dur={D[13]} activeIdx={4}><Overview offset={T[13]} active={4} completed={[0, 1, 2, 3]} /></OVScene>);

// ══ SECTION 5: THE INITIAL PUSH ══
const S5_Title: React.FC = () => (
  <Scene start={T[14]} dur={D[14]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 160px' }}>
      <Blur text="THE INITIAL PUSH" color={C.green} size={68} delay={T[14] + 8} glow />
    </div>
  </Scene>
);

const S5_Flow: React.FC = () => {
  const o = T[15];
  const items = ['WAKE UP ON TIME', 'HARDEST TASK FIRST', 'ONE HARD CONVERSATION', 'FACE YOURSELF', 'GYM FOR 1 WEEK'];
  const gap = 16;
  return (
    <Scene start={T[15]} dur={D[15]}>
      <Blur text="SMALL WINS" color={C.white} size={36} delay={o + 5}
        style={{ position: 'absolute', top: 80, left: 0, right: 0 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'center',
        position: 'absolute', top: 200, left: 100, right: 100, bottom: 120 }}>
        {items.map((item, i) => (
          <Badge key={i} text={item} delay={o + 20 + i * gap} color={C.green} />
        ))}
      </div>
    </Scene>
  );
};

const S5_Punch: React.FC = () => (
  <Scene start={T[16]} dur={D[16]}>
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <Punch text="MOMENTUM" color={C.green} size={120} delay={T[16] + 8} />
    </div>
  </Scene>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — 17 scenes
// ═══════════════════════════════════════════════════════════════════
export const Part2Priorities: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    <OV1 />
    <S1_Title /><S1_Line />
    <OV2 />
    <S2_Title /><S2_Chain /><S2_Punch />
    <OV3 />
    <S3_Title /><S3_Radial />
    <OV4 />
    <S4_Title /><S4_Chain />
    <OV5 />
    <S5_Title /><S5_Flow /><S5_Punch />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
