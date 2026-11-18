---
name: stage3d-shorts
description: Make a vertical animated short (1080x1920, 30 fps) in the "black stage" 3D look, from a script with word timings to a finished MP4. Use it for any new short in this style, whatever the topic. The look lives in a kit that a video cannot change; a video is one plan file.
---

# stage3d shorts

A dark stage with a mirror floor. Flat white pill figures, props drawn with neon lines, a theatre spotlight on the
person, a camera that moves in real 3D, one caption word at a time. The look was reverse-engineered by measurement
from reference videos (private study material: never copy their content, names or scripts) and then improved.

**Status: v0.1.** Proven on one 9.7 s clip with two stations (`pricetag_demo`) and a 5 s test (`test5`). Not yet
proven on a full-length video. Read "What the kit does not have yet" before promising a scene.

## The idea

- **The kit is the look.** `kit/src/` holds colours, glow, lens, floor, light, camera curves, captions. A video never
  edits it.
- **A video is a plan.** `kit/plans/<name>/plan.js` says what is on stage, when each thing happens and how the camera
  moves. It imports only `kit/src/api.js`. The build refuses a plan that reaches into the look.
- **Numbers decide, not opinions.** Every render is measured by `scripts/qa.py`. A video that fails is not delivered.

## Where the kit lives

This skill is only instructions. The code that draws the video and the reference files are a folder on Pimbo's PC:
`C:\Users\Pimbo\work\anymation\stage3d\skill` (it holds `kit/`, `references/` and a copy of this file). Every path
in this skill is relative to that folder.

- The folder `anymation` must be connected to the conversation. If it is not, ask Pimbo to connect it: without the
  kit no video can be made, and nothing here should be rebuilt from memory.
- Pimbo does not run scripts by hand. You run them. He gives the topic or the video folder, looks at stills, and
  approves.
- The inputs of a video come from his own pipeline: `anymation/v2/v8/<video>/` (`script.json`, `asr_<lang>.json`
  for the word timings, `premix_<lang>.wav` for voice and music, `events_<lang>.json`).
- If you can run commands on his PC, work in the folder itself. If you only have a cloud workspace: copy
  `stage3d/skill` into it (leave out `node_modules`, `out` and `dist`), run `npm install` inside `kit/`, write the
  plan and render stills there (about 2 s each without a graphics card), show him the stills, then write the
  finished `kit/plans/<name>/` back into his folder.
- The final render belongs on his PC: its graphics card is about 20 times faster than a cloud machine. If you cannot
  run commands there, leave a `.cmd` file in `stage3d/skill` that runs
  `node scripts\make_video.cjs <name> --gpu --workers=4` from `kit`, ask him to double-click it and to paste what it
  prints. Read the QA lines before calling the video done.

## Rules that are not negotiable

1. Never edit `kit/src/` to make one video work. If a prop or a shot type is missing, add it to the kit as a reusable
   part (see `references/PLAN_GUIDE.md`, "Adding a prop") and re-check `pricetag_demo` afterwards.
2. Every frame number in a plan comes from the real audio (word timings), never from a guess.
3. Every camera move has a reason you can say in one sentence. Write that sentence as a comment above the move.
4. Look at stills before rendering a clip. Look at the picture, not at the exit code.
5. Say what was measured and what was assumed. If you did not check something, say so.
6. A person listens to the audio before a video goes out: these scripts set levels by numbers.

## Pipeline

Work inside `kit/`. First time on a machine: `npm install` (three, esbuild, playwright-core; it uses the installed
Chrome or Edge, nothing else is downloaded). Rendering needs ffmpeg on the PATH; QA needs Python with numpy and
opencv (`pip install numpy opencv-python`); the audio scripts need scipy.

| Step | What | Command or file |
|---|---|---|
| 1 | Script and voice, with a timing for every word | outside this skill; result: `words.json` = `[{ w, t0, t1, line }]`, seconds |
| 1b | Check every fact of the script on the day, before recording the voice | web search; write `SOURCES.md` next to the plan (example: `plans/no_trick/SOURCES.md`) |
| 2 | Break the script into stations: one sentence or idea each | notes at the top of `plan.js` |
| 3 | Write the plan: build, animate, camera | `kit/plans/<name>/plan.js`; start from `pricetag_demo` |
| 4 | Audio: base mix plus effects on the events | `kit/plans/<name>/make_audio.py` -> `audio.wav` |
| 5 | Check and build | `node scripts/build.cjs <name>` |
| 6 | Stills at the key frames; fix framing; repeat | `node scripts/render.cjs <name> stills 0,17,62,88` |
| 7 | Watch it move with sound | open `kit/dist/<name>/preview.html` in a browser |
| 8 | Render, encode, QA in one go | `node scripts/make_video.cjs <name> --gpu --workers=4` |
| 9 | Read the QA lines; a FAIL means fix and repeat | `kit/out/<name>/logs/qa.log`, `qa.json` |

Step 8 prints one line per step. On a PC with a graphics card a 5 s video takes about 10 s; without one (`--gpu`
left out) each frame takes about 2 s, so render there only what you must.

## Writing a plan, in short

Full guide and the list of parts: `references/PLAN_GUIDE.md`. The worked example is `kit/plans/pricetag_demo/plan.js`.

- The stage is a row of **stations** 14 m apart. One sentence or idea per station. The camera stays on a station for
  a shot and **whip-pans** to the next one between sentences.
- `build(stage)` creates the things and places them: `stage.station(i).add(thing)`. Figures get a spotlight:
  `stage.station(i).spotlight(figure)`.
- `animate(f, o)` sets where everything is at frame `f`. It must be a pure function of `f`: frames are rendered in
  any order and in parallel. No state carried from one frame to the next, no `Math.random`, no clock.
- Things appear **on their word**: `pop(thing, f, wordFrame)`. A number that matters runs while it is being talked
  about. Something that lands gets a floor ring (`pulse`), a short `flare` and a sound.
- Colours by name only. Gold = the valuable thing. Red = price, cost, danger. White = people and neutral labels.
- Text that changes (a counter) needs `maxChars` so its box does not resize.

## Camera, in short

Full rules with the measurements behind them: `references/CAMERA_RULES.md`.

- A shot has one move, sometimes two or three. Between moves the camera **holds** (the kit adds a slow creep).
- Only three kinds of move exist: `hook` (opening push-in, from frame 0), `reframe` (20-28 frames, between two
  sentences, lands a few frames **before** the new thing appears), `slow` (a push or orbit across a whole shot).
- While a graphic animates, the camera holds. A list gets a travel; a wider claim gets a pull-back; one object for a
  long line gets one slow orbit.
- A 3/4 view (yaw around 35-40 degrees) is what shows depth. Use it when a second object needs room.
- Whip-pans only between ideas. Each one needs a whoosh in the audio that starts about 3 frames earlier.

## Quality gates

`scripts/qa.py` fails the video if: a frame is missing or frozen; the background is not the lifted black; the hook or a
reframe is not front-loaded; the camera does not hold between moves; a whip-pan does not move or does not darken; the
MP4 is not h264 / yuv420p / BT.709, has the wrong number of frames, or its audio is missing or of the wrong length.

It does not check taste, cropping at the frame edges, or that the captions say the right words. Those are checked on
stills, by eye, before the render: nothing important cut by the frame edge, the caption band (75-83 % of the height)
clear of bright lines, figures between 25 % and 85 % of the height (the lens stretches things near the edges).

After any change to `kit/src/`: rebuild `pricetag_demo`, render stills 0,17,88,150,174,236 and compare them with
`references/frames/`. In software rendering they must match exactly; on a graphics card, to within about 1 level.

## What the kit has

Figure (pill person with headset), label pill, card with a label and a big value, token, chest that opens (gold, or
a plain grey one for a crowd of chests), round compass with a needle, compass strip of a game screen, outline frame
(a screen, a thumbnail), die, play button, tally marks, dashed guide, picture (a black-and-white SVG or PNG drawn as
light), floor ring, dashed ground line, floating specks, theatre spotlight with
floor pool and shadow, coloured floor pools, halo, rays, sparks, whip-pan with motion blur, captions, a sound library
(whoosh, tick, ding, thud, clunk, sparkle, fizz) and a mixer that lays a voice file and a music file under them.

Two plans to read: `pricetag_demo` (10 s, two stations, the approved look) and `no_trick` (47 s, five stations, a
whole short with its voice, music and sources). `starts_clean` (62 s, six stations) is white until a single gold
payoff, as Pimbo's script rules ask. `avatar` is not a video: it makes stills for a profile picture.

## What the kit does not have yet

- A travel along a row of things (for lists), bars and line charts.
- More than one spotlight in a station: not tried (the specks are lit by at most two spotlights at a time). Several
  figures in one station do work with one spotlight and the others dimmed (`no_trick`, station 2).
- Fades or cuts: the only transition is the whip-pan.
- Close-ups: the camera needs the floor under its subject inside the frame and loses its aim closer than about 2 m.
  A closer picture is cut out of a wider one (`plans/avatar`).
- More than the three move kinds, and any camera roll.
- Voice, music and word timing: they come from outside (Pimbo's `v2/v8` pipeline makes them).

Each of these has to be built in the kit and tried on a real video before a plan can use it.

## Files

| Path | What it is |
|---|---|
| `kit/src/` | The look. `api.js` is the only file a plan imports |
| `kit/plans/<name>/` | One video: `plan.js`, `words.json`, `make_audio.py`, `audio.wav` |
| `kit/scripts/` | `build.cjs`, `render.cjs`, `encode.cjs`, `make_video.cjs`, `qa.py` |
| `kit/audio/sfx.py` | Sound effects and mixer |
| `references/STYLE_BIBLE.md` | Every number of the look, tagged measured, ours or guess |
| `references/CAMERA_RULES.md` | How the camera is edited, with the measurements |
| `references/PLAN_GUIDE.md` | How to write a plan; every function of `api.js`; adding a prop |
| `references/KNOWN_ERRORS.md` | Mistakes already made once, and what now prevents each one |
| `references/frames/` | Target frames of `pricetag_demo` |
