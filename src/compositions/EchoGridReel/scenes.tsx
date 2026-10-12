import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../../components";
import { lerp, progress, springIn } from "../../utils/animation";
import { BRAND, BRAND_FONT, SAFE } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Animation cue frames (relative to each scene). Sound effects sync to these. */
export const CUES = {
  hookWalk: 30,
  chipsAfterLeave: 20,
  chipStep: 6,
  bubbleStart: 18,
  bubbleStep: 34,
  typeStart: 6,
  typeEnd: 40,
  answer: 44,
  sources: 60,
  ctaButton: 30,
} as const;

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** Headline block pinned inside the top safe zone. */
const Headline: React.FC<{
  text: string;
  highlight?: string[];
  delay?: number;
  fontSize?: number;
  color?: string;
  top?: number;
}> = ({ text, highlight, delay = 0, fontSize = 96, color = BRAND.white, top = SAFE.top + 40 }) => (
  <div style={{ position: "absolute", top, left: 80, right: 80 }}>
    <AnimatedText
      text={text}
      delay={delay}
      stagger={3}
      fontSize={fontSize}
      fontWeight={800}
      fontFamily={BRAND_FONT}
      color={color}
      highlight={highlight}
      highlightColor={BRAND.orange}
    />
  </div>
);

/** The atio square-grid motif, gently pulsing. */
const SquareGrid: React.FC<{ x: number; y: number; size?: number; delay?: number }> = ({
  x,
  y,
  size = 44,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const p = springIn(frame, fps, delay + i * 1.5, { damping: 14 });
      const orange = (r + c) % 2 === 0;
      cells.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: c * size * 1.35,
            top: r * size * 1.35,
            width: size,
            height: size,
            borderRadius: size * 0.12,
            background: orange ? BRAND.orange : BRAND.blue,
            opacity: p * (orange ? 1 : 0.55),
            transform: `scale(${p})`,
          }}
        />,
      );
    }
  }
  return <div style={{ position: "absolute", left: x, top: y }}>{cells}</div>;
};

// ---------------------------------------------------------------------------
// 1 · Hook
// ---------------------------------------------------------------------------

export const HookScene: React.FC<{ line1: string; line2: string; line3: string }> = ({
  line1,
  line2,
  line3,
}) => {
  const frame = useCurrentFrame();
  const draw = progress(frame, 10, 30);
  const walk = progress(frame, CUES.hookWalk, 40);
  // The last word of line 2 is highlighted in orange.
  const line = (text: string, delay: number, fontSize: number, highlightLast = false) => (
    <AnimatedText
      text={text}
      delay={delay}
      fontSize={fontSize}
      fontWeight={800}
      fontFamily={BRAND_FONT}
      stagger={3}
      color={BRAND.white}
      highlight={highlightLast ? text.split(" ").slice(-1) : []}
      highlightColor={BRAND.orange}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navy }}>
      <SquareGrid x={720} y={1400} size={40} delay={4} />
      <div style={{ position: "absolute", top: 470, left: 50, right: 50 }}>
        {line(line1, 0, 84)}
        <div style={{ height: 14 }} />
        {line(line2, 8, 98, true)}
        <div style={{ height: 14 }} />
        {line(line3, 16, 84)}
      </div>
      {/* Exit icon: a door bracket and an arrow, with knowledge (a dot) walking out. */}
      <svg width={1080} height={400} style={{ position: "absolute", top: 1060 }}>
        <path
          d="M 470 60 L 360 60 L 360 300 L 470 300"
          fill="none"
          stroke={BRAND.navySoft}
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={560}
          strokeDashoffset={560 * (1 - draw)}
        />
        <path
          d="M 430 180 L 700 180 M 640 120 L 700 180 L 640 240"
          fill="none"
          stroke={BRAND.navySoft}
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={460}
          strokeDashoffset={460 * (1 - draw)}
        />
        <circle
          cx={lerp(walk, 420, 900)}
          cy={180}
          r={26}
          fill={BRAND.orange}
          opacity={draw * interpolate(walk, [0.7, 1], [1, 0], clamp)}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2 · Knowledge in the head → leaves with people
// ---------------------------------------------------------------------------

const HEAD_NODES = [
  { x: 470, y: 330, c: BRAND.orange },
  { x: 610, y: 300, c: BRAND.white },
  { x: 400, y: 450, c: BRAND.blue },
  { x: 540, y: 430, c: BRAND.orange },
  { x: 680, y: 420, c: BRAND.blue },
  { x: 460, y: 560, c: BRAND.white },
  { x: 610, y: 560, c: BRAND.orange },
  { x: 540, y: 240, c: BRAND.blue },
];
const HEAD_EDGES = [
  [0, 1], [0, 2], [0, 3], [1, 4], [3, 4], [2, 5], [3, 5], [3, 6], [4, 6], [0, 7], [1, 7],
];

export const HeadScene: React.FC<{
  inHead: string;
  leaves: string;
  reasons: string[];
  /** Frame at which the knowledge starts leaving. */
  leaveAt: number;
}> = ({ inHead, leaves, reasons, leaveAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = springIn(frame, fps, 0);
  const leave = progress(frame, leaveAt, 60);
  const glow = 0.6 + 0.4 * Math.sin(frame / 8);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navy }}>
      <Sequence durationInFrames={leaveAt} layout="none">
        <Headline text={inHead} highlight={["Kopf."]} delay={4} />
      </Sequence>
      <Sequence from={leaveAt} layout="none">
        <Headline text={leaves} highlight={["gehen."]} />
      </Sequence>

      <svg
        width={1080}
        height={1080}
        style={{
          position: "absolute",
          top: 560,
          opacity: head,
          transform: `translateY(${lerp(head, 80, 0)}px)`,
        }}
      >
        {/* Bust silhouette */}
        <circle cx={540} cy={400} r={250} fill={BRAND.navySoft} />
        <path d="M 170 1080 Q 170 720 540 700 Q 910 720 910 1080 Z" fill={BRAND.navySoft} />

        {HEAD_EDGES.map(([a, b], i) => {
          const p = progress(frame, 12 + i * 2, 20);
          const A = HEAD_NODES[a];
          const B = HEAD_NODES[b];
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={lerp(p, A.x, B.x)}
              y2={lerp(p, A.y, B.y)}
              stroke={BRAND.white}
              strokeOpacity={0.35 * (1 - leave)}
              strokeWidth={4}
            />
          );
        })}

        {HEAD_NODES.map((n, i) => {
          const pop = springIn(frame, fps, 6 + i * 3, { damping: 12 });
          // Each node drifts out of the head to the right, staggered.
          const out = interpolate(leave * 1.4 - i * 0.05, [0, 1], [0, 1], clamp);
          const dx = out * (700 - n.x + 300 + i * 20);
          const dy = out * (n.y - 420) * 0.8 - out * 120;
          return (
            <g key={i} transform={`translate(${dx} ${dy})`} opacity={1 - out}>
              <circle cx={n.x} cy={n.y} r={34 * pop} fill={n.c} opacity={0.25 * glow} />
              <circle cx={n.x} cy={n.y} r={20 * pop} fill={n.c} />
            </g>
          );
        })}
      </svg>

      {/* Reasons: Rente · Urlaub · Jobwechsel */}
      <div
        style={{
          position: "absolute",
          top: SAFE.bottom - 120,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {reasons.map((r, i) => {
          const p = springIn(frame, fps, leaveAt + CUES.chipsAfterLeave + i * CUES.chipStep, { damping: 12 });
          return (
            <div
              key={r}
              style={{
                fontFamily: BRAND_FONT,
                fontWeight: 600,
                fontSize: 44,
                color: BRAND.navy,
                background: BRAND.orange,
                padding: "16px 34px",
                borderRadius: 60,
                opacity: p,
                transform: `scale(${p})`,
              }}
            >
              {r}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3 · Wikis only work if someone writes
// ---------------------------------------------------------------------------

export const WikiScene: React.FC<{ label: string; text: string }> = ({ label, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = springIn(frame, fps, 6);
  const cursorOn = Math.floor(frame / 12) % 2 === 0;
  const fadeOut = progress(frame, 70, 25);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navy }}>
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 40,
          left: 80,
          right: 80,
          textAlign: "center",
          fontFamily: BRAND_FONT,
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: "0.08em",
          color: BRAND.orange,
          opacity: progress(frame, 0, 15),
        }}
      >
        {label}
      </div>
      <Headline text={text} top={SAFE.top + 120} fontSize={88} highlight={["schreibt."]} delay={4} />

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 900,
          width: 780,
          height: 560,
          borderRadius: 36,
          background: BRAND.white,
          boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
          padding: 56,
          boxSizing: "border-box",
          opacity: card * (1 - fadeOut * 0.55),
          filter: `grayscale(${fadeOut})`,
          transform: `translateY(${lerp(card, 160, 0)}px) rotate(${lerp(fadeOut, 0, -4)}deg)`,
        }}
      >
        <div style={{ display: "flex", gap: 14, marginBottom: 46 }}>
          {[BRAND.orange, BRAND.blue, BRAND.grey].map((c) => (
            <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
          ))}
        </div>
        <div style={{ height: 34, width: "55%", borderRadius: 10, background: BRAND.light }} />
        <div style={{ display: "flex", alignItems: "center", marginTop: 44 }}>
          <div
            style={{
              width: 6,
              height: 56,
              background: BRAND.navy,
              opacity: cursorOn ? 1 : 0,
            }}
          />
        </div>
        {[90, 75, 82, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 22,
              width: `${w}%`,
              borderRadius: 8,
              background: BRAND.light,
              marginTop: 28,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 4 · The turn
// ---------------------------------------------------------------------------

export const TurnScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const bars = 15;
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.orange }}>
      <div style={{ position: "absolute", top: 600, left: 80, right: 80 }}>
        <AnimatedText
          text={text}
          fontSize={120}
          fontWeight={800}
          fontFamily={BRAND_FONT}
          color={BRAND.navy}
          stagger={4}
          highlight={["erzählt?"]}
          highlightColor={BRAND.white}
        />
      </div>
      {/* Voice waveform */}
      <div
        style={{
          position: "absolute",
          top: 1180,
          left: 0,
          right: 0,
          height: 240,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
        }}
      >
        {new Array(bars).fill(0).map((_, i) => {
          const env = Math.sin((i / (bars - 1)) * Math.PI);
          const wave = 0.35 + 0.65 * Math.abs(Math.sin(frame / 5 + i * 0.9));
          const intro = progress(frame, 10 + Math.abs(i - 7) * 1.5, 15);
          return (
            <div
              key={i}
              style={{
                width: 26,
                height: 30 + 200 * env * wave * intro,
                borderRadius: 13,
                background: BRAND.navy,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 5 · EchoGrid interview (chat in a phone)
// ---------------------------------------------------------------------------

export const ChatScene: React.FC<{
  headline: string;
  appTitle: string;
  messages: { from: "ai" | "user"; text: string }[];
}> = ({ headline, appTitle, messages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = springIn(frame, fps, 4);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navy }}>
      <Headline text={headline} fontSize={80} highlight={["strukturiert."]} />
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 720,
          width: 820,
          height: 1000,
          borderRadius: 64,
          background: BRAND.light,
          border: `14px solid ${BRAND.navyDeep}`,
          overflow: "hidden",
          opacity: phone,
          transform: `translateY(${lerp(phone, 200, 0)}px)`,
          fontFamily: BRAND_FONT,
        }}
      >
        <div
          style={{
            background: BRAND.white,
            padding: "36px 44px",
            fontSize: 36,
            fontWeight: 600,
            color: BRAND.navy,
            display: "flex",
            alignItems: "center",
            gap: 18,
            borderBottom: `2px solid ${BRAND.light}`,
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: 11, background: BRAND.orange }} />
          {appTitle}
        </div>
        <div style={{ padding: 36, display: "flex", flexDirection: "column", gap: 26 }}>
          {messages.map((m, i) => {
            const p = springIn(frame, fps, CUES.bubbleStart + i * CUES.bubbleStep, { damping: 16 });
            const ai = m.from === "ai";
            return (
              <div
                key={i}
                style={{
                  alignSelf: ai ? "flex-start" : "flex-end",
                  maxWidth: "82%",
                  padding: "24px 30px",
                  borderRadius: 32,
                  borderBottomLeftRadius: ai ? 8 : 32,
                  borderBottomRightRadius: ai ? 32 : 8,
                  background: ai ? BRAND.white : BRAND.navy,
                  color: ai ? BRAND.navy : BRAND.white,
                  fontSize: 34,
                  lineHeight: 1.35,
                  boxShadow: "0 8px 20px rgba(0,40,80,0.08)",
                  opacity: p,
                  transform: `translateY(${lerp(p, 40, 0)}px) scale(${lerp(p, 0.9, 1)})`,
                  transformOrigin: ai ? "left bottom" : "right bottom",
                }}
              >
                {m.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 6 · Knowledge graph
// ---------------------------------------------------------------------------

const GRAPH_NODES = [
  { x: 540, y: 1070, c: BRAND.orange, r: 46 },
  { x: 300, y: 910, c: BRAND.blue, r: 34 },
  { x: 790, y: 890, c: BRAND.blue, r: 34 },
  { x: 250, y: 1220, c: BRAND.white, r: 30 },
  { x: 820, y: 1240, c: BRAND.orange, r: 32 },
  { x: 540, y: 1420, c: BRAND.blue, r: 34 },
  { x: 560, y: 770, c: BRAND.white, r: 28 },
  { x: 260, y: 1490, c: BRAND.orange, r: 26 },
  { x: 840, y: 1510, c: BRAND.white, r: 26 },
];
const GRAPH_EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 6], [1, 3], [2, 4], [5, 7], [5, 8], [4, 8], [3, 7],
];

export const GraphScene: React.FC<{ headline: string; labels: string[] }> = ({
  headline,
  labels,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = interpolate(frame, [0, 120], [1, 1.08], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.navyDeep }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {GRAPH_EDGES.map(([a, b], i) => {
            const p = progress(frame, 8 + i * 3, 22);
            const A = GRAPH_NODES[a];
            const B = GRAPH_NODES[b];
            return (
              <line
                key={i}
                x1={A.x}
                y1={A.y}
                x2={lerp(p, A.x, B.x)}
                y2={lerp(p, A.y, B.y)}
                stroke={BRAND.white}
                strokeOpacity={0.3}
                strokeWidth={4}
              />
            );
          })}
          {GRAPH_NODES.map((n, i) => {
            const p = springIn(frame, fps, i * 3, { damping: 12 });
            return (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={n.r * 1.8 * p} fill={n.c} opacity={0.15} />
                <circle cx={n.x} cy={n.y} r={n.r * p} fill={n.c} />
              </g>
            );
          })}
        </svg>
        {GRAPH_NODES.slice(0, labels.length).map((n, i) => {
          const p = springIn(frame, fps, 20 + i * 4);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y + n.r + 14,
                transform: `translateX(-50%) scale(${p})`,
                opacity: p,
                fontFamily: BRAND_FONT,
                fontSize: 30,
                fontWeight: 600,
                color: BRAND.white,
                background: "rgba(255,255,255,0.1)",
                padding: "6px 18px",
                borderRadius: 30,
                whiteSpace: "nowrap",
              }}
            >
              {labels[i]}
            </div>
          );
        })}
      </AbsoluteFill>
      <Headline text={headline} fontSize={92} highlight={["Vernetzt.", "Echo"]} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 7 · Answers with sources
// ---------------------------------------------------------------------------

export const TrustScene: React.FC<{
  headline: string;
  question: string;
  answer: string;
  sources: string[];
}> = ({ headline, question, answer, sources }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typed = Math.floor(interpolate(frame, [CUES.typeStart, CUES.typeEnd], [0, question.length], clamp));
  const answerIn = springIn(frame, fps, CUES.answer);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.light, fontFamily: BRAND_FONT }}>
      <Headline text={headline} color={BRAND.navy} highlight={["Quelle."]} />
      {/* Search bar */}
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 90,
          right: 90,
          padding: "34px 40px",
          borderRadius: 40,
          background: BRAND.white,
          boxShadow: "0 16px 40px rgba(0,40,80,0.10)",
          fontSize: 36,
          color: BRAND.navy,
          minHeight: 50,
        }}
      >
        {question.slice(0, typed)}
        <span style={{ opacity: Math.floor(frame / 10) % 2 === 0 && typed < question.length ? 1 : 0 }}>
          |
        </span>
      </div>
      {/* Answer card */}
      <div
        style={{
          position: "absolute",
          top: 940,
          left: 90,
          right: 90,
          padding: 44,
          borderRadius: 40,
          background: BRAND.navy,
          color: BRAND.white,
          fontSize: 36,
          lineHeight: 1.45,
          opacity: answerIn,
          transform: `translateY(${lerp(answerIn, 60, 0)}px)`,
        }}
      >
        {answer}
        <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 16 }}>
          {sources.map((s, i) => {
            const p = springIn(frame, fps, CUES.sources + i * CUES.chipStep, { damping: 12 });
            return (
              <div
                key={s}
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: BRAND.navy,
                  background: BRAND.orange,
                  padding: "10px 22px",
                  borderRadius: 24,
                  opacity: p,
                  transform: `scale(${p})`,
                }}
              >
                {`[${i + 1}] ${s}`}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 8 · CTA / logo lockup
// ---------------------------------------------------------------------------

export const CtaScene: React.FC<{
  product: string;
  claim: string;
  cta: string;
  url: string;
}> = ({ product, claim, cta, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = springIn(frame, fps, 4);
  const button = springIn(frame, fps, CUES.ctaButton, { damping: 12 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.white,
        fontFamily: BRAND_FONT,
        alignItems: "center",
      }}
    >
      <div style={{ marginTop: 520 }}>
        <AnimatedText
          text={product}
          fontSize={150}
          fontWeight={800}
          fontFamily={BRAND_FONT}
          color={BRAND.navy}
        />
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 50,
          fontWeight: 400,
          color: BRAND.navy,
          opacity: progress(frame, 14, 20),
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        {claim}
      </div>
      <div
        style={{
          marginTop: 70,
          padding: "30px 64px",
          borderRadius: 70,
          background: BRAND.orange,
          color: BRAND.navy,
          fontSize: 52,
          fontWeight: 800,
          transform: `scale(${button})`,
          opacity: button,
        }}
      >
        {cta}
      </div>
      <Img
        src={staticFile("images/atio-logo.jpg")}
        style={{
          marginTop: 110,
          width: 620,
          opacity: logo,
          transform: `translateY(${lerp(logo, 40, 0)}px)`,
        }}
      />
      <div
        style={{
          marginTop: 10,
          fontSize: 40,
          fontWeight: 600,
          color: BRAND.navy,
          opacity: progress(frame, 36, 20),
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};
