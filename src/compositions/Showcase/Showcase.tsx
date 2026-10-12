import React from "react";
import { z } from "zod";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  AnimatedText,
  Background,
  FloatTriangle,
  PopCircle,
  SpinSquare,
  Underline,
} from "../../components";
import { secondsToFrames } from "../../config/video";
import { COLORS } from "../../theme";
import { FONT_FAMILY } from "../../utils/fonts";
import { lerp, progress } from "../../utils/animation";

// The schema makes props editable (and savable) in Remotion Studio.
export const showcaseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  tagline: z.string(),
  /** Seconds per scene. Total duration is derived from these in Root.tsx. */
  sceneSeconds: z.tuple([z.number().min(1), z.number().min(1), z.number().min(1)]),
  /** Seconds per transition (overlaps scenes, so it shortens the total). */
  transitionSeconds: z.number().min(0.1).max(1),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;

/** Total frames for given props + fps. Used by calculateMetadata. */
export const getShowcaseDuration = (props: ShowcaseProps, fps: number) =>
  props.sceneSeconds.reduce((sum, s) => sum + secondsToFrames(s, fps), 0) -
  (props.sceneSeconds.length - 1) * secondsToFrames(props.transitionSeconds, fps);

const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}
  >
    {children}
  </AbsoluteFill>
);

const IntroScene: React.FC<{ title: string }> = ({ title }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background />
      <PopCircle x={width * 0.1} y={height * 0.15} size={160} delay={5} />
      <SpinSquare x={width * 0.8} y={height * 0.62} size={180} delay={12} />
      <FloatTriangle x={width * 0.78} y={height * 0.1} size={130} delay={18} />
      <PopCircle x={width * 0.15} y={height * 0.7} size={70} delay={22} color={COLORS.primary} />
      <Center>
        <AnimatedText text={title} delay={8} fontSize={150} />
        <Underline delay={25} width={520} />
      </Center>
    </AbsoluteFill>
  );
};

const FeatureScene: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const items = [
    { label: "Typography", color: COLORS.primary },
    { label: "Shapes", color: COLORS.secondary },
    { label: "Transitions", color: COLORS.accent },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.surface }}>
      <Center>
        <AnimatedText text={subtitle} fontSize={90} delay={5} stagger={3} />
        <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
          {items.map((item, i) => {
            const p = progress(frame, 20 + i * 8, 25);
            return (
              <div
                key={item.label}
                style={{
                  width: 380,
                  padding: "48px 0",
                  borderRadius: 32,
                  background: COLORS.background,
                  borderTop: `8px solid ${item.color}`,
                  textAlign: "center",
                  fontFamily: FONT_FAMILY,
                  fontSize: 48,
                  fontWeight: 700,
                  color: COLORS.text,
                  opacity: p,
                  transform: `translateY(${lerp(p, 80, 0)}px) scale(${lerp(p, 0.9, 1)})`,
                  boxShadow: `0 30px 60px rgba(0,0,0,${0.35 * p})`,
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ring = progress(frame, 0, 40);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.primary }}>
      <div
        style={{
          position: "absolute",
          left: width / 2 - 450,
          top: height / 2 - 450,
          width: 900,
          height: 900,
          borderRadius: "50%",
          border: `6px solid ${COLORS.text}`,
          opacity: 0.25 * ring,
          transform: `scale(${lerp(ring, 0.4, 1)})`,
        }}
      />
      <Center>
        <AnimatedText text={tagline} fontSize={110} delay={6} />
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 36,
            color: COLORS.text,
            opacity: progress(frame, 30, 20) * 0.8,
            letterSpacing: "0.3em",
          }}
        >
          MADE WITH REMOTION
        </div>
      </Center>
    </AbsoluteFill>
  );
};

export const Showcase: React.FC<ShowcaseProps> = ({
  title,
  subtitle,
  tagline,
  sceneSeconds,
  transitionSeconds,
}) => {
  const { fps } = useVideoConfig();
  const t = secondsToFrames(transitionSeconds, fps);
  const [a, b, c] = sceneSeconds.map((s) => secondsToFrames(s, fps));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={a}>
          <IntroScene title={title} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: t })}
        />
        <TransitionSeries.Sequence durationInFrames={b}>
          <FeatureScene subtitle={subtitle} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: t })}
        />
        <TransitionSeries.Sequence durationInFrames={c}>
          <OutroScene tagline={tagline} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
