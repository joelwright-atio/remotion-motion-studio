import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

/** Slowly rotating gradient background. */
export const Background: React.FC = () => {
  const angle = 135 + useCurrentFrame() * 0.3;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${COLORS.background} 0%, ${COLORS.surface} 55%, ${COLORS.background} 100%)`,
      }}
    />
  );
};
