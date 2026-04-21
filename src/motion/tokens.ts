// ── Color tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
  background:  "#000000",
  figure:      "#FFFFFF",
  textPrimary: "#FFFFFF",
  accent:      "#F5E500",  // yellow — concept word
  label:       "#CC0000",  // red — stamp/badge
} as const;

// ── Typography tokens ─────────────────────────────────────────────────────────
export const FONTS = {
  hero:    { fontSize: 120, fontWeight: 900, letterSpacing: -2, lineHeight: 1   },
  concept: { fontSize:  96, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 },
  support: { fontSize:  40, fontWeight: 700, letterSpacing:  0, lineHeight: 1.3 },
  label:   { fontSize:  32, fontWeight: 700, letterSpacing:  2, lineHeight: 1   },
} as const;

// ── Timing tokens (frames at 30fps) ──────────────────────────────────────────
export const TIMING = {
  blackOpen:       6,   // 0.2s hold before any element
  figureEnter:     9,   // 0.3s fade in duration
  textEnter:       9,   // 0.3s slide+fade duration
  textDelay:       6,   // 6f after figure enters
  conceptDelay:    6,   // 6f after text enters
  snapDuration:    3,   // 0.1s icon snap
  punchDuration:   6,   // 0.2s scale punch
  drawDuration:    15,  // 0.5s arrow self-draw
  staggerOffset:   3,   // 0.1s between staggered items
  idleCycle:       15,  // 0.5s oscillation cycle
} as const;

// ── Spring configs ────────────────────────────────────────────────────────────
export const SPRINGS = {
  snap:   { stiffness: 400, damping: 12,  mass: 0.8 },  // icon pop
  snappy: { stiffness: 200, damping: 20,  mass: 1   },  // normal entrance
  gentle: { stiffness: 100, damping: 15,  mass: 1   },  // soft pulse
} as const;
