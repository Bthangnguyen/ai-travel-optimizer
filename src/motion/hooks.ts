import { interpolate, spring, Easing, useCurrentFrame, useVideoConfig } from "remotion";

/** opacity 0→1 | default 9f = 0.3s */
export function useFadeIn(delay = 0, durationFrames = 9) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + durationFrames], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** translateX or Y from offset→0 | default 9f, bezier snappy */
export function useSlideIn(
  from: "left" | "right" | "top" | "bottom" = "left",
  offset = 120, delay = 0, durationFrames = 9
) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + durationFrames], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const axis = (from === "left" || from === "right") ? "X" : "Y";
  const sign = (from === "left" || from === "top") ? -1 : 1;
  return `translate${axis}(${sign * offset * (1 - t)}px)`;
}

/** spring scale 0→1 with bounce | for snap/pop entrances */
export function useSnapIn(delay = 0, config = { stiffness: 400, damping: 12, mass: 0.8 }) {
  const frame = useCurrentFrame();
  let { fps } = useVideoConfig(); // fallback
  if (!fps) fps = 30;
  return spring({ frame: frame - delay, fps, from: 0, to: 1, config });
}

/** scale 1.2→1 slam for concept word landing */
export function useScalePunch(delay = 0, durationFrames = 6) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + durationFrames], [1.2, 1.0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** SVG path self-draw: returns strokeDashoffset (totalLength → 0) */
export function useSelfDraw(totalLength: number, delay = 0, durationFrames = 15) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + durationFrames], [totalLength, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** Oscillating idle loop — for hammer swing, tremor, etc. */
export function useIdleOscillate(
  amplitude = 20, cycleFrames = 15, delay = 0
) {
  const frame = useCurrentFrame();
  if (frame < delay) return 0;
  const t = (frame - delay) % cycleFrames;
  return interpolate(t, [0, cycleFrames / 2, cycleFrames], [-amplitude, amplitude, -amplitude], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

/** Stagger helper — returns frame offset for item at index */
export function staggerDelay(index: number, staggerFrames = 3) {
  return index * staggerFrames;
}
