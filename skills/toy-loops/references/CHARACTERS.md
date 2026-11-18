# Characters

## Claude (lib/chars.py)

- **What it is:** the salmon paper block with four legs and stub arms. It is Anthropic's mascot (the one in
  Claude Code).
- **Why we use it:** Pimbo chose it on 2026-11-18 ("ese Claude está hermoso") for these loops. If a piece is
  published, it is fan art of a brand mascot; that call is Pimbo's.
- **Rig.** `root` (place, turn; scale 1.45) > `rig` (jump height, lean) > `legs` (stretch) + `torso` (squash, arms,
  face).
- **Body:** 60 x 46 x 46 mm before scale, legs 13 mm. The colour #EA8661 renders as #DA8D6C on the lit top face [M].
- **Arms:** stubs 17 x 16 x 14 mm on pivots at 46 % of the body height.
  - `arm_l` and `arm_r` are degrees up (+) or down (-).
  - Raised past about 70° they hide beside the body; wave in a 20°-60° diagonal.
  - Wave with the arm that faces the camera. When Claude turns towards something, the far arm hides.
- **Squash `s`:**
  - Volume is kept: width scales by 1/sqrt(s).
  - The legs take 1.6x the change and fold to 35 % in a squash.
  - Typical values: anticipation 0.80, take-off 1.20, falling 1.10, impact 0.74 for one frame, surprise 1.13.
- **Eyes** (black paper, swapped in one frame, never faded):

  | Set | Shape | Use |
  |---|---|---|
  | `sq` | ■ ■ | normal |
  | `happy` | ^ ^ | joy |
  | `line` | - - | blink (2 frames), bored, "aww" |
  | `squeeze` | > < | effort, blowing, eyes shut tight |
  | `dot` | . . | small, unsure, "hmm" |
  | `sad` | / \ | worried |

  - `eye_big` 1.4 pops on surprise and eases back over about 15 frames.
  - `eye_look` -1..1 slides the eyes. Let the eyes lead the head by 3 frames: `eye_look = YAW(f + 3) / 25`.
- **Props in hand.** Parent them to `claude.hand(side)` with an offset of `side * 0.017` in x (the arm tip).
  - Example: the stick in `loops/claude_fogata`, aimed at a point in rig units.
  - Example: the megaphone in `stills/director_hero`.
  - A prop on the head (a beret) is parented to `claude.torso` at `(0, 0, H)`.
- **Yaw.** The face looks towards -Y. `yaw = camera azimuth` faces the camera. Positive yaw turns it towards the
  screen right.

## The pawn (lookdev only)

A painted wooden game pawn with a headset, dot eyes and blush. It was made for the token videos in
`anymation/toy3d/lookdev/look_test.py` (Pimbo picked the paper island world). It is not in `chars.py` yet. Port it
there if the token videos move to this look.
