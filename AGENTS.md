# Remotion motion-graphics project: agent guide

This project makes videos from React code with **Remotion 4.0.534** (npm, Node 24, React 19, TypeScript, zod 4).
Every frame is a pure function of `useCurrentFrame()`. Rendering runs headless Chrome and FFmpeg, and both come bundled with `@remotion/renderer`.

Official Remotion skills are installed in `.claude/skills/`. Load them for deeper topics: `remotion-best-practices`, `remotion-create`, `remotion-multimedia` (audio/video), `remotion-captions`, `remotion-render`, `remotion-studio`, `remotion-docs`.
Docs: https://www.remotion.dev/docs. A plain-text version for LLMs is at https://www.remotion.dev/llms.txt.

## Layout

```
remotion.config.ts        CLI config (entry point src/index.ts, h264, jpeg frames)
src/index.ts              registerRoot only, do not edit
src/Root.tsx              registers every <Composition>; ids are used to render
src/config/video.ts       VIDEO {width, height, fps} + secondsToFrames()
src/theme.ts              COLORS design tokens
src/utils/animation.ts    progress(), lerp(), springIn(), fadeInOut(), EASE_OUT_EXPO
src/utils/fonts.ts        FONT_FAMILY (Inter via @remotion/google-fonts)
src/components/           reusable animated pieces (AnimatedText, Background, shapes, Underline)
src/compositions/<Name>/  one folder per video; _Template/ is the starting point
public/                   static assets (images/, audio/), referenced with staticFile()
out/                      render output (git-ignored)
```

## Commands

| Task | Command |
|---|---|
| Open Studio (preview) | `npm run dev` (http://localhost:3000) |
| Render the sample MP4 | `npm run render` → `out/showcase.mp4` |
| Render any composition | `npx remotion render <CompositionId> out/<name>.mp4` |
| Render with props | `npx remotion render Showcase out/x.mp4 --props='{"title":"Hi"}'` |
| Still frame | `npx remotion still <Id> out/frame.png --frame=60` |
| List compositions | `npx remotion compositions` |
| Typecheck + lint | `npm run lint` |
| Add a Remotion package | `npx remotion add @remotion/<pkg>` (keeps versions aligned) |
| Upgrade Remotion | `npm run upgrade` |

## Hard rules

1. **Animate only with frames.** Use `useCurrentFrame()`, `interpolate()`, `spring()`, and the helpers in `utils/animation.ts`. Do not use CSS transitions or animations, `setTimeout`, `requestAnimationFrame`, or `Math.random()`. For seeded randomness use `random(seed)` from `remotion`.
2. **Always clamp `interpolate`**: `{extrapolateLeft: "clamp", extrapolateRight: "clamp"}`. `progress()` already clamps.
3. **Use Remotion media components**: `<Img>`, `<Audio>` / `<Video>` (or `<OffthreadVideo>`), `staticFile("images/x.png")`. Do not use a raw `<img>` or `<audio>`.
4. **Keep every `@remotion/*` package on the same exact version as `remotion`.** Install with `npx remotion add`, not a bare `npm i`.
5. **Author timing in seconds and convert with `secondsToFrames()`.** Read `fps`, `width`, and `height` from `useVideoConfig()` and never hard-code them, so changing resolution keeps working.
6. Keep `defaultProps` in `Root.tsx` as an inline object literal, with a zod `schema`, so Studio can edit and save props.
7. Run `npm run lint` before you finish.

## Changing resolution, frame rate, or duration

- **All compositions:** edit `src/config/video.ts` (`width`, `height`, `fps`).
- **One composition:** override `width`/`height`/`fps` on its `<Composition>` in `Root.tsx`.
- **Duration:** compositions compute `durationInFrames` in `calculateMetadata` from props. For Showcase, edit `sceneSeconds` and `transitionSeconds`. Formats: 1080x1920 for vertical and 1080x1080 for square.
- Quick drafts: `--scale=0.5` renders at half size. `--frames=0-89` renders only part of the video.

## Creating a new composition

1. Copy `src/compositions/_Template/` to `src/compositions/MyVideo/` and rename the component, schema, and type.
2. Build scenes as small components. Lay them out in time with `<Sequence from durationInFrames>` or `<Series>`. Inside a Sequence, `useCurrentFrame()` starts at 0.
3. For transitions between scenes, use `TransitionSeries` from `@remotion/transitions` with `fade()`, `slide()`, `wipe()`, `flip()`, or `clockWipe()`. Each transition overlaps two scenes, so total = sum(scenes) − sum(transitions).
4. Register it in `src/Root.tsx`:
   ```tsx
   <Composition id="MyVideo" component={MyVideo} schema={myVideoSchema}
     width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={150}
     defaultProps={{ headline: "Hello", durationInSeconds: 5 }}
     calculateMetadata={({ props }) => ({ durationInFrames: secondsToFrames(props.durationInSeconds) })} />
   ```
5. Check it in Studio, spot-check frames with `npx remotion still MyVideo out/f.png --frame=N`, then render.

## Typography

- Fonts: `loadFont()` from `@remotion/google-fonts/<Family>` at module level, as in `utils/fonts.ts`. For local fonts, put them in `public/fonts` and load them with `@remotion/fonts`.
- `AnimatedText` reveals words with a stagger (spring + rise + blur). For per-character effects, split on `""` and give each `<span>` its own `springIn(frame, fps, delay + i * stagger)`.
- Typewriter effect: `text.slice(0, Math.floor(interpolate(frame, [a, b], [0, text.length], clamp)))`.
- Measure or fit text with `@remotion/layout-utils` (`fitText`, `measureText`). Install it with `npx remotion add @remotion/layout-utils`.

## Graphics

- `@remotion/shapes` (`Circle`, `Rect`, `Triangle`, `Star`, `Pie`, …) or inline SVG. Animate `transform`, `opacity`, `strokeDashoffset` (with `@remotion/paths` `evolvePath()` for line drawing).
- Springs: `{damping: 200}` gives a smooth stop with no bounce. `{damping: 12, mass: 0.6}` gives a playful overshoot.
- Easing: `EASE_OUT_EXPO` for UI-style motion, or `Easing.inOut(Easing.cubic)` for moves.

## Audio

- Put files in `public/audio/` and use `<Audio src={staticFile("audio/music.mp3")} volume={(f) => interpolate(f, [0, 30], [0, 1], clamp)} />`. Volume can be a function of the frame for fades. Use `trimBefore` and `trimAfter` (in frames) to cut.
- To start a sound effect at a moment, wrap it: `<Sequence from={secondsToFrames(2.5)}><Audio src={staticFile("audio/whoosh.mp3")} /></Sequence>`.
- To sync to beats, compute frames from BPM: `beatFrame = Math.round(i * 60 / bpm * fps)`. For reactive visuals, use `@remotion/media-utils` (`useAudioData`, `visualizeAudio`). To fit the composition to the audio length, call `parseMedia` / `getAudioDurationInSeconds` inside `calculateMetadata`.

## Generated audio (Python, `.venv`)

- Setup (once): `py -m venv .venv`, then `.venv/Scripts/python -m pip install numpy piper-tts edge-tts`. The Piper voice model goes in `.venv/piper-voices/` (`de_DE-thorsten-high.onnx` + `.onnx.json` from huggingface.co/rhasspy/piper-voices).
- **Sound effects** (whoosh, pop, pop-high, typing, riser, impact, chime): `.venv/Scripts/python scripts/audio/synth.py sfx` writes them to `public/audio/sfx/`.
- **Music bed** (a minor section, then a lift into a major groove at `--turn`): `.venv/Scripts/python scripts/audio/synth.py music --length <s> --turn <s> --bpm 100` writes `public/audio/music/bed.wav`.
- **Voiceover:** edit `scripts/audio/<name>-voiceover.json`, then run `.venv/Scripts/python scripts/audio/vo.py scripts/audio/<name>-voiceover.json`. This writes one WAV per scene and a `timing.json`. The scene lengths in `EchoGridReel` come from that `timing.json`, so after changing the VO, re-run the music command with `--timing`. Each VO clip gets `preroll` seconds of leading silence, and the first scene uses a larger `lead` so players do not clip the first word.
- Engines: `--engine piper` (local neural, the default), `edge` (Microsoft online, which was blocked with a 403 on this network), or `sapi` (Windows voice).
- Sync sound effects to animation using the exported `CUES` frames rather than hard-coded numbers.

## Verifying work

Typecheck with `npm run lint`. Render stills at key frames (scene starts, mid-transition, last frame) and look at them. Then do a full render and check it with `npx remotion ffprobe out/x.mp4`.
