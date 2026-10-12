import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Circle, Rect, Triangle } from "@remotion/shapes";
import { COLORS } from "../theme";
import { lerp, springIn } from "../utils/animation";

type ShapeProps = {
  delay?: number;
  x: number;
  y: number;
  size: number;
  color?: string;
};

const useEnter = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { p: springIn(frame, fps, delay, { damping: 12, mass: 0.6 }), frame };
};

const Positioned: React.FC<{
  x: number;
  y: number;
  transform: string;
  children: React.ReactNode;
}> = ({ x, y, transform, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform }}>
    {children}
  </div>
);

/** Circle that pops in and bobs gently. */
export const PopCircle: React.FC<ShapeProps> = ({
  delay = 0,
  x,
  y,
  size,
  color = COLORS.secondary,
}) => {
  const { p, frame } = useEnter(delay);
  return (
    <Positioned
      x={x}
      y={y}
      transform={`scale(${p}) translateY(${Math.sin(frame / 20) * 12}px)`}
    >
      <Circle radius={size / 2} fill={color} />
    </Positioned>
  );
};

/** Rounded square that spins in and keeps rotating slowly. */
export const SpinSquare: React.FC<ShapeProps> = ({
  delay = 0,
  x,
  y,
  size,
  color = COLORS.primary,
}) => {
  const { p, frame } = useEnter(delay);
  return (
    <Positioned
      x={x}
      y={y}
      transform={`scale(${p}) rotate(${lerp(p, -90, 0) + frame * 0.5}deg)`}
    >
      <Rect width={size} height={size} cornerRadius={size * 0.18} fill={color} />
    </Positioned>
  );
};

/** Triangle that pops in and drifts in rotation. */
export const FloatTriangle: React.FC<ShapeProps> = ({
  delay = 0,
  x,
  y,
  size,
  color = COLORS.accent,
}) => {
  const { p, frame } = useEnter(delay);
  return (
    <Positioned x={x} y={y} transform={`scale(${p}) rotate(${-frame * 0.4}deg)`}>
      <Triangle length={size} direction="up" fill={color} cornerRadius={size * 0.08} />
    </Positioned>
  );
};
