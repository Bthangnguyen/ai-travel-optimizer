import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

// Scene 1 (frames 0 - 105): "YOU WANT TO CHANGE"
export const S1_WantToChange: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - 15, fps, config: { damping: 14, mass: 0.8 } });
  const lineW = interpolate(frame, [30, 70], [0, 600], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const subOp = interpolate(frame, [5, 30], [0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [90, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      <div style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.6)', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 20, opacity: subOp }}>You are watching this because</div>
      <div style={{ fontSize: 100, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: -2, transform: `scale(${interpolate(sp, [0, 1], [0.6, 1])})`, opacity: interpolate(sp, [0, 1], [0, 1]), textShadow: '0 0 40px rgba(255,255,255,0.15)' }}>You want to change</div>
      <div style={{ width: lineW, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 20, borderRadius: 2 }} />
    </div>
  );
};

// Scene 2 (frames 100 - 423): Keywords
const KEYWORDS = [
  { text: '📖  Self-Help Book', delay: 0 },
  { text: '📹  Dozens of Videos', delay: 100 },
  { text: '💪  Build Discipline', delay: 140 },
  { text: '📋  Plan Your Life', delay: 180 },
  { text: '⏰  Wake Up at 5 AM', delay: 240 },
];
export const S2_Keywords: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 100;
  const local = frame - start;
  const fadeIn = interpolate(frame, [start, start + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [390, 423], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeIn * fadeOut }}>
      <div style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 50 }}>You might be holding right now...</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, maxWidth: 1200 }}>
        {KEYWORDS.map((kw, i) => {
          const s = spring({ frame: local - kw.delay, fps, config: { damping: 12, mass: 0.6 } });
          return (
            <div key={i} style={{ padding: '18px 36px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 28, fontWeight: 600, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]) }}>{kw.text}</div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 3 (frames 423 - 620): "One more video... one more book..."
const HOPE_LINES = [
  { text: 'One more video...', delay: 0 },
  { text: 'One more book...', delay: 70 },
  { text: 'Everything will finally click into place.', delay: 110, glow: true },
];
export const S3_FalseHope: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 423;
  const local = frame - start;
  const fadeOut = interpolate(frame, [590, 620], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: fadeOut }}>
      {HOPE_LINES.map((line, i) => {
        const s = spring({ frame: local - line.delay, fps, config: { damping: 14 } });
        return (
          <div key={i} style={{ fontSize: line.glow ? 42 : 36, fontWeight: line.glow ? 700 : 400, color: line.glow ? 'white' : 'rgba(255,255,255,0.7)', fontStyle: 'italic', transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]), textShadow: line.glow ? '0 0 30px rgba(255,255,255,0.3)' : 'none', letterSpacing: 1 }}>{line.text}</div>
        );
      })}
    </div>
  );
};

// Scene 4 (frames 620 - 665): "WRONG."
export const S4_Wrong: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 620;
  const local = frame - start;
  const flash = interpolate(local, [0, 3, 8], [0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slam = spring({ frame: local - 3, fps, config: { damping: 8, mass: 1.2, stiffness: 200 } });
  const fadeOut = interpolate(frame, [650, 665], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fadeOut }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', opacity: flash }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 220, fontWeight: 900, color: '#ff1a1a', letterSpacing: -4, transform: `scale(${interpolate(slam, [0, 1], [3, 1])})`, opacity: interpolate(slam, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }), textShadow: '0 0 60px rgba(255,26,26,0.6), 0 0 120px rgba(255,26,26,0.3)' }}>WRONG.</div>
      </div>
    </div>
  );
};

// Scene 5 (frames 665 - 904): "10,000 HOURS" counter
export const S5_TenThousand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 665;
  const local = frame - start;
  const counter = Math.round(interpolate(local, [10, 50], [0, 10000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  const hoursOp = interpolate(spring({ frame: local - 30, fps, config: { damping: 14 } }), [0, 1], [0, 1]);
  const sub1Op = interpolate(local, [80, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub2Op = interpolate(local, [120, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = interpolate(Math.sin(local / 15), [-1, 1], [0.2, 0.5]);
  const fadeOut = interpolate(frame, [880, 904], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      <div style={{ fontSize: 160, fontWeight: 900, color: 'white', letterSpacing: -4, textShadow: `0 0 80px rgba(255,255,255,${glow})` }}>{counter.toLocaleString('en-US')}</div>
      <div style={{ fontSize: 48, fontWeight: 300, color: 'rgba(255,255,255,0.6)', letterSpacing: 20, textTransform: 'uppercase', opacity: hoursOp, marginTop: -10 }}>Hours</div>
      <div style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginTop: 50, opacity: sub1Op }}>More than <span style={{ color: 'white', fontWeight: 700 }}>6 years</span> of my life</div>
      <div style={{ fontSize: 26, fontWeight: 300, color: 'rgba(255,255,255,0.4)', marginTop: 15, opacity: sub2Op, fontStyle: 'italic' }}>digging through the so-called self-improvement industry.</div>
    </div>
  );
};

// Scene 6 (frames 904 - 1517): Rapid montage "I read... I watched... I tried..."
const TRIED_ITEMS = [
  { text: '📚 I read all the books', delay: 0 },
  { text: '📺 I watched thousands of videos', delay: 70 },
  { text: '🎧 I listened to every podcast', delay: 154 },
  { text: '🛠️ I learned every skill', delay: 237 },
  { text: '⚡ I tried productivity', delay: 348 },
  { text: '🧠 I tried mindset', delay: 422 },
  { text: '✨ I tried manifesting', delay: 487 },
  { text: '🔥 I tried it ALL.', delay: 556, accent: true },
];
export const S6_TriedItAll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 904;
  const local = frame - start;
  const fadeOut = interpolate(frame, [1490, 1517], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: fadeOut }}>
      {TRIED_ITEMS.map((item, i) => {
        const s = spring({ frame: local - item.delay, fps, config: { damping: 12, mass: 0.5 } });
        return (
          <div key={i} style={{ fontSize: item.accent ? 40 : 30, fontWeight: item.accent ? 900 : 500, color: item.accent ? '#ff1a1a' : 'rgba(255,255,255,0.8)', transform: `translateX(${interpolate(s, [0, 1], [-100, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]), letterSpacing: item.accent ? 2 : 0, textShadow: item.accent ? '0 0 20px rgba(255,26,26,0.4)' : 'none' }}>{item.text}</div>
        );
      })}
    </div>
  );
};

// Scene 7 (frames 1517 - 1650): "THE SHOCKING TRUTH"
export const S7_ShockingTruth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 1517;
  const local = frame - start;
  const sp = spring({ frame: local - 10, fps, config: { damping: 10, mass: 1 } });
  const subOp = interpolate(local, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [1630, 1650], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: -2, transform: `scale(${interpolate(sp, [0, 1], [0.5, 1])})`, opacity: interpolate(sp, [0, 1], [0, 1]), textShadow: '0 0 50px rgba(255,255,255,0.2)' }}>The Shocking Truth</div>
      <div style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginTop: 20, opacity: subOp, fontStyle: 'italic' }}>I realized after all that time is this:</div>
    </div>
  );
};

// Scene 8 (frames 1620 - 1920): "500 HOURS"
export const S8_FiveHundred: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 1620; // Starts a bit before Scene 7 fades out completely, mapping to "You don't need..."
  const local = frame - start;

  // "You don't need 10,000 hours"
  const line1Op = interpolate(local, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const strikeW = interpolate(local, [60, 90], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });

  // 500 happens around "You only need about 500 hours" (which starts ~57.2s -> frame 1716)
  // local frame for 500 would be 1716 - 1620 = 96
  const counter = Math.round(interpolate(local, [96, 116], [0, 500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  const counterOp = interpolate(local, [90, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hoursOp = interpolate(spring({ frame: local - 110, fps, config: { damping: 14 } }), [0, 1], [0, 1]);

  // "pointed in the exact right direction" happens around ~60s -> frame 1800 (local 180)
  const subOp = interpolate(local, [180, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Final line around ~62s -> frame 1860 (local 240)
  const finalOp = interpolate(local, [240, 260], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const glow = interpolate(Math.sin(local / 12), [-1, 1], [0.3, 0.7]);

  if (frame < start) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.5)', opacity: line1Op, position: 'relative', marginBottom: 40 }}>
        You don't need 10,000 hours to change your life.
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${strikeW}%`, height: 3, backgroundColor: '#ff1a1a' }} />
      </div>

      <div style={{ fontSize: 180, fontWeight: 900, color: '#4ade80', letterSpacing: -4, opacity: counterOp, textShadow: `0 0 80px rgba(74,222,128,${glow})` }}>{counter}</div>
      <div style={{ fontSize: 48, fontWeight: 300, color: 'rgba(74,222,128,0.7)', letterSpacing: 20, textTransform: 'uppercase', opacity: hoursOp, marginTop: -10 }}>Hours</div>

      <div style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginTop: 50, opacity: subOp }}>pointed in the <span style={{ color: '#4ade80', fontWeight: 700 }}>exact right direction</span></div>

      <div style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,0.4)', marginTop: 15, opacity: finalOp, fontStyle: 'italic' }}>to start changing it permanently.</div>
    </div>
  );
};
