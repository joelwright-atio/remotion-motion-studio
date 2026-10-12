# Remotion Motion Studio

Programmatic motion-graphics videos with [Remotion](https://www.remotion.dev) 4.0.534, set up for working with AI coding agents (Claude Code).

## Quick start

Requires Node.js 20+ (tested with 24).

```bash
npm install
npm run dev                                           # Remotion Studio at http://localhost:3000
npx remotion render EchoGridReel out/echogrid-reel.mp4  # 9:16 explainer Reel with audio
npm run render                                        # 16:9 sample → out/showcase.mp4
```

The generated audio (voiceover, music, sound effects) is committed in `public/audio/`, so rendering works without Python.

## Compositions

| ID | Format | What |
|---|---|---|
| `Showcase` | 1920×1080, 30 fps | Sample: animated text, shapes, transitions |
| `EchoGridReel` | 1080×1920, 30 fps | German product explainer Reel with voiceover, music and SFX |

New composition: copy `src/compositions/_Template`, then register it in `src/Root.tsx`. Texts and volumes are editable as props in Studio.

## Regenerating audio (optional, Python)

```bash
py -m venv .venv
.venv/Scripts/python -m pip install numpy piper-tts edge-tts
# Piper voice model → .venv/piper-voices/ (see .claude/skills/remotion-generated-audio/SKILL.md)
.venv/Scripts/python scripts/audio/vo.py scripts/audio/echogrid-voiceover.json
.venv/Scripts/python scripts/audio/synth.py sfx
.venv/Scripts/python scripts/audio/synth.py music --timing public/audio/vo/echogrid/timing.json
```

## For AI agents

- [AGENTS.md](AGENTS.md) (also loaded via `CLAUDE.md`): project rules, commands and how-tos.
- `.claude/skills/`:
  - the official Remotion skills;
  - `video-content-extraction`: frames and a Whisper transcript from a talk video;
  - `remotion-explainer-reel`: planning and building 9:16 explainer Reels;
  - `remotion-generated-audio`: Piper TTS, synthesised music and SFX, audio sync.
