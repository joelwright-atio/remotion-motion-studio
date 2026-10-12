import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { progress } from "../utils/animation";

/** A bar that wipes in from the left. */
export const Underline: React.FC<{
  delay?: number;
  width?: number;
  color?: string;
}> = ({ delay = 0, width = 600, color = COLORS.secondary }) => {
  const p = progress(useCurrentFrame(), delay, 20);
  return (
    <div
      style={{
        width,
        height: 10,
        borderRadius: 5,
        background: color,
        transform: `scaleX(${p})`,
        transformOrigin: "left",
      }}
    />
  );
};
