// Runs a Python script with the project's .venv interpreter, on Windows, macOS and Linux.
//   node scripts/py.mjs scripts/audio/synth.py sfx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const py =
  process.platform === "win32"
    ? path.join(ROOT, ".venv", "Scripts", "python.exe")
    : path.join(ROOT, ".venv", "bin", "python");

if (!fs.existsSync(py)) {
  console.error("\n✖ The Python audio tools are not set up yet. Run this first:\n\n    npm run setup:audio\n");
  process.exit(1);
}

const r = spawnSync(py, process.argv.slice(2), {
  cwd: ROOT,
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});
process.exit(r.status ?? 1);
