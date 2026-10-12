"""Procedural sound effects + music bed for Remotion videos (numpy only).

Usage:
  .venv/Scripts/python scripts/audio/synth.py sfx
  .venv/Scripts/python scripts/audio/synth.py music --length 32 --turn 11.5 --bpm 100

Writes 48 kHz stereo WAVs to public/audio/sfx and public/audio/music.
Everything is seeded, so re-running produces identical files.
"""

from __future__ import annotations

import argparse
import wave
from pathlib import Path

import numpy as np

SR = 48_000
ROOT = Path(__file__).resolve().parents[2]
rng = np.random.default_rng(7)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def write_wav(path: Path, stereo: np.ndarray, peak_db: float = -1.0) -> None:
    """stereo: shape (n, 2) float. Normalised to peak_db dBFS."""
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(stereo)) or 1.0
    data = stereo / peak * 10 ** (peak_db / 20)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {path.relative_to(ROOT)}  {len(stereo) / SR:.2f}s")


def mono_to_stereo(x: np.ndarray, pan: np.ndarray | float = 0.0) -> np.ndarray:
    """Equal-power pan; pan in [-1, 1], scalar or per-sample."""
    angle = (np.asarray(pan) + 1) * np.pi / 4
    return np.stack([x * np.cos(angle), x * np.sin(angle)], axis=-1) * np.sqrt(2)


def fft_filter(x: np.ndarray, lo: float = 0.0, hi: float = SR / 2, slope: float = 1.0) -> np.ndarray:
    """Zero-phase band filter with soft edges, via FFT."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = np.ones_like(f)
    if lo > 0:
        gain *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    if hi < SR / 2:
        gain *= 1 / (1 + (f / hi) ** (4 * slope))
    return np.fft.irfft(spec * gain, n=len(x))


def sweep_filter(x: np.ndarray, centers: np.ndarray, q: float = 1.5, block: int = 2048) -> np.ndarray:
    """Time-varying band-pass (overlap-add STFT). centers: Hz per sample."""
    hop = block // 4
    win = np.hanning(block)
    out = np.zeros(len(x) + block)
    norm = np.zeros(len(x) + block)
    f = np.fft.rfftfreq(block, 1 / SR)
    pad = np.concatenate([x, np.zeros(block)])
    for start in range(0, len(x), hop):
        seg = pad[start:start + block] * win
        c = centers[min(start + block // 2, len(centers) - 1)]
        bw = c / q
        gain = np.exp(-0.5 * ((f - c) / bw) ** 2)
        out[start:start + block] += np.fft.irfft(np.fft.rfft(seg) * gain, n=block) * win
        norm[start:start + block] += win ** 2
    return (out / np.maximum(norm, 1e-6))[: len(x)]


def reverb(x: np.ndarray, seconds: float = 1.6, mix: float = 0.25, seed: int = 1) -> np.ndarray:
    """Cheap convolution reverb with an exponentially decaying noise IR."""
    r = np.random.default_rng(seed)
    t = t_axis(seconds)
    ir = r.standard_normal(len(t)) * np.exp(-t * 6 / seconds)
    ir = fft_filter(ir, hi=6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x) + len(ir) - 1]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix


def env_ad(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - attack, 0) / decay)
    return a * d


def note_hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------------------------------------------------------------------------
# Sound effects
# ---------------------------------------------------------------------------

def whoosh(seconds: float = 0.8) -> np.ndarray:
    t = t_axis(seconds)
    x = rng.standard_normal(len(t))
    shape = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 2
    centers = 300 + 3500 * shape
    y = sweep_filter(x, centers, q=1.2) * shape
    return mono_to_stereo(y, pan=np.linspace(-0.7, 0.7, len(t)))


def pop(f0: float = 900, f1: float = 420, seconds: float = 0.12) -> np.ndarray:
    t = t_axis(seconds)
    freq = f1 + (f0 - f1) * np.exp(-t * 40)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    y = np.sin(phase) * env_ad(len(t), 0.002, 0.035)
    return mono_to_stereo(reverb(y, 0.4, 0.15))


def typing(seconds: float = 1.2, clicks: int = 16) -> np.ndarray:
    t = t_axis(seconds)
    y = np.zeros(len(t))
    times = np.sort(rng.uniform(0.02, seconds - 0.06, clicks))
    for s in times:
        n = int(0.025 * SR)
        i = int(s * SR)
        burst = fft_filter(rng.standard_normal(n), lo=2000, hi=9000) * env_ad(n, 0.0005, 0.006)
        y[i:i + n] += burst * rng.uniform(0.6, 1.0)
    return mono_to_stereo(y)


def riser(seconds: float = 1.4) -> np.ndarray:
    t = t_axis(seconds)
    p = t / seconds
    noise = sweep_filter(rng.standard_normal(len(t)), 400 + 6000 * p ** 2, q=2.0)
    freq = 200 * 2 ** (p * 2)
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.3
    y = (noise + tone) * p ** 2.5
    y[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return mono_to_stereo(y)


def impact(seconds: float = 1.8) -> np.ndarray:
    t = t_axis(seconds)
    freq = 45 + 80 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 3.5)
    crack = fft_filter(rng.standard_normal(len(t)), lo=800, hi=8000) * np.exp(-t * 30) * 0.5
    return mono_to_stereo(reverb(boom + crack, 1.8, 0.3))


def chime(seconds: float = 2.5) -> np.ndarray:
    """Bright bell chord for the logo reveal (C major 9)."""
    t = t_axis(seconds)
    y = np.zeros(len(t))
    for i, m in enumerate([72, 76, 79, 83, 86]):
        f = note_hz(m)
        delay = int(i * 0.035 * SR)
        n = len(t) - delay
        tt = t[:n]
        partials = (
            np.sin(2 * np.pi * f * tt)
            + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6)
            + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 12)
        )
        y[delay:] += partials * env_ad(n, 0.003, 0.9)
    return mono_to_stereo(reverb(y, 2.2, 0.35))


def make_sfx() -> None:
    out = ROOT / "public" / "audio" / "sfx"
    write_wav(out / "whoosh.wav", whoosh(), -3)
    write_wav(out / "pop.wav", pop(), -3)
    write_wav(out / "pop-high.wav", pop(1400, 900, 0.1), -4)
    write_wav(out / "typing.wav", typing(), -6)
    write_wav(out / "riser.wav", riser(), -3)
    write_wav(out / "impact.wav", impact(), -1)
    write_wav(out / "chime.wav", chime(), -3)


# ---------------------------------------------------------------------------
# Music bed: tense minor pad until `turn`, then an uplifting groove.
# ---------------------------------------------------------------------------

def saw(freq: float, t: np.ndarray, harmonics: int = 24) -> np.ndarray:
    y = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if freq * k > SR / 2.2:
            break
        y += np.sin(2 * np.pi * freq * k * t) / k
    return y


def chord_pad(notes: list[int], seconds: float, cutoff: float) -> np.ndarray:
    t = t_axis(seconds)
    y = np.zeros(len(t))
    for m in notes:
        for detune in (-0.08, 0.0, 0.08):
            y += saw(note_hz(m + detune), t)
    y = fft_filter(y, lo=80, hi=cutoff)
    fade = int(0.25 * SR)
    env = np.ones(len(t))
    env[:fade] = np.linspace(0, 1, fade)
    env[-fade:] = np.linspace(1, 0, fade)
    return y * env / len(notes)


def pluck(freq: float, seconds: float = 0.5) -> np.ndarray:
    t = t_axis(seconds)
    y = sum(np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (6 + 4 * k)) / k for k in range(1, 7))
    return y * env_ad(len(t), 0.002, 0.25)


def kick() -> np.ndarray:
    t = t_axis(0.4)
    freq = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def hat() -> np.ndarray:
    n = int(0.05 * SR)
    return fft_filter(rng.standard_normal(n), lo=7000) * env_ad(n, 0.0005, 0.012)


def place(buf: np.ndarray, clip: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * gain


def make_music(length: float, turn: float, bpm: float) -> None:
    beat = 60 / bpm
    bar = beat * 4
    n = int(length * SR)
    pad = np.zeros(n)
    drums = np.zeros(n)
    bass = np.zeros(n)
    arp = np.zeros(n)
    duck = np.ones(n)

    # Part A (problem): Am – F, dark filtered pad + heartbeat pulse.
    a_chords = [[57, 60, 64], [53, 57, 60]]
    t0, i = 0.0, 0
    while t0 < turn:
        dur = min(bar * 2, turn - t0 + 0.3)
        place(pad, chord_pad(a_chords[i % 2], dur, 900), t0, 0.5)
        for b in range(int(dur / beat)):
            if b % 2 == 0:
                place(drums, kick() * 0.5, t0 + b * beat)
        t0 += bar * 2
        i += 1

    # Part B (solution): C – G – Am – F, brighter pad, groove, arpeggio.
    b_chords = [[60, 64, 67, 71], [55, 59, 62, 67], [57, 60, 64, 67], [53, 57, 60, 64]]
    roots = [36, 31, 33, 29]
    t0, i = turn, 0
    while t0 < length:
        ch = b_chords[i % 4]
        place(pad, chord_pad(ch, bar + 0.3, 3500), t0, 0.45)
        for b in range(4):
            tb = t0 + b * beat
            place(drums, kick(), tb, 0.9)
            k = int(tb * SR)
            duck[k:k + int(0.25 * SR)] = np.minimum(
                duck[k:k + int(0.25 * SR)], np.linspace(0.35, 1, int(0.25 * SR))[: n - k]
            )
            place(drums, hat(), tb + beat / 2, 0.25)
            place(bass, pluck(note_hz(roots[i % 4]), beat * 0.9) * 1.4, tb)
        for s in range(8):  # 8th-note arpeggio
            m = ch[[0, 1, 2, 3, 2, 1, 2, 3][s]] + 12
            place(arp, pluck(note_hz(m), 0.4), t0 + s * beat / 2, 0.35)
        t0 += bar
        i += 1

    mix = pad * duck + bass * duck + drums + reverb(arp, 1.2, 0.3)[:n]
    fade = int(1.5 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    stereo = mono_to_stereo(mix)
    stereo[:, 1] = np.roll(stereo[:, 1], int(0.012 * SR))  # slight width
    write_wav(ROOT / "public" / "audio" / "music" / "bed.wav", stereo, -3)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("what", choices=["sfx", "music", "all"])
    ap.add_argument("--length", type=float, default=32)
    ap.add_argument("--turn", type=float, default=11.5, help="seconds where the mood lifts")
    ap.add_argument("--bpm", type=float, default=100)
    ap.add_argument(
        "--timing",
        help="vo timing.json: sets --length to the total and --turn to the start of the 'turn' scene",
    )
    args = ap.parse_args()
    if args.timing:
        import json

        tm = json.loads(Path(args.timing).read_text(encoding="utf-8"))
        args.length = tm["total"] + 0.2
        start = 0.0
        for key, scene in tm["scenes"].items():
            if key == "turn":
                break
            start += scene["duration"] - tm["overlap"]
        args.turn = start + tm["overlap"] / 2
        print(f"from timing: length {args.length:.2f}s, turn {args.turn:.2f}s")
    if args.what in ("sfx", "all"):
        make_sfx()
    if args.what in ("music", "all"):
        make_music(args.length, args.turn, args.bpm)
