// EchoGrid product/problem explainer Reel (9:16, German, with voiceover).
// Story: hook → knowledge in the head → it leaves → wikis fail → turn →
// AI interview → knowledge graph → answers with sources → CTA.
//
// Scene lengths come from the voiceover: edit scripts/audio/echogrid-voiceover.json,
// then run `.venv/Scripts/python scripts/audio/vo.py scripts/audio/echogrid-voiceover.json`.
import React from "react";
import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { secondsToFrames } from "../../config/video";
import timing from "../../../public/audio/vo/echogrid/timing.json";
import { BRAND } from "./brand";
import { gridWipe } from "./gridWipe";
import {
  ChatScene,
  CtaScene,
  CUES,
  GraphScene,
  HeadScene,
  HookScene,
  TrustScene,
  TurnScene,
  WikiScene,
} from "./scenes";

const SCENE_KEYS = ["hook", "head", "wiki", "turn", "chat", "graph", "trust", "cta"] as const;
type SceneKey = (typeof SCENE_KEYS)[number];

/** Scene lengths and start frames, derived from the voiceover timing file. */
const getSchedule = (fps: number) => {
  const overlap = secondsToFrames(timing.overlap, fps);
  const durations = Object.fromEntries(
    SCENE_KEYS.map((k) => [k, secondsToFrames(timing.scenes[k].duration, fps)]),
  ) as Record<SceneKey, number>;
  const starts = {} as Record<SceneKey, number>;
  let cursor = 0;
  for (const k of SCENE_KEYS) {
    starts[k] = cursor;
    cursor += durations[k] - overlap;
  }
  return { overlap, durations, starts, total: cursor + overlap };
};

export const getReelDuration = (fps: number) => getSchedule(fps).total;

export const echoGridReelSchema = z.object({
  hookLine1: z.string(),
  hookLine2: z.string(),
  hookLine3: z.string(),
  inHead: z.string(),
  leaves: z.string(),
  reasons: z.array(z.string()),
  wikiLabel: z.string(),
  wikiText: z.string(),
  turn: z.string(),
  chatHeadline: z.string(),
  appTitle: z.string(),
  messages: z.array(z.object({ from: z.enum(["ai", "user"]), text: z.string() })),
  graphHeadline: z.string(),
  graphLabels: z.array(z.string()),
  trustHeadline: z.string(),
  question: z.string(),
  answer: z.string(),
  sources: z.array(z.string()),
  product: z.string(),
  claim: z.string(),
  cta: z.string(),
  url: z.string(),
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
});

export type EchoGridReelProps = z.infer<typeof echoGridReelSchema>;

const Sfx: React.FC<{ at: number; file: string; volume: number }> = ({ at, file, volume }) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`audio/sfx/${file}`)} volume={volume} />
  </Sequence>
);

export const EchoGridReel: React.FC<EchoGridReelProps> = (p) => {
  const { fps } = useVideoConfig();
  const { overlap: t, durations: d, starts: s, total } = getSchedule(fps);
  const squares = gridWipe({ colors: [BRAND.orange, BRAND.navy, BRAND.blue], cols: 6 });
  const vo = (k: SceneKey) => timing.scenes[k].vo;
  // The head scene switches to "…und geht" when the second VO sentence starts.
  const leaveAt = secondsToFrames(vo("head").lead + vo("head").length * 0.55, fps);
  const v = p.sfxVolume;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navy }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={d.hook}>
          <HookScene line1={p.hookLine1} line2={p.hookLine2} line3={p.hookLine3} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: t })} />

        <TransitionSeries.Sequence durationInFrames={d.head}>
          <HeadScene inHead={p.inHead} leaves={p.leaves} reasons={p.reasons} leaveAt={leaveAt} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: t })}
        />

        <TransitionSeries.Sequence durationInFrames={d.wiki}>
          <WikiScene label={p.wikiLabel} text={p.wikiText} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={squares} timing={linearTiming({ durationInFrames: t })} />

        <TransitionSeries.Sequence durationInFrames={d.turn}>
          <TurnScene text={p.turn} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={squares} timing={linearTiming({ durationInFrames: t })} />

        <TransitionSeries.Sequence durationInFrames={d.chat}>
          <ChatScene headline={p.chatHeadline} appTitle={p.appTitle} messages={p.messages} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: t })} />

        <TransitionSeries.Sequence durationInFrames={d.graph}>
          <GraphScene headline={p.graphHeadline} labels={p.graphLabels} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: t })}
        />

        <TransitionSeries.Sequence durationInFrames={d.trust}>
          <TrustScene
            headline={p.trustHeadline}
            question={p.question}
            answer={p.answer}
            sources={p.sources}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={squares} timing={linearTiming({ durationInFrames: t })} />

        <TransitionSeries.Sequence durationInFrames={d.cta}>
          <CtaScene product={p.product} claim={p.claim} cta={p.cta} url={p.url} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* ---------------- Audio ---------------- */}

      {/* Music bed: generated by scripts/audio/synth.py, lifts at the turn. */}
      <Audio
        src={staticFile("audio/music/bed.wav")}
        volume={(f) =>
          p.musicVolume *
          interpolate(f, [0, 10, total - 40, total], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* Voiceover, one clip per scene. */}
      {SCENE_KEYS.map((k) => (
        <Sequence key={k} from={s[k] + secondsToFrames(vo(k).lead, fps)} layout="none">
          <Audio src={staticFile(vo(k).file)} />
        </Sequence>
      ))}

      {/* Sound effects, synced to the animation cues. */}
      <Sfx at={2} file="pop.wav" volume={0.5 * v} />
      <Sfx at={CUES.hookWalk} file="whoosh.wav" volume={0.35 * v} />
      {(["head", "wiki", "chat", "graph", "trust"] as const).map((k) => (
        <Sfx key={k} at={s[k] - 4} file="whoosh.wav" volume={0.45 * v} />
      ))}
      <Sfx at={s.head + leaveAt} file="whoosh.wav" volume={0.3 * v} />
      {p.reasons.map((_, i) => (
        <Sfx
          key={i}
          at={s.head + leaveAt + CUES.chipsAfterLeave + i * CUES.chipStep}
          file="pop-high.wav"
          volume={0.4 * v}
        />
      ))}
      <Sfx at={s.turn + t / 2 - secondsToFrames(1.4, fps)} file="riser.wav" volume={0.45 * v} />
      <Sfx at={s.turn + t / 2} file="impact.wav" volume={0.7 * v} />
      {p.messages.map((_, i) => (
        <Sfx
          key={i}
          at={s.chat + CUES.bubbleStart + i * CUES.bubbleStep}
          file="pop-high.wav"
          volume={0.4 * v}
        />
      ))}
      <Sfx at={s.trust + CUES.typeStart} file="typing.wav" volume={0.5 * v} />
      <Sfx at={s.trust + CUES.answer} file="pop.wav" volume={0.45 * v} />
      <Sfx at={s.cta + t / 2} file="chime.wav" volume={0.5 * v} />
      <Sfx at={s.cta + CUES.ctaButton} file="pop.wav" volume={0.45 * v} />
    </AbsoluteFill>
  );
};
