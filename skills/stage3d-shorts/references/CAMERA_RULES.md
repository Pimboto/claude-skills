# Camera rules

How the camera is edited in this look. Source: the frame-by-frame study of reference video 1 (61.5 s, 1846 frames)
and our own clips. Tags: **[M]** measured on every frame, **[S]** seen on frame strips, **[O]** our own choice.

## The idea

The stage is the argument laid out in space, in the order it is told. The camera is the viewer's eye walking along
it. It never moves "for life". It moves to get to the next thing the voice is about to talk about, then it stops and
lets that thing animate. **[S]**

## Rules

1. **Few moves.** A shot has one move, sometimes two or three. Never a swing from side to side. **[S]**
2. **Move, then hold.** Before and after a move the image speed is 0-1 px per frame at 720p. **[M]**
3. **Moves sit between sentences.** A reframe starts on the last words of the outgoing sentence and has landed before
   the new element appears (reference: move ends at 84, bars appear at 84-90; move ends at 182, title at 186). **[M]**
4. **While the graphic animates, the camera holds.** Bars growing, labels appearing, counters running. **[S]**
5. **A slow push across a whole shot** is the default for an explanation: +12 % to +28 % in size over the shot. **[M]**
6. **A list or a flow gets a travel**, each item hit on its word. **[S]** (not built in the kit yet)
7. **Widening the claim gets a pull-back** ("everything", "everyone else"). **[S]** (not built in the kit yet)
8. **A long line about one object gets one slow orbit.** **[M]**
9. **Whip-pans only between ideas**: 11 in 61 s in the reference. 16 frames each, the frame darkens to 0.53 in the
   middle. **[M]**
10. **Nothing is linear.** See the curves below. **[M]**

## The three kinds of move

| Kind | Use | Length | Curve | Measured on the reference | Ours |
|---|---|---|---|---|---|
| `hook` | Opening push-in, from frame 0, lands on the first words | up to 24 frames | fastest at its first frame (`1-(1-t)^2`) | half of the travel at 28 % | 24 % |
| `reframe` | Between two sentences | 20-28 frames | starts hard, brakes long (`1-(1-t^1.5)^3.7`) | fastest at 21-25 %, half of the travel at 30-32 %, peak 9.5-9.8 px/frame | fastest at 14-19 %, half at 27-31 %, peak 8.7 |
| `slow` | Push or orbit across a whole shot | 40 frames or more | ease-in-out sine | fits a sine with rms 0.017 | same curve |

Speeds are the median image speed of the bright pixels, px per frame at 720p, caption band masked (`scripts/qa.py`).
The kit refuses any other kind, a reframe outside 16-32 frames, a hook that is not the first move, and a slow move
shorter than 40 frames.

Between moves the kit adds a creep: the distance shrinks 0.045 % per frame, with a hair of sideways drift. **[M: the
reference creeps 0.03-0.05 % per frame]**

## A pose

`POSE(cx, cz, yaw, dist, h, feetY)`: the floor point the camera looks after, the angle around it in degrees
(negative = from the left), the distance and height in metres, and where that floor point sits in the frame
(0 = top, 1 = bottom).

| | Values used so far **[O]** |
|---|---|
| Lens | 80 degrees vertical (the reference's lens is not measured) |
| Distance | 4.4 to 6.1 m; wide start of a shot up to 7.4 m |
| Height | 1.1 m (low, dramatic, for the hook) to 1.5 m |
| feetY | 0.66 to 0.72 normally; 0.82 for the hook close-up |
| Yaw | 4-8 degrees for "frontal"; 28-40 for a 3/4 view; an orbit of about 35 degrees over a shot |

What a 3/4 view gives **[M]**: at yaw -40 and 4.4 m a card's near edge is 1.33-1.38 times its far edge (reference
1.44) and the dashed floor line tilts 14-17 degrees on screen (reference 11-16).

## Framing checks on stills

- Nothing important cut by the frame edge. A figure is either fully in or clearly out.
- Captions sit at 78.9 % of the height: keep rings and the front edge of props out of the 75-83 % band.
- The 80 degree lens stretches things near the top and bottom edges: keep figures between 25 % and 85 % of the height.
- Things at different depths must slide against each other during a move: put something behind the subject.

## What went wrong before

- Clip v1: a flat camera. It read as 2D.
- Clip v2: four big swings in 9.7 s, none tied to a word, constant speed. It read as wandering.
- Clip v3-v4: symmetric reframes (fastest in the middle). Correct structure, soft feel.
- Clip v5: the rules above. Approved.
