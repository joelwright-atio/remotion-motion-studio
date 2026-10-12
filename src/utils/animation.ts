// Reusable, frame-driven animation helpers. All motion in Remotion must be a
// pure function of the current frame (never CSS transitions / setTimeout).
import { Easing, interpolate, spring, SpringConfig } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 → 1 over [start, start + duration] frames, eased. */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT_EXPO,
) => interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });

/** Maps a 0→1 progress value to an arbitrary range. */
export const lerp = (p: number, from: number, to: number) => from + (to - from) * p;

/** Physics spring (0 → 1) starting at `delay` frames. */
export const springIn = (
  frame: number,
  fps: number,
  delay = 0,
  config: Partial<SpringConfig> = { damping: 200 },
) => spring({ frame: frame - delay, fps, config });

/** Fades in at the start and out at the end of a `duration`-frame window. */
export const fadeInOut = (frame: number, duration: number, edge = 15) =>
  interpolate(frame, [0, edge, duration - edge, duration], [0, 1, 1, 0], clamp);
