import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { FONT_FAMILY } from "../utils/fonts";
import { lerp, springIn } from "../utils/animation";

type Props = {
  text: string;
  /** Frame (relative to the parent Sequence) when the animation starts. */
  delay?: number;
  /** Frames between each word. */
  stagger?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  /** Words (exact match, incl. punctuation) drawn in highlightColor. */
  highlight?: string[];
  highlightColor?: string;
  align?: "center" | "flex-start";
};

/** Word-by-word staggered rise + fade + blur reveal. */
export const AnimatedText: React.FC<Props> = ({
  text,
  delay = 0,
  stagger = 4,
  fontSize = 120,
  color = COLORS.text,
  fontWeight = 900,
  fontFamily = FONT_FAMILY,
  highlight = [],
  highlightColor = COLORS.secondary,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align,
        columnGap: fontSize * 0.25,
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
      }}
    >
      {words.map((word, i) => {
        const p = springIn(frame, fps, delay + i * stagger);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              color: highlight.includes(word) ? highlightColor : undefined,
              transform: `translateY(${lerp(p, fontSize * 0.6, 0)}px)`,
              filter: `blur(${lerp(p, 12, 0)}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
