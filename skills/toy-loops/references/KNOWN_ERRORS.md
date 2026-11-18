# Known errors (each one cost a render)

| Error | What it looked like | Fix now in place |
|---|---|---|
| AgX Base Contrast at exposure 0 | washed pastel, luma 196, saturation 63 | AgX Punchy, exposure -1 (render_settings default) |
| Key light from the side | Claude's front face muddy (#B3542B) | key high and in front; measure the front and top faces |
| Linear and sine motion only | Pimbo: "la animación podría ser mucho mejor" | lib/anim.py and references/ANIMATION.md |
| Stub arm raised to 82° | the wave was invisible, hidden beside the body | wave 22°-62°; check a full-size crop of the arm |
| Waving with the far arm | the waving arm was behind the body while Claude turned to the boat | wave with the arm facing the camera |
| Eyes 5 mm | tiny at loop framing | squares 6.6 x 9.2 mm, chevrons 10 mm wide |
| Flames with a paper material | the fire light washed them to pink-white | `flame_mat`: black base, emission only; `no_shadow` |
| Breath puffs starting at the face centre | a grey disc covered an eye | start them 45 % of the way to the target; white `flame_mat` |
| A night scene in absolute grey levels | QA said "too quiet" (0.90) although it moved more than the island | QA compares motion relative to brightness |
| Halo disc behind the subject | read as a navy panel with a hard edge | a background area light that paints a soft pool on the backdrop |
| Backdrop arc 120° in a wide shot | its edge showed as a vertical line | `backdrop(..., arc_deg=200)` for wide frames |
| `cv2` or `numpy` from the wrong Python | | tools use system Python (numpy + Pillow); Blender has its own numpy |
| Billboarded cut-out rotated an extra 90° | flames lay flat | `billboard()` already makes the outline face the camera; add nothing |
