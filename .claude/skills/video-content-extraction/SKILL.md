---
name: video-content-extraction
description: Extract the important content from a recorded talk, webinar, screen recording or presentation video (MP4/MOV) — slide text, demo screens, spoken arguments, quotes, names, numbers — by sampling frames and transcribing the audio locally with Whisper.cpp. Use this whenever the user shares or points at a video file and wants it summarized, "extracted for context", turned into a script, a Reel, captions, a blog post or notes — even if they only say "look at this video" or "use the talk as source material".
---

# Video content extraction

Goal: turn a long video into two things you can reason over — a **visual outline** (what was on screen, when) and a **timestamped transcript** (what was said) — and then a structured summary. Do both: slides alone miss the spoken arguments and memorable phrasing; the transcript alone misses on-screen claims, UI and branding.

Work in the session scratchpad, not in the user's project, unless they want the transcript kept.

## 1. Inspect the file

```bash
npx remotion ffprobe "<video>"
```
Note duration, resolution, fps and whether there is an audio stream. In a Remotion project, use `npx remotion ffmpeg` / `ffprobe` — they ship with Remotion so nothing extra needs installing.

**Caveat:** Remotion's bundled FFmpeg is a reduced build. Most filters are disabled (no `fps`, `tile`, `select`, `crop`, `drawtext`) and the `rawvideo` muxer is missing. `scale`, `-ss`, `-frames:v`, audio resampling and `loudnorm` work. Design commands around that rather than fighting it.

## 2. Sample frames

Seek-and-grab one frame per interval (fast, works with the reduced build):

```bash
for t in $(seq 0 20 <duration_s>); do
  npx remotion ffmpeg -y -ss $t -i "<video>" -frames:v 1 -vf scale=640:-1 "<scratch>/frames/t$(printf %04d $t).jpg" -loglevel error
done
```

- 20 s spacing suits talks (slides change slowly); use 5–10 s for fast demos.
- Read frames at ~60 s spacing first to get the structure, then fill gaps where content changes (a new slide, a demo section). Don't read all 50 frames blindly — it burns context.
- Record per section: timestamp, slide title, key on-screen text, UI elements, brand colours/logos.

## 3. Transcribe the audio locally

Extract 16 kHz mono WAV (the format Whisper expects):
```bash
npx remotion ffmpeg -y -i "<video>" -ar 16000 -ac 1 "<scratch>/tx/audio.wav" -loglevel error
```

Then run the bundled script `scripts/transcribe.mjs` from a scratch folder:
```bash
cd <scratch>/tx && npm init -y && npm i --save-exact @remotion/install-whisper-cpp@<project remotion version>
cp <skill>/scripts/transcribe.mjs . && node transcribe.mjs audio.wav medium
```
Run it in the background — a 15-minute talk takes 10–20 minutes on CPU. While it runs, go through the frames and give the user a slide-based summary early; add spoken details when the transcript arrives.

Known pitfalls (all hit in practice; the script header repeats them):
- whisper.cpp **1.5.5** installs reliably on Windows; 1.7.x hung during install.
- Model downloads from Hugging Face get `ECONNRESET` on some networks. Download with `curl -L -C - --retry 5` in a retry loop (resumable), then rerun the script — it skips the download if the model file exists.
- A Node `Warning: Detected unsettled top-level await` means a promise never resolved (usually the installer) — check what actually landed on disk before retrying.
- On Windows Git Bash, `python -` or a heredoc combined with `< /dev/null` hangs or gets no input. Write small helper scripts to files instead.

Whisper mishears names and jargon (e.g. "Wisser" for "Wissen", odd spellings of product names). Correct obvious errors using the slides as ground truth; don't quote garbled sentences verbatim.

## 4. Summarize for reuse

Produce a structured summary in chat (or a file if asked):

- **Meta:** title, speaker, event/date, length, language.
- **Narrative arc:** problem → idea → demo → benefits → CTA (or whatever the real structure is), with timestamps.
- **Key claims and numbers**, each tied to a slide or timestamp.
- **Quotable lines:** short, punchy phrasings from the speaker — these are gold for hooks and voiceovers (e.g. a line explaining the product name).
- **Visual assets worth recreating:** strongest slides, demo screens, icons, colours.
- **Uncertainties:** anything the transcript garbled or the frames didn't show.

Keep personal contact details (phone numbers, emails on closing slides) out of anything you publish or reuse unless the user asks.
