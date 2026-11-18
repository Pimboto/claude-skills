# How toy3d animates (read before writing any pose(f))

Pimbo's rule (2026-11-18): motion must look like an animator made it, not like math. Version 1 of the Claude GIF
used sines and constant speeds and he asked for "una animación más animada". Version 2 used the classic principles
(Thomas and Johnston, *The Illusion of Life*) and moved about 30 % more [M]. Pimbo: "esta épica". The tools are
in `kit/lib/anim.py`; the worked examples are `kit/loops/claude_isla` and `kit/loops/claude_fogata`.

## Method

1. **Dope sheet first.** Write the beats with frame numbers as a comment block at the top of the animation
   (see `kit/loops/claude_isla/scene.py`): what happens, on which frame, and why.
2. **Pose to pose.** Each channel is a `Track` of key poses `(frame, value, ease)`. The ease shapes the move into
   that key. Holds sit between keys, and breathing keeps a hold alive.
3. **Never linear for a body.** Use `inout` for most moves, `outback` for a turn or a raise that overshoots and
   settles, and `in2` for falling. `lin` is only for the horizontal travel of a jump and for machines.
4. **Anticipation.** Before every jump or fast move, go the other way first: squash to about 0.80, lean back and
   pull the arms back, for 5 to 8 frames.
5. **Squash and stretch.** Use `squash(s)` so the volume stays the same.
   - Stretch to about 1.2 on take-off and about 1.1 while falling.
   - Squash to about 0.75 for one frame at contact, then `spring(t, 8, 4)` takes it past 1 and back.
   - The legs take most of the stretch (`legf = 1 + 1.6*(s-1)`) and fold under a squash.
6. **Arcs.** A jump follows `arc(u, h)` (a parabola), with the horizontal travel spread evenly over its length.
7. **Follow-through and overlap.**
   - Arms flap up while falling and drop past rest after landing.
   - One arm runs 1 frame behind the other.
   - The body leans against a waving arm 2 frames late.
8. **Eyes.**
   - Swap in one frame on the key pose, never fade: `^ ^` on joy, `- -` on a blink or "aww", big `■` on surprise.
   - Surprise eyes pop to about 1.4x and ease back over 15 frames.
   - The eyes lead the head by 3 frames.
9. **Secondary action.** An event fires a spring somewhere else, for example the palm shakes with `kick()` when
   Claude lands.
10. **Seamless loops.** Every periodic motion divides T, and every Track has the same value at 0 and T. Impulses
    use `looped(f, hit, T)` so their tail carries across the wrap. Check with the closure measure:
    last-to-first step <= the median step.

## Gotchas found on this character

- Stub arms are short. Raised past about 70° they hide beside the body, so wave in a 20°-60° diagonal.
- The waving arm must be on the side facing the camera. When the character turns, switch arms.
- Look at a frame-by-frame strip of every action (`ffmpeg ... tile=6x5`) before rendering the loop.

10b. **One story per loop**, told in beats a viewer can follow without sound:
    - something happens, the character reacts, acts, gets a result, and comes back to the start pose;
    - the island: boat, surprise, jump, wave, aww, hop home;
    - the campfire: fire, panic, blow, hmm, chomp, love, new marshmallow.

## Numbers [M] (mean grey step between frames, 1080 GIF; tools/qa_loop.py measures at 540 px and relative to brightness)

| | median | p90 | max | last -> first |
|---|---|---|---|---|
| references r2 / r3 / r4 | 2.33 / 2.28 / 2.53 | 3.43 / 7.52 / 12.65 | 5.8 / 17.9 / 17.2 | 2.29 / 3.55 / 4.58 |
| Claude v1 (sines) | 1.24 | 2.13 | 2.88 | 1.10 |
| Claude v2 (principles) | 1.61 | 3.06 | 6.71 | 1.20 |
| campfire (night) | 0.87 at 540 px = 1.66 % of brightness | 2.41 | 4.82 | 0.27 |
