"""Generate a per-scene voiceover and a scene timing file for a Reel.

Usage:
  .venv/Scripts/python scripts/audio/vo.py scripts/audio/echogrid-voiceover.json
  .venv/Scripts/python scripts/audio/vo.py <script.json> --engine edge|sapi

Writes public/audio/vo/<name>/<NN-key>.wav (.mp3 for edge) and timing.json.
Each scene lasts max(min, lead + VO length + tail) + overlap, so voice lines
never collide across transitions. The Remotion composition reads timing.json.

edge-tts sends the script text to Microsoft's online speech service.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def media_seconds(path: Path) -> float:
    if path.suffix == ".wav":
        with wave.open(str(path)) as w:
            return w.getnframes() / w.getframerate()
    out = subprocess.run(
        f'npx remotion ffprobe -v error -show_entries format=duration -of csv=p=0 "{path}"',
        shell=True, capture_output=True, text=True, cwd=ROOT, stdin=subprocess.DEVNULL,
    )
    return float(out.stdout.strip().splitlines()[-1])


async def tts_edge(text: str, voice: str, rate: str, out: Path) -> None:
    import edge_tts

    await edge_tts.Communicate(text, voice, rate=rate).save(str(out))


def pad_start(path: Path, seconds: float) -> None:
    """Prepend silence so the first syllable never sits right at a cut."""
    with wave.open(str(path)) as r:
        params = r.getparams()
        frames = r.readframes(r.getnframes())
    silence = b"\x00" * (int(seconds * params.framerate) * params.nchannels * params.sampwidth)
    with wave.open(str(path), "wb") as w:
        w.setparams(params)
        w.writeframes(silence + frames)


_piper_voice = None


def tts_piper(text: str, model: str, length_scale: float, out: Path) -> None:
    """Local neural TTS (Piper). Voice models live in .venv/piper-voices/."""
    global _piper_voice
    from piper import PiperVoice, SynthesisConfig

    if _piper_voice is None:
        _piper_voice = PiperVoice.load(str(ROOT / ".venv" / "piper-voices" / f"{model}.onnx"))
    with wave.open(str(out), "wb") as wf:
        _piper_voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=length_scale))


def tts_offline(text: str, out: Path) -> None:
    """Windows SAPI fallback (German voice 'Hedda')."""
    ps = (
        "Add-Type -AssemblyName System.Speech;"
        "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;"
        "$s.SelectVoiceByHints('NotSet','NotSet',0,[Globalization.CultureInfo]'de-DE');"
        f"$s.SetOutputToWaveFile('{out}');$s.Speak($args[0]);$s.Dispose()"
    )
    subprocess.run(["powershell", "-NoProfile", "-Command", ps, text], check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument(
        "--engine", choices=["piper", "edge", "sapi"], default="piper",
        help="piper = local neural (default), edge = Microsoft online, sapi = Windows voice",
    )
    args = ap.parse_args()

    script_path = Path(args.script)
    cfg = json.loads(script_path.read_text(encoding="utf-8"))
    name = script_path.stem.replace("-voiceover", "")
    out_dir = ROOT / "public" / "audio" / "vo" / name
    out_dir.mkdir(parents=True, exist_ok=True)

    overlap, tail = cfg["overlap"], cfg["tail"]
    scenes = {}
    for i, s in enumerate(cfg["scenes"]):
        ext = "mp3" if args.engine == "edge" else "wav"
        out = out_dir / f"{i:02d}-{s['key']}.{ext}"
        if args.engine == "piper":
            tts_piper(s["say"], cfg["piperVoice"], cfg["piperLengthScale"], out)
        elif args.engine == "edge":
            asyncio.run(tts_edge(s["say"], cfg["voice"], cfg["rate"], out))
        else:
            tts_offline(s["say"], out)
        if out.suffix == ".wav":
            pad_start(out, cfg.get("preroll", 0.12))
        length = media_seconds(out)
        is_last = i == len(cfg["scenes"]) - 1
        duration = max(s["min"], s["lead"] + length + tail) + (0 if is_last else overlap)
        scenes[s["key"]] = {
            "duration": round(duration, 3),
            "vo": {"file": f"audio/vo/{name}/{out.name}", "lead": s["lead"], "length": round(length, 3)},
        }
        print(f"{s['key']:6s} vo {length:5.2f}s  scene {duration:5.2f}s")

    total = sum(v["duration"] for v in scenes.values()) - overlap * (len(scenes) - 1)
    timing = {"overlap": overlap, "total": round(total, 3), "scenes": scenes}
    (out_dir / "timing.json").write_text(json.dumps(timing, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"total {total:.2f}s -> {out_dir.relative_to(ROOT) / 'timing.json'}")


if __name__ == "__main__":
    main()
