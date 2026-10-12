"""Inspect how Piper phonemizes text, to fix pronunciations.

Usage:
  .venv/Scripts/python scripts/audio/phonemes.py "Know-how" "Babyboomern"

Prints the phonemes Piper derives from each text. To override a word in a
voiceover script, write the corrected phonemes in double brackets, e.g.
  "Geht Ihr [[nˈoːhaʊ]] mit Ihren …"
Only symbols present in the voice's phoneme map are usable (printed with --map).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from piper import PiperVoice

ROOT = Path(__file__).resolve().parents[2]

ap = argparse.ArgumentParser()
ap.add_argument("texts", nargs="*")
ap.add_argument("--voice", default="de_DE-thorsten-high")
ap.add_argument("--map", action="store_true", help="print all phoneme symbols the voice knows")
args = ap.parse_args()

model = ROOT / ".venv" / "piper-voices" / f"{args.voice}.onnx"
voice = PiperVoice.load(str(model))
for text in args.texts:
    sentences = voice.phonemize(text)
    print(f"{text!r:30s} -> [[{' '.join(''.join(s) for s in sentences)}]]")
if args.map:
    cfg = json.loads(Path(f"{model}.json").read_text(encoding="utf-8"))
    print(" ".join(sorted(cfg["phoneme_id_map"].keys())))
