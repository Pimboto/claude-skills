# Errors already made once

Each one cost a wrong delivery or a failed render. What prevents it now is in the last column.

| # | What happened | Why | What prevents it now |
|---|---|---|---|
| 1 | A clip was delivered without the spotlight; later a card vanished | A trailing `//` comment was added in the middle of a line and swallowed the statements after it. The object was built but never added. Nothing failed | `build.cjs` refuses a line with a statement inside a comment |
| 2 | "Verified" contact sheets showed frames from a minute later | Only the exit code and the file size were checked, not the picture | Look at the picture. A check is a comparison with something known |
| 3 | Gold came out slightly orange in five clips (green 6 levels low) | ffmpeg converted RGB to YUV with BT.601 while the file was tagged BT.709 | `encode.cjs` sets the conversion matrix; `qa.py` checks the tags |
| 4 | On Pimbo's PC all text came out in a serif font | The page used the "Inter" installed on the machine; his has none | The font is embedded in the bundle under its own family name |
| 5 | A host asked for a frame before the engine existed | After embedding the font the engine is ready a moment later; only a still had been tested, not a render | Hosts wait for `window.READY`. Test the real path: a render, not a still |
| 6 | A results table showed clips that the failed run had not made | Output files of an earlier run were still there | `render.cjs` empties the frames folder before a clip |
| 7 | The camera swung left and right for no reason | Moves were added "for life" with one continuous curve | Three move kinds, each with a written reason; `setCamera` refuses anything else |
| 8 | Reframes felt soft | Their speed peaked in the middle; the reference peaks at 21-25 % | The `reframe` curve; `qa.py` measures where half of the travel is done |
| 9 | "Far objects are out of focus" was written in a report and was false | A visual impression stated as a measurement | Tag every claim: measured, seen, or guess |
| 10 | The figure's shadow could not be seen | It fell straight towards the camera, under the figure's own reflection | Shadows get a sideways direction. It is still faint: the floor is seen almost edge-on |
| 11 | A caption could not be read | It sat over bright lines of the same colour | Dark halo behind captions; keep rings and props out of the 75-83 % band |
| 12 | Figures looked stretched | The 80 degree lens stretches things near the top and bottom edges | Keep figures between 25 % and 85 % of the height |
| 13 | A background render died halfway | The process was left running while the session waited for an answer | Run long renders in the foreground, or check that they finished before reading results |
| 14 | A whole video was built on a line that was no longer true ("Epic hasn't even said how rare it is") | The fact file was a few days old; Epic had published the odds in between. It was caught by a web search made while the render was already running | Step 1b: check every fact on the day, before the voice is recorded, and write `SOURCES.md` |
| 15 | QA said "frozen" on the last frame of a reframe (`no_trick`, frame 1203) | A reframe brakes to almost nothing on its last frame, and that shot had no spotlight in view, so nothing else changed either (1.3 % of the pixels) | Give the place a move lands on something that is moving: there, a label that pops in on its word. The check stays as it is |
| 16 | A hard horizontal edge across a still, at the height of a floating object | The spotlight was aimed at the floating object: a spotlight stands where its target stands, so its cone started in mid-air | Aim a spotlight at something on the floor (a figure, a floor ring) |
| 17 | A close-up came out as an empty frame looking up | The camera aims by putting the floor point at a height in the frame; with the floor out of frame it cannot | Keep the floor under the subject in frame (about 2 m or more away) and cut the close picture out afterwards |
| 18 | Dim background chests glowed gold inside | `dim()` sets the strength of everything in an object, the light inside a chest too | Call `dim()` first and `lightChest(chest, 0)` after it |
| 19 | A slow push ended with the camera inside a chest, or behind the figure | A pose is a point the camera looks at plus a distance; the camera itself can land on top of something | Work out where the camera stands (look point + distance along the yaw) and check a still at the end of every move |

Other things to know:

- Software rendering is exactly repeatable: the same frame is identical bit for bit, alone or in parallel. On a
  graphics card it is not: two renders differ by well under one level on average. Compare with a tolerance there.
- Remotion and HyperFrames were tried as hosts for the same engine. The picture is identical. On Pimbo's PC the plain
  renderer of this kit was 31-47 % faster than either, and the only one that never failed. Results:
  `anymation/stage3d/analysis/bakeoff/RESULTADOS.md`.
