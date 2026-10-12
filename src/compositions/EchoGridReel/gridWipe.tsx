// Custom TransitionSeries presentation: brand squares cover the outgoing
// scene diagonally, then uncover the incoming one.
// https://www.remotion.dev/docs/transitions/presentations/custom
import React from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

type GridWipeProps = { colors: string[]; cols: number };

const GridWipePresentation: React.FC<
  TransitionPresentationComponentProps<GridWipeProps>
> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const { width, height } = useVideoConfig();
  const { colors, cols } = passedProps;
  const cell = width / cols;
  const rows = Math.ceil(height / cell);
  const entering = presentationDirection === "entering";

  // 0 → 1 (cover) on the exiting scene, 1 → 0 (uncover) on the entering one.
  const cover = entering
    ? interpolate(presentationProgress, [0.5, 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : interpolate(presentationProgress, [0, 0.5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  if (entering && presentationProgress < 0.5) {
    return null;
  }

  const squares: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = (c + r) / (cols + rows - 2);
      const s = interpolate(cover * 1.6 - d * 0.6, [0, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      squares.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: c * cell,
            top: r * cell,
            width: cell + 1,
            height: cell + 1,
            background: colors[Math.floor(random(`grid-${r}-${c}`) * colors.length)],
            transform: `scale(${s})`,
            borderRadius: cell * 0.18 * (1 - s),
          }}
        />,
      );
    }
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill>{squares}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const gridWipe = (
  props: GridWipeProps,
): TransitionPresentation<GridWipeProps> => ({
  component: GridWipePresentation,
  props,
});
