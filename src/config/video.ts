// Central video settings. Change these to resize / retime every composition
// that spreads VIDEO_DEFAULTS. Durations are authored in seconds.
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const secondsToFrames = (seconds: number, fps: number = VIDEO.fps) =>
  Math.round(seconds * fps);
