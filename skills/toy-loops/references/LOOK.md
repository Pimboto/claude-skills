# The toy paper look: numbers

Tags: [M] measured by a script, [V] seen on a frame, [S] our choice or a guess. References: `anymation/3d_ref/style2`
(1.mp4 film, 2-4.gif loops), first pass in `3d_ref/style2/analysis/FIRST_PASS.md`.

## What the references do

- **[V] Materials.** Toy miniatures of paper, card, clay and wood: flat colours, a thin light line on every paper
  edge, soft contact shadows.
- **[V] Depth of field.** Shallow everywhere. Backgrounds are bokeh. r2 and r4 have a tilt-shift miniature feel.
- **[M] Loops.**
  - Lengths and rates: 6-9 s at 25 fps; 150, 228 and 152 frames.
  - They close exactly: the last-to-first step is the size of a normal step.
- **[M] Camera.**
  - Holds still 48-85 % of the time.
  - In the loops the creep is about 0.
  - r4 closes its loop by pushing into a smaller copy of the room.
- **[M] Rhythm.** Something new on screen every 0.5-1 s.
- **[V] Faces.** They change in one frame (eyes swap), and a cut lands on the swap.

## Our settings (lib/toy.py)

| Thing | Value | Why |
|---|---|---|
| Scale | 1 unit = 1 m, Claude ~9 cm wide (rig x1.45) | the real depth of field of a 70 mm lens gives the miniature blur [S] |
| Colour | AgX, look "AgX - Punchy" | Base Contrast measured luma 196 / saturation 63, too washed; Punchy at exposure -1: 132 / 111, inside the references 91-181 / 93-168 [M] |
| Exposure | -1.0 day, -0.35 night | night frames mean luma about 52 [M], cosy but readable |
| Paper | roughness 0.82, fibre bump 0.035 at noise scale 900, tone blotches up to 35 % | flat colour without looking like plastic [S] |
| Edges | bevel 0.6-1.0 mm on angles > 30°, white paper material on the bevel | the light edge line of the references [V] |
| Key light | area 0.35 m, ~52 W, warm #FFD9A8, high and in front (-0.40, -0.45, 0.80) | top face brighter than the front, front lit (#CF7850 front, #DA8D6C top) [M] |
| Fill | area 0.9 m, 3 W, cool #BFD9FF, front right | |
| Rim | area 0.3 m, 14 W, warm, behind | |
| Camera | 70 mm, f/7 (whole island sharp, sky blurred), dist ~0.66 m, elevation ~29° | |
| Engine | EEVEE, 64 samples, raytracing on | 0.7 s/frame vs Cycles 10 s, same look [M] |
| GIF | ffmpeg palettegen stats_mode=full, paletteuse sierra2_4a, 25 fps (4 cs per frame) | 1080 GIF 28-45 MB like the references (37-53 MB); 720 is about half [M] |

## Palettes that worked

- **Day island:**
  - sea #2B9FA3 with foam #86D3CB
  - sand #F1D6A2 / #E2BE84, grass #7CC26A
  - sky card #F7C9A3, clouds #FFF4E6, world #E9D2BC at 0.22
- **Night camp:**
  - world #1A2A55 at 1.1, sky card #22386E glowing 0.25
  - moon area light 30 W #8FAEFF from behind left, fill 9 W #7C93D6
  - fire point light 2 W #FF8C3A flickering ±16 %
  - flames (flame_mat): #FF4A0A 2.2, #FF8A10 2.6, #FFC93A 3.0
- **Film set (hero):**
  - floor #2B2838, backdrop #151D3A painted by a 22 W #4A63C9 background light
  - key 30 W warm, spot pool 26 W
  - Cycles 256 samples

## Web hero pictures

- Wide 2400x1200.
- `cam.data.shift_x = -0.24` pushes the subject to the right third and keeps perspective, so the left 40 % stays
  clean and dark for a white headline.
- Point the action (a megaphone, a look) towards the text side.
- `tools/duotone.py` makes the blue monochrome version (stops #081150, #2447D8, #9DB4FF, #F2F5FF).
