---
name: remotion-generated-audio
description: Generate the complete soundtrack for a Remotion video locally with Python — voiceover via Piper neural TTS (any language, with phonetic pronunciation fixes), royalty-free music beds and sound effects synthesised with numpy — and sync it to the animation, with scene lengths driven by the voiceover. Use this whenever the user wants a voiceover, narration, background music, a backing track, sound effects, whooshes, or "audio" for a Remotion video, asks for TTS in German or another language, complains that a word is mispronounced, that the first words are cut off, or that music/effects are too loud.
---

# Generated audio for Remotion

Three bundled scripts, all producing files in `public/audio/` that the composition plays with `<Audio>`:

| Script | Makes |
|---|---|
| `scripts/vo.py` | One voiceover clip per scene + `timing.json` (scene lengths) |
| `scripts/synth.py` | `sfx` (whoosh, pop, pop-high, typing, riser, impact, chime) and `music` (bed with a mood lift) |
| `scripts/phonemes.py` | Shows how the TTS voice will pronounce words; lists usable phoneme symbols |

The scripts locate the project as two folders above themselves, so **copy them into `<project>/scripts/audio/`** and run them from the project root.

## Setup (once per project)

```bash
py -m venv .venv            # Windows; python3 -m venv .venv elsewhere
.venv/Scripts/python -m pip install numpy piper-tts edge-tts
mkdir -p .venv/piper-voices
# Download a Piper voice (example: German male). Retry with resume — HF resets connections:
for f in de_DE-thorsten-high.onnx de_DE-thorsten-high.onnx.json; do
  curl -L -C - --retry 5 -o .venv/piper-voices/$f \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/$f
done
```
Add `.venv` to `.gitignore`. Other languages/voices: browse `huggingface.co/rhasspy/piper-voices`.

Engine choice and why:
- **piper** (default): local neural TTS, decent quality, no data leaves the machine.
- **edge**: Microsoft's online neural voices — better quality but sends the script to Microsoft, and was blocked (HTTP 403) on a corporate network. Mention the data flow before using it.
- **sapi**: Windows built-in voices — robotic; last resort.

Tell the user that a human recording of the same script will beat any TTS for a final ad; the pipeline accepts recorded WAVs dropped in place of the generated ones.

## Voiceover → timing → video

1. Write the script as JSON (copy `assets/example-voiceover.json`): one entry per scene with `key`, spoken text `say`, `lead` (seconds into the scene before speaking), `min` (minimum scene length); globals `piperVoice`, `piperLengthScale` (<1 = faster), `overlap` (transition length), `tail`, `preroll`.
   - Write for the ear: short sentences, one idea per scene, reuse the source's own memorable phrasings. ~2.5 spoken words per second; aim for 30–40 s total.
2. Generate: `.venv/Scripts/python scripts/audio/vo.py scripts/audio/<name>-voiceover.json`
   Each scene becomes `max(min, lead + clip + tail) + overlap`, so lines never collide across transitions. Output: `public/audio/vo/<name>/NN-key.wav` + `timing.json`.
3. The composition imports `timing.json` (needs `"resolveJsonModule": true` in tsconfig), converts seconds to frames, computes scene start frames, and places each clip with `<Sequence from={start + lead}><Audio src={staticFile(file)} /></Sequence>`. See the `getSchedule` pattern in the remotion-explainer-reel skill's `assets/example-reel.tsx`.
4. If too long, tighten the wording before speeding up the voice — `length_scale` below ~0.88 starts sounding rushed.
5. Piper output varies slightly between runs, so regenerating changes durations a little. Always regenerate music after the VO.

### Pronunciation fixes

TTS voices read foreign words with their own language's spelling rules (a German voice said "Know-how" as "k-noov-hoof"). Diagnose, then fix:

```bash
.venv/Scripts/python scripts/audio/phonemes.py "Know-how" "Babyboomern" --map
```
Write corrected phonemes inline in double brackets: `"Geht Ihr [[nˈoʊhˌaʊ]] mit Ihren [[bˈeɪbibˌuːmɐn]] in Rente?"`. Only symbols the voice knows (`--map`) work. When the user is unsure, render 3–5 variants of the line (different phonetic spellings **and** rewordings that avoid the word) to `out/pronunciation/` and let them pick by ear — preferences here are subjective and the user may change their mind; keep the variants until the final choice. When wording changes, update the on-screen text to match so muted viewers read what is said.

### First word cut off

Players and social apps fade in or drop the first few hundred ms. Fixes built into the pipeline: `preroll` (default 0.12 s silence prepended to each WAV) and a larger `lead` (~0.6 s) for the very first scene so the visuals start before the voice. Diagnose by measuring where sound starts in each clip and in the render (amplitude threshold on the WAV) rather than guessing.

## Music and sound effects

```bash
.venv/Scripts/python scripts/audio/synth.py sfx
.venv/Scripts/python scripts/audio/synth.py music --timing public/audio/vo/<name>/timing.json
```
- `--timing` sets the music length to the video length and places the **mood lift** (tense minor pad → major groove at 100 BPM with kick, hats, bass, arpeggio, sidechain duck) at the scene keyed `turn`. Without a timing file pass `--length` and `--turn` in seconds.
- Everything is synthesised and seeded: deterministic and licence-free.
- To change the music character, edit the chord lists, `bpm`, and the pad cutoff in `make_music`.

Placing effects in the composition — tie them to animation cues, not magic numbers:
- whoosh slightly before each scene change (`start - 4` frames);
- riser ending at, and impact on, the "turn" transition midpoint;
- pop-high on each chat bubble / chip appearance (`CUES.bubbleStart + i * CUES.bubbleStep`);
- typing under a typewriter animation; chime on the logo.

## Mix

- Expose `musicVolume` and `sfxVolume` as composition props so the user can adjust them in Studio; start around music 0.1–0.2, effects 0.5, voice 1.0. Fade music in/out with a volume function.
- Check loudness after rendering (Remotion's FFmpeg supports `loudnorm`):
  ```bash
  npx remotion ffmpeg -hide_banner -i out/x.mp4 -vn -af loudnorm=print_format=summary -f null -
  ```
  Aim for about −14 to −16 LUFS integrated and a true peak below −1 dBTP for social platforms.
- You cannot listen to the result. Report the measurements and ask the user to judge voice quality, pronunciation and balance by ear.

## Windows gotchas

- Run Python with `< /dev/null` from Git Bash to avoid hanging on stdin, but never combine that with a heredoc — write scripts to files instead.
- Printing non-ASCII (→, IPA) to the console can raise `UnicodeEncodeError` (cp1252); set `PYTHONIOENCODING=utf-8`.
