# Style bible

Every number of the look and where it comes from. Tags: **[M]** measured on the reference videos (analysed at
720x1280; px values below are at that size), **[O]** ours: chosen by us, and measured on our own clips where a
number is given, **[G]** a guess that nobody has measured. The code is in `kit/src/`; this file is the explanation.

## Frame

| What | Value | Tag |
|---|---|---|
| Size and rate | 1080x1920, 30 fps | [O] |
| Background | `#050505`, a lifted black | [M] |
| Vignette | brightness falls to 0.52 in the corners | [M] |
| Dither | +-0.5 level of noise so the dark vignette does not band | [O] |

## Floor

| What | Value | Tag |
|---|---|---|
| Mirror | reflection strength `0.035 + 0.5 * exp(-h / (0.046 * figure height))`, h = height above the floor | [M] |
| Mirror blur | sigma 1.75 px | [M] |
| Ground line | grey, dashed, dash = 62 % of an 80 px period | [M] |
| Floor ring when something lands | grows for 14 frames with an ease-out, gone by frame 17 | [M] |

## Light

| What | Value | Tag |
|---|---|---|
| Glow of lines | three blurs, sigma 2.8 / 9 / 40 px, weights 0.150 / 0.049 / 0.064 | [M] |
| Glow of solid white shapes | two blurs, sigma 3 / 9.6 px, weights 0.265 / 0.048 | [M] |
| Lines | width in world units, never thinner than 3 px; where two lines cross, the brighter one wins | [M] min width; [O] the blend |
| Spotlight on a figure | a soft cone from above; 2.1 figure heights wide at the floor, apex 6.3 figure heights up, brightest just above the figure, fades upwards with a scale of 2 figure heights | [M] |
| Spotlight level | reference +2 to +15 levels over black; ours +9 to +20 | [M] / [O] |
| Floor pool and shadow under the spotlight | pool about +30 levels beside the figure, +19 on the shadow side; the shadow is faint | [O] not measured in the reference |
| Coloured pool under a glowing thing, halo, rays, sparks | values in `kit/src/api.js` (`GLOW`) | [O] |
| Specks in the air | drift under 0.3 px per frame, blur with distance from the focus plane | [M] that they exist and drift; [G] the lens model |

## Figure

A flat white pill person that turns to face the lens. **[M]** on 81 instances, in figure heights: head diameter 0.33,
gap 0.056, body 0.62 high and 0.51 wide. Lit from above: feet 20 % darker. The headset is ours **[O]**: it is not the
reference's character. Name, voice and scripts are ours too.

## Colour

| Name | Line core | Glow | Caption | Meaning [O] |
|---|---|---|---|---|
| white | `#FFFFFF` | white | `#FFFFFF` | people, neutral labels |
| gold | `#FFF992` | amber, hue 38 degrees | `#FBC459` | the valuable thing, the good outcome |
| red | `#FF8A80` | red-orange | `#FF6451` | price, cost, danger |

Core and glow colours **[M]**. Brightness ladder **[O]**: 1.0 the subject, 0.55 secondary things, 0.22 background
things, 0.3-0.5 small label text.

## Type

Inter, embedded in the bundle (weights 600 and 700). Captions: one word at a time at 78.9 % of the height, first
frame at half brightness **[M]**; 62 px bold, a dark halo behind the word, key words land 24 % bigger and settle in
about 5 frames **[O]**. Label sizes and letter-spacing **[G]**.

## Lens and camera

80 degree vertical field of view, camera 4.4-6.1 m from the subject **[O]** (the reference's lens is not measured;
this gets a card edge ratio of 1.33-1.38 against its 1.44). Whip-pan: 16 frames, darkens to 0.53 in the middle
**[M]**; motion blur with a 0.35 frame shutter **[G]**. Everything else about the camera: `CAMERA_RULES.md`.

## Motion of things [O]

Things pop in over 5-9 frames with a small overshoot, on their word. A number that matters runs while it is talked
about and lands with a ring, a flare of its frame and a hit in the audio. A figure reacts to a hit with a small lean
that dies away in about 20 frames.

## Sound

Seen on the reference's spectrogram **[S]**: a soft broadband noise during whip-pans, fine ticks while the opening
number counts. Ours **[O]**: a whoosh on every camera move, peaking where the move is fastest; ticks while a number
runs; thud plus ding when it lands; latch and sparkle for the chest. Levels are set by numbers, 11-25 dB under the
voice mix: nobody has listened to them yet except Pimbo.

## Encoding

h264, CRF 14, yuv420p, BT.709 conversion **and** tags (`scripts/encode.cjs`). AAC 192 kb/s.
