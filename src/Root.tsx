import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./config/video";
import {
  getShowcaseDuration,
  Showcase,
  showcaseSchema,
} from "./compositions/Showcase/Showcase";
import {
  EchoGridReel,
  echoGridReelSchema,
  getReelDuration,
} from "./compositions/EchoGridReel/EchoGridReel";

// Register every composition here. Each <Composition> appears in Remotion
// Studio's sidebar and can be rendered by its `id`.
//
// Resolution / fps: edit src/config/video.ts (applies to all) or override per
// composition below. Duration: edit `sceneSeconds` / `transitionSeconds`
// in defaultProps — calculateMetadata derives durationInFrames from them.
// Keep defaultProps as an inline literal so Studio can save prop edits.

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Showcase"
        component={Showcase}
        schema={showcaseSchema}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={300}
        defaultProps={{
          title: "Motion, Programmed.",
          subtitle: "Everything is just React",
          tagline: "Ship polished videos.",
          sceneSeconds: [4, 4, 3.5] as [number, number, number],
          transitionSeconds: 0.75,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: getShowcaseDuration(props, VIDEO.fps),
        })}
      />
      {/* 9:16 Reel. Timing follows the voiceover (scripts/audio/vo.py). */}
      <Composition
        id="EchoGridReel"
        component={EchoGridReel}
        schema={echoGridReelSchema}
        width={1080}
        height={1920}
        fps={VIDEO.fps}
        durationInFrames={getReelDuration(VIDEO.fps)}
        defaultProps={{
          hookLine1: "Geht Ihr Know-how",
          hookLine2: "mit Ihren Babyboomern",
          hookLine3: "in Rente?",
          inHead: "Das Wissen steckt im Kopf.",
          leaves: "…und geht, wenn sie gehen.",
          reasons: ["Rente", "Urlaub", "Jobwechsel"],
          wikiLabel: "WIKIS & CONFLUENCE?",
          wikiText: "Funktionieren nur, wenn jemand schreibt.",
          turn: "Was, wenn man einfach erzählt?",
          chatHeadline: "EchoGrid hört zu, fragt nach und strukturiert.",
          appTitle: "EchoGrid · Wissensaufnahme",
          messages: [
            { from: "ai" as const, text: "Was ist beim Werkzeugwechsel an Fräse 3 wichtig?" },
            { from: "user" as const, text: "Erst die Spannvorrichtung prüfen, dann neu nullen." },
            { from: "ai" as const, text: "Welche Toleranz gilt beim Nullen?" },
            { from: "user" as const, text: "Maximal 0,02 mm, sonst nachjustieren." },
          ],
          graphHeadline: "Wissen rein. Vernetzt. Als Echo zurück.",
          graphLabels: [
            "Fräse 3",
            "Werkzeugwechsel",
            "Toleranzen",
            "Wartung",
            "Kunde",
            "Handbuch",
            "Team Fertigung",
          ],
          trustHeadline: "Jede Antwort mit Quelle.",
          question: "Wie wechsle ich das Werkzeug an Fräse 3?",
          answer:
            "Spannvorrichtung prüfen, Werkzeug tauschen und neu nullen – Toleranz max. 0,02 mm.",
          sources: ["Interview Werkstatt", "Handbuch Fräse 3.pdf"],
          product: "EchoGrid",
          claim: "Wissen festhalten, bevor es geht.",
          cta: "Jetzt Demo anfragen",
          url: "atio.de",
          musicVolume: 0.11,
          sfxVolume: 0.5,
        }}
      />
    </>
  );
};
