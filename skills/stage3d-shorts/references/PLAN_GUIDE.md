# How to write a plan

A plan is one file, `kit/plans/<name>/plan.js`. It imports from `../../src/api.js` and from its own `.json` files,
nothing else. Read `kit/plans/pricetag_demo/plan.js` first: it is a complete, approved example.

```js
import { definePlan, POSE, stationX, figure, card, pop, prog } from '../../src/api.js';
import WORDS from './words.json';

export default definePlan({
  name: 'my_video',            // same as the folder name
  frames: 291,                 // length of the video at 30 fps
  words: WORDS,                // [{ w, t0, t1, line }] in seconds; one caption word at a time
  keywords: { token: 'gold' }, // caption words that take a colour ('gold' or 'red') and land bigger
  build(stage) { ... return { things } },      // create and place everything, once
  animate(f, o) { ... },                        // where everything is at frame f; o = what build returned
  camera: { whips: [166], shots: [ ... ] },     // one shot per station; whip i leads from shot i to shot i + 1
});
```

## From words to frames

`frame = round(seconds * 30)`. Write the word starts as a comment at the top of the plan, then hang every event on
one of them. Something that is named appears on its word or up to 4 frames before, never after.

## Stations

`stage.station(i)` is the place of sentence `i`; its origin is at `x = stationX(i)` (14 m apart), floor at `y = 0`,
`z` towards the camera. A typical layout: the figure 1.25-1.75 m left of the origin at `z = -0.5`, the subject
0.75 m right of it, labels above, a few dim things 3-6 m behind for depth.

| Call | What it does |
|---|---|
| `S.add(thing)` | Puts a thing in the station. `S.add(thing, { faceCamera: true })` makes it turn to the lens (figures, pills, halos, rays) |
| `S.spotlight(figure, { tint, shadow })` | Theatre spotlight. `tint`: `'neutral'` or `'warm'`. `shadow`: floor direction `[x, z]`; give it a sideways part |
| `stage.passing(i).add(thing)` | Something between station `i` and the next one: only drawn while the whip-pan streaks past |

A station is drawn only around its own shot. You may set `position`, `rotation`, `scale` and `visible` of anything.

## Things

| Function | Returns | Notes |
|---|---|---|
| `figure()` | group | `.userData.headTop` = height of the top of the head (1.7 m figure). `figure({ headset: false })` = the plain figure |
| `picture(file, width, height, colour)` | mesh | A black-and-white SVG or PNG of the plan folder, drawn as light: `import art from './art.svg'`. White shines, black is empty; it glows and reflects like the lines. The SVG needs a width and height in pixels |
| `pill(text, colour, height)` | group | Outlined label. Uppercase text |
| `card(colour, label, value, { w, h, maxChars, valuePal })` | `{ group, frame, lab, val }` | `val.set(text)` changes the big value; give `maxChars` if it changes |
| `label(text, colour, { height, weight, spacing, maxChars })` | `{ mesh, set }` | Free text. Weights 600 or 700 only |
| `token()` | mesh | The coin |
| `chest()` | group | `openLid(chest, 0..1)`, `lightChest(chest, lit, fade)`. `chest('grey', { simple: true })` = a plain chest for a crowd in the background |
| `compass(colour, needleColour)` | group | Round dial with a needle, radius 1 (scale it). `turnNeedle(compass, radians)`: 0 = up, positive = anticlockwise. Never draw another compass as a star: the token has the star |
| `compassStrip(colour)` | group | The heading strip a game shows at the top of the screen, 4 m wide |
| `frame(colour, width, height, radius)` | mesh | Rounded outline: a screen, a phone, a video thumbnail |
| `die(colour, size)` | mesh | A die of lines; its centre is its origin, so rest it at `y = size / 2` |
| `playIcon(colour, radius)` | mesh | Circle with a triangle |
| `tally(colour, height)` | mesh | One hand-drawn group of five strokes. Many of them make a count without a number (see `starts_clean`) |
| `guide(colour, length)` | mesh | Dashed line along +x from 0 to `length`: a path between two things. Rotate it with `rotation.y = Math.atan2(-dz, dx)` |
| `ring(colour)` | mesh | Floor ring; fire it with `pulse` |
| `pool(colour, width, depth)` | mesh | Coloured light on the floor: `'red'`, `'gold'`, `'goldSoft'` |
| `halo(colour, size)` | mesh | Soft glow around a floating thing: `'gold'`, `'goldSoft'` |
| `rays()` | mesh | Rays fanning up (out of the chest) |
| `sparks(colour, count, seed, { t0, spread, speed, up, life, ring })` | mesh | Born at frame `t0`; `'gold'` or `'red'` |

Colours for lines and text: `'white'`, `'gold'`, `'goldSoft'`, `'red'`, `'grey'`, `'dim'`.

## Moving things

| Function | What it does |
|---|---|
| `prog(f, f0, n)` | 0 before `f0`, rising to 1 over `n` frames |
| `pop(thing, f, f0, n, overshoot, scale)` | Appears at `f0` over `n` frames with a small overshoot |
| `leave(thing, f, f0, n)` | The opposite of `pop`: shrinks away in `n` frames. Call it after `pop` in the same frame |
| `pulse(ring, f, f0, radius)` | Fires a floor ring at `f0` |
| `flare(thing, v)` | Brightness of its lines; 1 = normal. For a short hit |
| `level(thing, v)` | Strength of a pool, halo, rays or a text: 0 to 1 |
| `dim(thing, v)` | Pushes a whole thing back: 0.55 secondary, 0.22 background |
| `money(n)` | `'$10,000'` |
| `rng(seed)` | Seeded random numbers, for scattering background things |
| `easeOutCubic`, `easeOutExpo`, `easeOutBack`, `easeInOutSine`, ... | Curves for your own motions |

`animate` must depend only on `f`. Do not keep counters or "last value" variables: frames are rendered out of order.

## Camera

```js
camera: {
  whips: [166],                                  // frame where each whip-pan starts; it lasts 16 frames
  shots: [
    { start: POSE(cx, cz, yaw, dist, h, feetY), moves: [
      { f0: 0,  f1: 17, kind: 'hook',    to: POSE(...) },
      { f0: 62, f1: 88, kind: 'reframe', to: POSE(...) },
    ] },
    { start: POSE(...), moves: [ { f0: 184, f1: 291, kind: 'slow', to: POSE(...) } ] },
  ],
}
```

Poses of shot `i` use `stationX(i)` for `cx`. A whip-pan lands 16 frames after it starts; the next sentence should
start about 4 frames after that. Rules and typical numbers: `CAMERA_RULES.md`.

## Audio

`make_audio.py` next to the plan writes `audio.wav`. It uses `kit/audio/sfx.py`: a base track (voice and music) plus
effects by frame. The base is one finished mix (`Mix(frames, base='premix.wav')`) or separate files laid in with
`m.track(path, gain_db, skip, at_frame, fade_in)`; `skip` is how you line the music up (in `no_trick` the music comes
back in exactly on the relief line). One cue per event of the plan: a whoosh per camera move (start it 1 frame before the move; for a
whip-pan, 3 frames before), ticks while a number runs, thud plus ding when it lands.

## Adding a prop to the kit

1. Build it in `kit/src/parts.js` from `LineSet` lines, plus `fillMat` faces if it needs volume. Return a group or mesh.
   Use only `PAL` colours. No new materials.
2. If it has moving parts, keep them in `group.userData` and add a small function in `api.js` to move them
   (like `openLid`).
3. Export a wrapper in `api.js` that takes a colour name.
4. Rebuild `pricetag_demo` and compare stills with `references/frames/`: the kit must still draw it the same.
5. Add the prop to the table above and to "What the kit has" in `SKILL.md`.

## Checklist before rendering

- Word frames written at the top; every event tied to a word.
- Each camera move has its reason as a comment, and lands before the thing it makes room for.
- Stills at: frame 0, the end of every move, the middle of every hold, every moment something lands.
- Nothing cut by the frame edge; caption band clear; the first frame already shows the subject.
