# Remotion Motion Studio

Create animated videos (e.g. Reels for Instagram/LinkedIn) from code, with an AI assistant doing the coding. Built with [Remotion](https://www.remotion.dev) 4.0.534.

**No GitHub account and no programming knowledge needed.** Follow the steps below once (about 15 minutes); afterwards, opening the project takes a minute.

---

## Installation (one time)

### Step 1: Install Node.js

Node.js is the program that runs the video tool.

1. Go to **https://nodejs.org**
2. Download the version marked **"LTS"** (the big green button).
3. Open the downloaded file and click through the installer with the default settings (**Next → Next → Install**).
4. Restart your computer afterwards. This makes sure everything is picked up.

### Step 2: Download this project

1. On this GitHub page, click the green **`<> Code`** button (top right of the file list).
2. Click **Download ZIP**.
3. Right-click the downloaded ZIP and choose **Extract All…** (Windows) or double-click it (Mac).
4. Move the extracted folder somewhere easy to find, e.g. `Documents\remotion-motion-studio`.
   On Windows, avoid OneDrive folders, which can slow things down or cause errors.

### Step 3: Open a terminal in the project folder

The terminal is a window where you type commands. You only need to copy and paste a few.

- **Windows:** open the project folder in File Explorer, click in the **address bar** at the top, type `powershell`, and press **Enter**. A blue or black window opens, already in the right folder.
- **Mac:** open the **Terminal** app, type `cd ` (with a space after it), drag the project folder into the window, and press **Enter**.

### Step 4: Install the project

Copy this command into the terminal and press **Enter**:

```
npm install
```

It takes 1–3 minutes and prints a lot of text. That's normal. It's finished when you can type again. Warnings ("WARN") are fine; only stop if you see **"ERR!"**.

> **Windows error "running scripts is disabled on this system"?**
> Run this command once, confirm with **Y** and Enter, then repeat `npm install`:
> ```
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

---

## Using it

### Preview the videos (Remotion Studio)

In the terminal (Step 3), run:

```
npm run dev
```

After a few seconds your browser opens **Remotion Studio** at http://localhost:3000. If it doesn't, open that address yourself.

- On the left, choose a video: **EchoGridReel** (the vertical Reel) or **Showcase** (a sample).
- Press **Play** (or the space bar) to watch, with sound.
- **Change texts and volume:** on the right, under *Props*, you can edit every text, the music volume (`musicVolume`) and the sound effects volume (`sfxVolume`). The preview updates immediately. Click the save icon to keep your changes.

To stop the Studio, click in the terminal and press **Ctrl + C**.

### Export a video as MP4

Open a second terminal (Step 3 again), or stop the Studio first, then run:

```
npx remotion render EchoGridReel out/echogrid-reel.mp4
```

After about 1–2 minutes the finished video is in the **`out`** folder inside the project. It's ready for Instagram, LinkedIn or email.

You can also export from inside the Studio: click **Render** (bottom right).

---

## Working with the AI assistant (optional)

The project includes instructions and "skills" for **Claude Code**, so you can request changes in plain language. For example: *"Make the hook text bigger"*, *"Create a new Reel about our product X"*, *"Turn this webinar recording into a 30-second Reel"*.

1. Install Claude Code: https://claude.com/claude-code (desktop app or terminal).
2. Open this project folder in Claude Code.
3. Describe what you want. The assistant reads `AGENTS.md` and the skills in `.claude/skills/` automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` is "not recognized" / "command not found" | Node.js isn't installed, or the computer hasn't been restarted since installing it (Step 1). |
| "running scripts is disabled" (Windows) | See the note in Step 4. |
| Studio doesn't open | Open http://localhost:3000 in your browser yourself. |
| "Port 3000 is already in use" | The Studio is already running in another terminal. Use that one, or close it with **Ctrl + C**. |
| No sound in the preview | Click into the preview once, then press Play. Browsers block sound until you click. |
| Anything else | Copy the error text from the terminal and send it to Joel, or paste it into Claude Code. |

---

## Technical details

<details>
<summary>For developers</summary>

| Composition | Format | What |
|---|---|---|
| `Showcase` | 1920×1080, 30 fps | Sample: animated text, shapes, transitions |
| `EchoGridReel` | 1080×1920, 30 fps | German explainer Reel with voiceover, music and SFX |

- New composition: copy `src/compositions/_Template`, then register it in `src/Root.tsx`.
- `npm run lint` runs ESLint and TypeScript.
- The generated audio is committed in `public/audio/`, so rendering doesn't need Python.

Regenerating audio (Python 3.11+):
```bash
py -m venv .venv
.venv/Scripts/python -m pip install numpy piper-tts edge-tts
# Piper voice model → .venv/piper-voices/ (see .claude/skills/remotion-generated-audio/SKILL.md)
.venv/Scripts/python scripts/audio/vo.py scripts/audio/echogrid-voiceover.json
.venv/Scripts/python scripts/audio/synth.py sfx
.venv/Scripts/python scripts/audio/synth.py music --timing public/audio/vo/echogrid/timing.json
```

Agent docs: [AGENTS.md](AGENTS.md) (also loaded via `CLAUDE.md`), skills in `.claude/skills/`:
- `video-content-extraction`
- `remotion-explainer-reel`
- `remotion-generated-audio`
- the official Remotion skills

</details>
