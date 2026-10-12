// Copy this folder to start a new composition, then register it in Root.tsx.
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Sequence } from "remotion";
import { AnimatedText, Background } from "../../components";
import { secondsToFrames } from "../../config/video";

export const templateSchema = z.object({
  headline: z.string(),
  durationInSeconds: z.number().min(1),
});

export type TemplateProps = z.infer<typeof templateSchema>;

export const Template: React.FC<TemplateProps> = ({ headline }) => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={secondsToFrames(0.25)} layout="none">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <AnimatedText text={headline} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
