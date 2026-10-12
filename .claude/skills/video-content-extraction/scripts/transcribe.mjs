// Local transcription with Whisper.cpp via @remotion/install-whisper-cpp.
//
// Usage (run from a scratch folder that has the package installed):
//   npm i --save-exact @remotion/install-whisper-cpp@<remotion version>
//   node transcribe.mjs <audio-16k-mono.wav> [model=medium] [language=auto]
//
// Writes transcript.txt (one sentence per line, [mm:ss] timestamps) and
// transcript.json (raw captions) next to the audio file.
//
// Notes from real runs (Windows):
// - whisper.cpp 1.7.x installs hung; 1.5.5 installs reliably.
// - Hugging Face downloads of the model can be reset mid-way. If
//   downloadWhisperModel fails, download with curl and resume:
//   curl -L -C - --retry 5 -o whisper.cpp/ggml-<model>.bin \
//     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-<model>.bin
// - "medium" is a good quality/speed trade-off for German or English talks;
//   a 15-minute talk takes roughly 10-20 min on CPU.
import fs from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const [, , audioArg, model = "medium", language = "auto"] = process.argv;
if (!audioArg) {
  console.error("usage: node transcribe.mjs <audio.wav> [model] [language]");
  process.exit(1);
}
const audio = path.resolve(audioArg);
const outDir = path.dirname(audio);
const whisperPath = path.resolve("whisper.cpp");
const version = "1.5.5";

await installWhisperCpp({ to: whisperPath, version });
const modelFile = path.join(whisperPath, `ggml-${model}.bin`);
if (!fs.existsSync(modelFile) || fs.statSync(modelFile).size < 1e6) {
  await downloadWhisperModel({ model, folder: whisperPath });
}

const output = await transcribe({
  inputPath: audio,
  whisperPath,
  whisperCppVersion: version,
  model,
  language,
  tokenLevelTimestamps: true,
});
const { captions } = toCaptions({ whisperCppOutput: output });
fs.writeFileSync(path.join(outDir, "transcript.json"), JSON.stringify(captions, null, 2));

// Group tokens into sentence-ish lines.
const lines = [];
let cur = null;
for (const c of captions) {
  if (!cur) cur = { start: c.startMs, text: "" };
  cur.text += c.text;
  if (/[.!?]\s*$/.test(c.text) || cur.text.length > 220) {
    lines.push(cur);
    cur = null;
  }
}
if (cur) lines.push(cur);
const mmss = (ms) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms / 1000) % 60)).padStart(2, "0")}`;
fs.writeFileSync(
  path.join(outDir, "transcript.txt"),
  lines.map((l) => `[${mmss(l.start)}] ${l.text.trim()}`).join("\n"),
);
console.log(`done: ${lines.length} lines -> ${path.join(outDir, "transcript.txt")}`);
