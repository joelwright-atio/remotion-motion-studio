---
name: remotion-explainer-reel
description: Plan and build a polished vertical (9:16, 1080x1920) animated explainer Reel/Short/TikTok in Remotion — problem → solution → product → proof → CTA — with kinetic typography, brand colours, animated UI mockups, custom transitions and still-frame verification. Use this whenever the user wants a social video, Reel, Short, promo, product or problem explainer, or wants to turn a talk, slide deck, blog post or feature list into a short animated video with Remotion, even if they just say "make a reel about X" or "what animation style works for explainers".
---

# Remotion explainer Reel

This skill covers the visual side. For voiceover, music and sound effects use the **remotion-generated-audio** skill; for pulling content out of a source video use **video-content-extraction**. For Remotion API details, load the official `remotion-best-practices` skill.

## 1. Plan before coding

Write a beat sheet and show it to the user before building. Ask only what you can't infer: language of on-screen text, brand assets (logo file, colours), and CTA/URL.

Proven structure for problem/product explainers (25–40 s):

| Beat | Length | Purpose |
|---|---|---|
| Hook | ≤ 2.5 s | Provocative question or statement on frame 1. No logo intro. |
| Problem | 3–7 s | A visual metaphor the viewer recognises immediately. |
| Failed status quo | 3–4 s | Why the usual fix doesn't work. |
| Turn | 2–3 s | "What if…?" — a hard visual break (colour flip, impact). |
| Product | 4–6 s | Stylised UI demo (chat, dashboard) in a phone/browser frame. |
| Payoff | 3–5 s | The result visualised (graph, numbers, before/after). |
| Trust/proof | 3–4 s | One concrete differentiator (sources, numbers, logos). |
| CTA | 3–4 s | Product name, one-line claim, a single button, logo, URL. |

Why these choices: Reels are watched muted and skipped within ~1.5 s, so text carries the story and something must change every 1–2 s. Pick the source's strongest phrasings for headlines (3–6 words per screen). Cut speaker intros, long feature lists and raw screen recordings — rebuild UI simplified so it is readable on a phone.

If the content is invented (example chats, numbers, customer names), say so to the user and keep it clearly placeholder-ish; never fabricate real-sounding customer claims.

## 2. Project structure

```
src/compositions/<Name>Reel/
  brand.ts        colours, font (loadFont from @remotion/google-fonts), SAFE zone
  gridWipe.tsx    optional custom transition (copy from assets/)
  scenes.tsx      one component per beat + exported CUES (animation frame cues)
  <Name>Reel.tsx  zod schema, TransitionSeries, audio layer
```
Register in `src/Root.tsx` with `width={1080} height={1920}` and inline `defaultProps` (so Studio can edit and save them). Put **every visible string** in props via the zod schema — copy edits, translations and A/B versions then need no code changes.

See `assets/example-*.tsx` for a complete, working reference implementation (scenes: kinetic hook with exit-arrow icon, head-with-knowledge-nodes metaphor, empty-wiki card, waveform turn, phone chat mockup, node graph, search-with-sources, logo CTA). Read it when building scenes — it's faster than inventing from scratch — but write new copy and adapt the visuals to the new topic.

## 3. Brand

- Match colours from the logo/slides; tell the user they are matched by eye and invite official hex codes.
- Logo: use `<Img src={staticFile("images/logo.jpg")}>`. A JPG with a white background forces a white CTA background — ask for a transparent PNG/SVG if they want it on dark.
- One font family at most, two weights for hierarchy. Pick a Google Font close to the logo typeface.
- Reuse a brand motif (e.g. the logo's square grid) in transitions and decorations — it makes the video feel designed rather than templated.

## 4. Layout rules for 9:16

- Safe zone: keep text between y ≈ 250 and y ≈ 1500 (platform UI covers the top and bottom). Put this in `brand.ts` as `SAFE`.
- Type sizes: headlines 80–120 px, body 34–50 px at 1080 px wide.
- **Long words overflow.** `AnimatedText` wraps on spaces only, so a word like "Boomer-Generation" at 118 px is wider than the frame. Measure, don't guess: render a still and look. Split headlines into explicit lines (separate props: `hookLine1/2/3`) instead of relying on wrapping, and avoid single orphan words on a line.
- Highlight one key word per headline in the accent colour (`highlight` prop) rather than colouring whole lines.

## 5. Motion

- Drive everything from `useCurrentFrame()` with springs and clamped `interpolate`. Word-staggered reveals (spring + rise + blur) for headlines.
- Continuous subtle motion (pulsing glow, slow camera push `scale 1 → 1.08`) keeps static moments alive.
- Transitions via `TransitionSeries`: `fade`, `slide`, and custom presentations. `assets/gridWipe.tsx` is a brand-square cover/uncover wipe. Colour the squares with `random(seed)` from `remotion` — indexing colours by `(row * cols + col) % n` produced stripes when `cols` was divisible by `n`.
- Export animation cue frames from `scenes.tsx` (e.g. `CUES = { bubbleStart: 18, bubbleStep: 34, … }`) and use them in both the animation and the sound-effect layer, so sounds stay in sync after retiming.
- Total length = Σ scenes − (n − 1) × transition. When a voiceover exists, derive scene lengths from it (see the audio skill) instead of hard-coding seconds.

## 6. Verify visually — every time

1. `npm run lint` (eslint + tsc). The Remotion ESLint rule `non-pure-animation` gives false positives on object keys named `transition`; rename the key (e.g. `overlap`).
2. Render stills at each scene's middle **and** mid-transition, at reduced scale so they're cheap:
   ```bash
   npx remotion still <Id> <scratch>/f120.png --frame=120 --scale=0.35
   ```
   Then look at them. You need to compute scene start frames to target them; print them or derive them from the schedule.
3. Fix overflow, collisions with icons, orphan words and stripes before rendering the MP4.
4. `npx remotion render <Id> out/<name>.mp4`, then `npx remotion ffprobe` to confirm 1080x1920, fps and duration. Send the MP4 to the user.

Be honest about what you checked: you can inspect stills and metadata but cannot watch playback or listen — say so and ask the user to review.

## 7. Iterating with the user

Expect several rounds of small changes (volume, a line of copy, pronunciation, a headline). Keep them cheap: props for text, `TIMING`/timing.json for length, `musicVolume`/`sfxVolume` props for the mix. After each change: lint → still of the affected scene → re-render → short summary of what changed and the new duration.
