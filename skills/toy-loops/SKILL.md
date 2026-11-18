---
name: toy-loops
description: Make seamless looping 3D animations (GIF and MP4), web hero pictures and live web pieces (Claude's eyes following the cursor) in a toy paper-diorama look, built entirely from Python and rendered in Blender, animated with the classic animation principles (anticipation, squash and stretch, follow-through, overshoot). Use it when Pimbo asks for a GIF, a loop, a toy, paper or diorama animation, a Claude animation, a hero picture, eyes that follow the mouse, or the Claude 3D model.
---

# toy-loops

Small paper-craft worlds (an island, a campsite, a film set), Claude as the actor, soft warm light and a shallow
depth of field like a miniature. Every object is built from code and every frame is computed from its number, so a
loop closes exactly. The look was studied from Pimbo's references in `anymation/3d_ref/style2` with the
`reference-video-analysis` skill (first pass: `3d_ref/style2/analysis/FIRST_PASS.md`). Those references are private
study material: copy the craft, never their scenes.

**Status: v1, 2026-11-18.** Pieces made with it and checked:
- `claude_isla`: approved by Pimbo ("esta épica").
- `claude_fogata`: the second loop.
- `director_hero`: a 2400x1200 web hero picture, made in two colourings.
- `claude_pose`: the cut-out with live web eyes.
- `claude.glb`: the 3D model.

## Where everything lives

The code is a folder on Pimbo's PC: `C:\Users\Pimbo\work\anymation\toy3d\skill`. Every path below is relative to
its `kit/` folder unless it says otherwise.

| Path | What it is |
|---|---|
| `lib/toy.py` | The look: paper materials with white bevelled edges, shapes, light, camera, render settings |
| `lib/anim.py` | The animator's tools: eases, `Track` (pose to pose), springs, `squash`, `arc`, `looped` |
| `lib/chars.py` | `Claude`: the rig and its six eye sets; `.pose(...)` once per frame |
| `lib/runner.py` | Renders a scene frame by frame; every scene ends with `runner.run(...)` |
| `loops/<name>/scene.py` | One looping animation |
| `stills/<name>/scene.py` | One picture (T = 1) |
| `tools/make_loop.py` | Render, encode GIF 1080/720 and MP4 x1/x3, QA, contact sheet, in one command |
| `tools/qa_loop.py` | Loop seam, frame count, dead holds, motion compared with the references |
| `tools/duotone.py` | Blue monochrome version of a picture (web hero style) |
| `tools/web_eyes.py` | A web page where Claude's eyes follow the cursor, from an eyes-off render |
| `tools/claude_glb.py` | The Claude model as a .glb (flat colours, white edges kept), run inside Blender |
| `out/<name>/` | Output: `frames/`, the files, `sheet.jpg`, `qa.json` |

Finished pieces are copied to `anymation/toy3d/videos/<name>/`; web pieces live in `anymation/toy3d/web/`.

Needs:
- Blender 5.2: Pimbo's portable copy is at `anymation/tools/blender`; elsewhere set `$BLENDER` or put `blender` on the PATH.
- ffmpeg on the PATH.
- Python with numpy and Pillow, for the tools.

Pimbo does not run scripts: you run them and show him pictures.

## Rules that do not bend

1. **Show before building.** Before a new world or character, render 2-3 stills (`--frames ... --scale 0.5`) and
   let Pimbo choose. Look at every picture yourself before showing it.
2. **`pose(f)` is a pure function of the frame.** No state carried between frames, no random numbers without a
   fixed seed, every periodic motion a whole number of cycles per loop. Effects that cross the loop end use
   `looped()`.
3. **Animate like an animator** (`references/ANIMATION.md`). Write a dope sheet first, then use key poses with eases.
   Use anticipation before every action, squash on impact and stretch on speed, overlap on arms, and one-frame eye
   swaps. Never move a body linearly.
4. **A loop is done only when QA passes** (`make_loop.py` prints PASS/FAIL) **and you have looked at a frame-by-frame
   strip of every action** (see "Strips" below).
5. **Say what was measured [M], seen [V] and assumed [S].**

## Pipeline

| Step | What | Command (from `kit/`) |
|---|---|---|
| 1 | Idea: place, one small story with a beginning and a loop back; 6-9 s | talk to Pimbo |
| 2 | Copy the closest scene: `loops/claude_isla` (day, outdoor) or `loops/claude_fogata` (night, props, effects) | |
| 3 | Build the set, place Claude, light and camera; look at stills | `python tools/make_loop.py <name> --frames 0 --scale 0.5` |
| 4 | Dope sheet comment, then the Tracks; render the key poses | `python tools/make_loop.py <name> --frames 44,62,66,71,77,81` |
| 5 | Fast look at the whole loop | `python tools/make_loop.py <name> --preview` (every 8th frame) |
| 6 | Full render + GIF + MP4 + QA | `python tools/make_loop.py <name>` |
| 7 | Strips of each action, fix, re-render | see "Strips" below |
| 8 | Copy the finished files to `anymation/toy3d/videos/<name>/` and send them to Pimbo | |

Timings on Pimbo's PC (RX 6800 XT) [M]:
- **EEVEE:** about 0.7 s per 1080x1080 frame, so a 200-frame loop takes about 2.5 minutes.
- **Cycles:** about 10 s per frame and looks almost the same. Use it for stills only: `--engine cycles --samples 256`
  takes about 20 s at 2400x1200.

**Strips.** To look at an action frame by frame:

```
ffmpeg -framerate 25 -start_number 56 -i out/<n>/frames/%04d.png -frames:v 30 -vf "crop=...,scale=260:-1,tile=6x5" -frames:v 1 strip.jpg
```

## Look, in short (details and numbers: `references/LOOK.md`)

- **Toy scale.** 1 unit = 1 m and Claude is about 9 cm wide. The real camera depth of field (70 mm, f/4.5-7) then
  gives the miniature blur by itself.
- **Paper.** Every solid gets `paper(...)`: matte colour, fibre bump, soft blotches. Bevelled edges get the
  white-edge material automatically (`box`, `prism`, `disc`).
- **Colour.** View transform AgX with the Punchy look. Exposure -1 for day and about -0.35 for night.
  - Lit faces: Claude's lit faces measure near the references (ours #DA8D6C, references #EC815B).
  - Brightness: day frames have a mean brightness of 120-140 (references 91-181).
- **Light.** A warm key, high and in front, so the top face is brighter than the front. Add a weak cool fill and a
  warm rim. Glowing things (flames, stars, puffs) use `flame_mat` and `no_shadow`.
- **Camera.** Holds still in loops (the references move the camera only for a cut or a push-in).
  - Square 1080 for GIFs.
  - Heroes are wide, with `shift_x` pushing the subject to one third.

## Claude, in short (`references/CHARACTERS.md`)

`claude = Claude('claude', loc)`, then once per frame:

```python
claude.pose(s, hop, pitch, roll, yaw, arm_l, arm_r, eyes, eye_big, eye_look, loc)
```

- **Eyes:** `sq`, `happy` (^ ^), `line` (- -), `squeeze` (> <), `dot` (. .), `sad`.
- **Props:** a held prop is parented to `claude.hand(side)`.
- **Waving:** the waving arm must be the one facing the camera.

## Web pieces: live eyes and the 3D model

- **Live eyes.**
  1. Render with `--eyes-off` (and `--transparent` for a cut-out):
     `python tools/make_loop.py claude_pose --transparent --eyes-off --tag _noeyes`. The runner hides the eyes and
     writes `eyes.json`: each eye's pixel centre and the face axes in pixels per mm.
  2. Run `python tools/web_eyes.py <noeyes.png> <eyes.json> <out_dir> --ink-from <render with eyes>`. It writes
     `index.html` plus a single-file `<dir>_un_archivo.html`.
  3. What the page does:
     - The eyes are SVG shapes drawn on the face plane, so perspective is right even on a tilted face.
     - They follow the pointer with an underdamped spring and blink every 2.5-5.5 s.
     - `^ ^` when the pointer is near, `> <` while pressed.
     - A squash-and-stretch bounce on click (not with `--hero`, which keeps a full picture still).
  4. Tested in Chrome through playwright (pointer left, right, up, down, near, press, release): no console errors.
- **3D model.** Run `blender -b --factory-startup --python tools/claude_glb.py -- <out.glb> [--eyes sq]`. It writes
  a 27 KB GLB, about 9 cm wide, re-imported and checked.
- **Scenes and `--eyes-off`.** A scene that poses Claude at build time must pose it again inside `pose(f)`;
  `--eyes-off` only takes effect there (see `stills/director_hero`).

## Quality gates (`tools/qa_loop.py`)

FAIL:
- Wrong frame count.
- A seam: the step from the last frame to the first is bigger than the 90th percentile of normal steps.

WARN:
- Identical consecutive frames (a dead hold).
- Motion under 0.8 % of the mean brightness. Measured [M]: references r2/r3/r4 1.65/1.97/1.07 %, `claude_isla`
  0.89 %, `claude_fogata` 1.66 %.

QA cannot judge taste, acting or framing. Those are checked by eye on stills and strips.

## Known errors (`references/KNOWN_ERRORS.md`)

The ones that cost a re-render:
- An arm raised past about 70° hides beside the body.
- Bright emission washes to white under AgX: use `flame_mat`.
- A side key leaves the front face dark.
- A night scene measured with absolute grey levels looks "too quiet".
- A curved backdrop arc that is too narrow shows its edge.
