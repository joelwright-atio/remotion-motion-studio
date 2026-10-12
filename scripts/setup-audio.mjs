// One-command setup for the optional Python audio tools.
//
//   npm run setup:audio
//
// 1. Checks that Python 3.10+ is installed (and explains how to install it if not)
// 2. Creates a private Python environment in .venv/
// 3. Installs the packages from requirements-audio.txt
// 4. Downloads the Piper voice model(s) into .venv/piper-voices/ (resumable, with retries)
// 5. Verifies that everything imports
//
// Safe to run again: finished steps are skipped.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VENV = path.join(ROOT, ".venv");
const IS_WIN = process.platform === "win32";
const VENV_PY = IS_WIN ? path.join(VENV, "Scripts", "python.exe") : path.join(VENV, "bin", "python");
const MIN = [3, 10];
const VOICES = [
  {
    name: "de_DE-thorsten-high",
    base: "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/",
  },
];

const ok = (m) => console.log(`  ✔ ${m}`);
const step = (m) => console.log(`\n▶ ${m}`);
const fail = (m) => {
  console.error(`\n✖ ${m}\n`);
  process.exit(1);
};

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });

// ---------------------------------------------------------------------------
// 1. Find Python
// ---------------------------------------------------------------------------
const findPython = () => {
  const candidates = IS_WIN
    ? [["py", ["-3"]], ["python", []], ["python3", []]]
    : [["python3", []], ["python", []]];
  for (const [cmd, pre] of candidates) {
    const r = run(cmd, [...pre, "--version"]);
    // The Windows Store "python" stub prints nothing useful and exits non-zero.
    const m = /Python (\d+)\.(\d+)\.(\d+)/.exec(`${r.stdout}${r.stderr}`);
    if (r.status === 0 && m) {
      return { cmd, pre, version: [+m[1], +m[2], +m[3]] };
    }
  }
  return null;
};

const installHelp = () =>
  IS_WIN
    ? `Python is not installed (or not found).

  Install it like this:
    1. Go to https://www.python.org/downloads/ and click "Download Python 3.x".
    2. Run the installer. IMPORTANT: tick "Add python.exe to PATH" on the first screen,
       then click "Install Now".
    3. Close this terminal, open a new one in the project folder, and run again:
         npm run setup:audio

  (Alternative for IT-savvy users: winget install Python.Python.3.12)`
    : `Python is not installed (or not found).

  Install it like this:
    1. Go to https://www.python.org/downloads/ and download the macOS installer, run it.
       (Alternative: brew install python)
    2. Open a new terminal in the project folder and run again:
         npm run setup:audio`;

step("Checking Python");
const py = findPython();
if (!py) fail(installHelp());
const [maj, min] = py.version;
if (maj < MIN[0] || (maj === MIN[0] && min < MIN[1])) {
  fail(`Python ${py.version.join(".")} is too old (need ${MIN.join(".")} or newer).\n\n${installHelp()}`);
}
ok(`Python ${py.version.join(".")} found (${[py.cmd, ...py.pre].join(" ")})`);

// ---------------------------------------------------------------------------
// 2. Virtual environment
// ---------------------------------------------------------------------------
step("Python environment (.venv)");
if (fs.existsSync(VENV_PY)) {
  ok("already exists");
} else {
  const r = run(py.cmd, [...py.pre, "-m", "venv", VENV], { stdio: "inherit" });
  if (r.status !== 0) fail("Could not create the Python environment in .venv/.");
  ok("created");
}

// ---------------------------------------------------------------------------
// 3. Packages
// ---------------------------------------------------------------------------
step("Installing Python packages (first time: 1-3 minutes)");
const pip = run(
  VENV_PY,
  ["-m", "pip", "install", "--disable-pip-version-check", "-q", "-r", path.join(ROOT, "requirements-audio.txt")],
  { stdio: "inherit" },
);
if (pip.status !== 0) fail("Package installation failed. Check your internet connection and try again.");
ok("packages installed");

// ---------------------------------------------------------------------------
// 4. Voice models (resumable download with retries)
// ---------------------------------------------------------------------------
const download = async (url, dest) => {
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const have = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      const res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {} });
      if (res.status === 416) return "complete"; // nothing left to fetch
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const append = res.status === 206;
      const total = Number(res.headers.get("content-length") || 0) + (append ? have : 0);
      const out = fs.createWriteStream(dest, { flags: append ? "a" : "w" });
      let done = append ? have : 0;
      let last = 0;
      for await (const chunk of res.body) {
        out.write(chunk);
        done += chunk.length;
        if (total && done - last > 5e6) {
          process.stdout.write(`\r    ${path.basename(dest)}: ${Math.round((done / total) * 100)}%   `);
          last = done;
        }
      }
      await new Promise((r) => out.end(r));
      if (total) process.stdout.write(`\r    ${path.basename(dest)}: 100%   \n`);
      return "downloaded";
    } catch (e) {
      console.log(`\n    download interrupted (${e.message}), retrying (${attempt}/8)…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  fail(`Could not download ${url}. Check your internet connection and run the setup again; it resumes where it stopped.`);
};

step("Voice models");
const voiceDir = path.join(VENV, "piper-voices");
fs.mkdirSync(voiceDir, { recursive: true });
for (const v of VOICES) {
  for (const file of [`${v.name}.onnx`, `${v.name}.onnx.json`]) {
    // Resumes partial files; the server answers 416 when the file is already complete.
    const result = await download(v.base + file, path.join(voiceDir, file));
    ok(result === "complete" ? `${file} already downloaded` : `${file} downloaded`);
  }
}

// ---------------------------------------------------------------------------
// 5. Verify
// ---------------------------------------------------------------------------
step("Checking the installation");
const check = run(VENV_PY, ["-c", "import numpy, piper, edge_tts; print('ok')"]);
if (check.status !== 0 || !check.stdout.includes("ok")) {
  fail(`The Python packages don't load correctly:\n${check.stderr}`);
}
ok("all audio tools ready");

console.log(`
Done! You can now regenerate the audio:
  npm run audio:vo      voiceover (after editing scripts/audio/echogrid-voiceover.json)
  npm run audio:music   background music (run after audio:vo)
  npm run audio:sfx     sound effects
  npm run audio         all of the above
`);
