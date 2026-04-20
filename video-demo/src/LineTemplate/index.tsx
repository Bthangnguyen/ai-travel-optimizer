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
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed={f * 3} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

const Vignette: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 998, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
);

// ═══════════════════════════════════════════════════════════════════
// SCENE WRAPPER
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// LINE PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

/** LineNode — A positioned node that can be icon, word, or boxword */
const LineNode: React.FC<{
  type: 'icon' | 'word' | 'boxword';
  content: string;
  x: number; y: number;
  delay: number;
  color?: string;
  size?: number;
  iconSrc?: string;
  glow?: boolean;
}> = ({ type, content, x, y, delay, color = C.white, size = 36, iconSrc, glow = false }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [delay, delay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s = interpolate(f, [delay, delay + 12], [0.7, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)
  });

  const glowFilter = glow ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 25px ${color})` : 'none';

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `translate(-50%, -50%) scale(${s})`,
      opacity: op, filter: glowFilter,
    }}>
      {type === 'icon' && iconSrc && (
        <Img src={iconSrc} style={{ width: size * 3,
          filter: `invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.5))` }} />
      )}
      {type === 'word' && (
        <div style={{ color, fontSize: size, fontWeight: 900, letterSpacing: 3,
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>{content}</div>
      )}
      {type === 'boxword' && (
        <div style={{ padding: '8px 24px', border: `2px solid ${color}`, color,
          fontSize: size * 0.85, fontWeight: 900, letterSpacing: 2,
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap',
          backgroundColor: `${color}08` }}>{content}</div>
      )}
    </div>
  );
};

/** AnimatedLine — SVG line that draws itself from A to B with optional arrow */
const AnimatedLine: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  delay: number; duration?: number; color?: string; arrow?: boolean; thickness?: number;
}> = ({ x1, y1, x2, y2, delay, duration = 15, color = C.white, arrow = true, thickness = 2 }) => {
  const f = useCurrentFrame();
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const progress = interpolate(f, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const dashOffset = length * (1 - progress);
  const op = interpolate(f, [delay, delay + 3], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Arrow
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const aSize = 10;
  const arrowOp = interpolate(f, [delay + duration - 3, delay + duration], [0, 0.7], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none', zIndex: 5 }}>
      {/* Glow layer */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={thickness + 4} opacity={op * 0.2}
        strokeDasharray={length} strokeDashoffset={dashOffset}
        strokeLinecap="round" />
      {/* Main line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={thickness} opacity={op}
        strokeDasharray={length} strokeDashoffset={dashOffset}
        strokeLinecap="round" />
      {/* Arrowhead */}
      {arrow && (
        <polygon
          points={`${x2},${y2} ${x2 - aSize * Math.cos(angle - 0.35)},${y2 - aSize * Math.sin(angle - 0.35)} ${x2 - aSize * Math.cos(angle + 0.35)},${y2 - aSize * Math.sin(angle + 0.35)}`}
          fill={color} opacity={arrowOp} />
      )}
    </svg>
  );
};

/** Camera — Wraps children and smoothly pans/zooms between focal points */
const Camera: React.FC<{
  children: React.ReactNode;
  keyframes: { frame: number; x: number; y: number; scale: number }[];
}> = ({ children, keyframes }) => {
  const f = useCurrentFrame();
  if (keyframes.length === 0) return <>{children}</>;

  // Sort keyframes
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  // Find current segment
  let cx = sorted[0].x, cy = sorted[0].y, cs = sorted[0].scale;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (f >= sorted[i].frame && f <= sorted[i + 1].frame) {
      const t = interpolate(f, [sorted[i].frame, sorted[i + 1].frame], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });
      cx = sorted[i].x + (sorted[i + 1].x - sorted[i].x) * t;
      cy = sorted[i].y + (sorted[i + 1].y - sorted[i].y) * t;
      cs = sorted[i].scale + (sorted[i + 1].scale - sorted[i].scale) * t;
      break;
    }
    if (f > sorted[i + 1].frame) {
      cx = sorted[i + 1].x;
      cy = sorted[i + 1].y;
      cs = sorted[i + 1].scale;
    }
  }

  // Transform: translate to center the focal point, then scale
  const tx = 960 - cx * cs;
  const ty = 540 - cy * cs;

  return (
    <div style={{
      position: 'absolute', inset: 0, width: 1920, height: 1080,
      transform: `translate(${tx}px, ${ty}px) scale(${cs})`,
      transformOrigin: '0 0',
    }}>
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION LABEL
// ═══════════════════════════════════════════════════════════════════
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
// TIMELINE — 6 demo scenes
// ═══════════════════════════════════════════════════════════════════
const D = [90, 210, 180, 240, 270, 210];
const T: number[] = [];
let acc = 0;
for (const d of D) { T.push(acc); acc += d; }
// Total = 1200 frames = 40 seconds

// ═══════════════════════════════════════════════════════════════════
// S0: TITLE
// ═══════════════════════════════════════════════════════════════════
const S0: React.FC = () => (
  <Scene start={T[0]} dur={D[0]}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <BlurReveal text="LINE TEMPLATE" color={C.yellow} size={72} delay={T[0] + 5} glow />
      <BlurReveal text="CORE STORYTELLING ENGINE" color={C.white} size={28} delay={T[0] + 18} style={{ opacity: 0.5, letterSpacing: 8 }} />
    </div>
  </Scene>
);

// ═══════════════════════════════════════════════════════════════════
// S1: WORD → WORD → WORD (Chain connections)
// "FEAR" → "DOUBT" → "INACTION" → "FAILURE"
// ═══════════════════════════════════════════════════════════════════
const S1: React.FC = () => {
  const o = T[1];
  // Positions: horizontal chain
  const nodes = [
    { content: 'FEAR', x: 260, y: 440, color: C.white },
    { content: 'DOUBT', x: 660, y: 440, color: C.yellow },
    { content: 'INACTION', x: 1100, y: 440, color: C.red },
    { content: 'FAILURE', x: 1580, y: 440, color: C.red },
  ];
  const nodeDelay = 20;
  const lineDelay = 14;

  return (
    <Scene start={T[1]} dur={D[1]}>
      <Label label="LINE TYPE 01" sub="Word → Word chain — Sequential storytelling" delay={o} />

      {/* Title */}
      <BlurReveal text="THE CHAIN OF DESTRUCTION" color={C.white} size={36} delay={o + 5}
        style={{ position: 'absolute', top: 120, left: 0, right: 0 }} />

      {/* Nodes */}
      {nodes.map((n, i) => (
        <LineNode key={i} type="word" content={n.content} x={n.x} y={n.y}
          delay={o + 15 + i * nodeDelay} color={n.color} size={48} glow />
      ))}

      {/* Lines connecting nodes */}
      {nodes.slice(0, -1).map((n, i) => (
        <AnimatedLine key={`l${i}`}
          x1={n.x + 80} y1={n.y}
          x2={nodes[i + 1].x - 80} y2={nodes[i + 1].y}
          delay={o + 15 + (i + 1) * nodeDelay - lineDelay + 5}
          color={nodes[i + 1].color} />
      ))}

      {/* Bottom description */}
      <BlurReveal text="EACH WORD LEADS TO THE NEXT" color={C.white} size={24} delay={o + 100}
        style={{ position: 'absolute', bottom: 200, left: 0, right: 0, opacity: 0.5 }} />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S2: ICON → WORD & WORD → ICON (Mixed connections)
// Icon(person) → "LONELY" → Icon(meeting) → "CONNECTED"
// ═══════════════════════════════════════════════════════════════════
const S2: React.FC = () => {
  const o = T[2];
  return (
    <Scene start={T[2]} dur={D[2]}>
      <Label label="LINE TYPE 02" sub="Icon ↔ Word — Describe icons with words and vice versa" delay={o} />

      <BlurReveal text="FROM ISOLATION TO CONNECTION" color={C.white} size={32} delay={o + 5}
        style={{ position: 'absolute', top: 100, left: 0, right: 0 }} />

      {/* Icon → Word */}
      <LineNode type="icon" content="" x={320} y={450} delay={o + 10} iconSrc={ICONS.person} size={50} />
      <AnimatedLine x1={480} y1={450} x2={620} y2={450} delay={o + 25} color={C.red} />
      <LineNode type="boxword" content="LONELY" x={740} y={450} delay={o + 35} color={C.red} size={32} />

      {/* Word → Icon */}
      <AnimatedLine x1={840} y1={450} x2={1000} y2={450} delay={o + 55} color={C.green} />
      <LineNode type="icon" content="" x={1140} y={450} delay={o + 65} iconSrc={ICONS.meeting} size={50} />
      <AnimatedLine x1={1300} y1={450} x2={1420} y2={450} delay={o + 80} color={C.green} />
      <LineNode type="boxword" content="CONNECTED" x={1580} y={450} delay={o + 90} color={C.green} size={32} />
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S3: CENTER + CHILDREN (Radial layout with zoom)
// Center: Icon(lecture) → 3 children: "KNOWLEDGE", "SKILL", "WISDOM"
// Camera zooms into each child
// ═══════════════════════════════════════════════════════════════════
const S3: React.FC = () => {
  const o = T[3];
  const cx = 960, cy = 460;
  const children = [
    { content: 'KNOWLEDGE', x: 460, y: 260, color: C.yellow },
    { content: 'SKILL', x: 460, y: 680, color: C.green },
    { content: 'WISDOM', x: 1460, y: 460, color: C.yellow },
  ];

  return (
    <Scene start={T[3]} dur={D[3]}>
      <Label label="LAYOUT 01" sub="Center + Children — Radial with camera zoom" delay={o} />

      <Camera keyframes={[
        { frame: o, x: 960, y: 540, scale: 1 },
        { frame: o + 80, x: 960, y: 540, scale: 1 },
        // Zoom into first child
        { frame: o + 100, x: children[0].x, y: children[0].y, scale: 1.8 },
        { frame: o + 130, x: children[0].x, y: children[0].y, scale: 1.8 },
        // Back to overview
        { frame: o + 150, x: 960, y: 540, scale: 1 },
        // Zoom into third child
        { frame: o + 170, x: children[2].x, y: children[2].y, scale: 1.8 },
        { frame: o + 200, x: children[2].x, y: children[2].y, scale: 1.8 },
        // Back to full view
        { frame: o + 220, x: 960, y: 540, scale: 1 },
      ]}>
        {/* Center icon */}
        <LineNode type="icon" content="" x={cx} y={cy} delay={o + 10} iconSrc={ICONS.lecture} size={60} />

        {/* Lines to children */}
        {children.map((child, i) => (
          <AnimatedLine key={`cl${i}`}
            x1={cx + (child.x < cx ? -90 : child.y !== cy ? 0 : 90)}
            y1={cy + (child.y < cy ? -70 : child.y > cy ? 70 : 0)}
            x2={child.x + (child.x < cx ? 100 : child.x > cx ? -100 : 0)}
            y2={child.y + (child.y < cy ? 30 : child.y > cy ? -30 : 0)}
            delay={o + 30 + i * 15}
            color={child.color} />
        ))}

        {/* Child nodes */}
        {children.map((child, i) => (
          <LineNode key={`cn${i}`} type="boxword" content={child.content}
            x={child.x} y={child.y} delay={o + 38 + i * 15}
            color={child.color} size={28} glow />
        ))}
      </Camera>
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S4: CENTER + NESTED CHILDREN (Deep hierarchy)
// Center: Icon → 3 sub-icons → zoom into one → 3 words describe it
// ═══════════════════════════════════════════════════════════════════
const S4: React.FC = () => {
  const o = T[4];
  const cx = 960, cy = 440;

  // Level 1: 3 sub-icons around center
  const subs = [
    { icon: ICONS.person, x: 440, y: 300, label: 'INDIVIDUAL' },
    { icon: ICONS.meeting, x: 440, y: 600, label: 'TEAM' },
    { icon: ICONS.happy, x: 1480, y: 440, label: 'LEADER' },
  ];

  // Level 2: 3 words describing "LEADER" (sub[2])
  const leaderWords = [
    { content: 'VISION', x: 1480, y: 220, color: C.yellow },
    { content: 'COURAGE', x: 1720, y: 440, color: C.green },
    { content: 'EMPATHY', x: 1480, y: 660, color: C.yellow },
  ];

  return (
    <Scene start={T[4]} dur={D[4]}>
      <Label label="LAYOUT 02" sub="Center + Nested Children — Deep hierarchy with progressive zoom" delay={o} />

      <Camera keyframes={[
        { frame: o, x: 960, y: 440, scale: 1 },
        // Show all level 1
        { frame: o + 90, x: 960, y: 440, scale: 1 },
        // Zoom to LEADER
        { frame: o + 120, x: 1480, y: 440, scale: 1.6 },
        // Stay zoomed while level 2 appears
        { frame: o + 220, x: 1480, y: 440, scale: 1.6 },
        // Pull back to see everything
        { frame: o + 250, x: 960, y: 440, scale: 0.85 },
      ]}>
        {/* Center icon */}
        <LineNode type="icon" content="" x={cx} y={cy} delay={o + 8} iconSrc={ICONS.lecture} size={55} />
        <LineNode type="word" content="GROWTH" x={cx} y={cy + 100} delay={o + 15} color={C.yellow} size={28} glow />

        {/* Level 1: sub-icons + labels */}
        {subs.map((sub, i) => (
          <React.Fragment key={`s1_${i}`}>
            <AnimatedLine
              x1={cx + (sub.x < cx ? -90 : 90)} y1={cy + (sub.y < cy ? -20 : sub.y > cy ? 20 : 0)}
              x2={sub.x + (sub.x < cx ? 90 : -90)} y2={sub.y}
              delay={o + 25 + i * 12} color={C.white} />
            <LineNode type="icon" content="" x={sub.x} y={sub.y} delay={o + 35 + i * 12}
              iconSrc={sub.icon} size={40} />
            <LineNode type="word" content={sub.label} x={sub.x} y={sub.y + 80} delay={o + 42 + i * 12}
              color={C.white} size={20} />
          </React.Fragment>
        ))}

        {/* Level 2: words describing LEADER (appears during zoom) */}
        {leaderWords.map((w, i) => (
          <React.Fragment key={`l2_${i}`}>
            <AnimatedLine
              x1={subs[2].x + (w.x === subs[2].x ? 0 : w.x > subs[2].x ? 60 : 0)}
              y1={subs[2].y + (w.y < subs[2].y ? -50 : w.y > subs[2].y ? 50 : 0)}
              x2={w.x + (w.x === subs[2].x ? 0 : w.x > subs[2].x ? -60 : 0)}
              y2={w.y + (w.y < subs[2].y ? 20 : w.y > subs[2].y ? -20 : 0)}
              delay={o + 130 + i * 12} color={w.color} />
            <LineNode type="boxword" content={w.content} x={w.x} y={w.y}
              delay={o + 138 + i * 12} color={w.color} size={22} glow />
          </React.Fragment>
        ))}
      </Camera>
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// S5: MULTI-CENTER (Multiple equal nodes connected horizontally)
// "OBSERVE" ═══> "ANALYZE" ═══> "ADAPT" ═══> "EXECUTE"
// Each center gets a sub-description below
// ═══════════════════════════════════════════════════════════════════
const S5: React.FC = () => {
  const o = T[5];
  const centers = [
    { word: 'OBSERVE', x: 250, y: 400, sub: 'WATCH PATTERNS', color: C.white },
    { word: 'ANALYZE', x: 660, y: 400, sub: 'FIND MEANING', color: C.yellow },
    { word: 'ADAPT', x: 1100, y: 400, sub: 'CHANGE APPROACH', color: C.green },
    { word: 'EXECUTE', x: 1540, y: 400, sub: 'TAKE ACTION', color: C.yellow },
  ];

  return (
    <Scene start={T[5]} dur={D[5]}>
      <Label label="LAYOUT 03" sub="Multi-Center — Equal nodes connected by bold lines" delay={o} />

      <BlurReveal text="THE PROCESS" color={C.white} size={32} delay={o + 5}
        style={{ position: 'absolute', top: 100, left: 0, right: 0 }} />

      <Camera keyframes={[
        { frame: o, x: 960, y: 440, scale: 1 },
        { frame: o + 80, x: 960, y: 440, scale: 1 },
        // Pan to follow the chain
        { frame: o + 100, x: 660, y: 400, scale: 1.4 },
        { frame: o + 130, x: 1100, y: 400, scale: 1.4 },
        { frame: o + 160, x: 960, y: 440, scale: 1 },
      ]}>
        {/* Center words — bold, large */}
        {centers.map((c, i) => (
          <React.Fragment key={`mc${i}`}>
            <LineNode type="word" content={c.word} x={c.x} y={c.y}
              delay={o + 15 + i * 18} color={c.color} size={44} glow />
            {/* Sub-description */}
            <LineNode type="boxword" content={c.sub} x={c.x} y={c.y + 80}
              delay={o + 22 + i * 18} color={c.color} size={16} />
          </React.Fragment>
        ))}

        {/* Thick connecting lines */}
        {centers.slice(0, -1).map((c, i) => (
          <AnimatedLine key={`mcl${i}`}
            x1={c.x + 100} y1={c.y}
            x2={centers[i + 1].x - 100} y2={centers[i + 1].y}
            delay={o + 15 + (i + 1) * 18 - 8}
            color={centers[i + 1].color}
            thickness={3} />
        ))}
      </Camera>
    </Scene>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
export const LineTemplate: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: "'Impact','Arial Black','Helvetica Neue',sans-serif" }}>
    <S0 /><S1 /><S2 /><S3 /><S4 /><S5 />
    <FilmGrain />
    <Vignette />
  </AbsoluteFill>
);
