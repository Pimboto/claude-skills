# Claude on a paper island waves at a paper boat: a seamless 8 s loop (200 frames at 25 fps, square).
# The approved example (Pimbo, 2026-11-18: "esta épica"). Read it before writing a new loop.
#   python tools/make_loop.py claude_isla
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
from mathutils import Vector
import toy, runner
from toy import paper, prism, disc, ring, empty
from anim import Track, spring, kick, looped, arc, clamp01
from chars import Claude

T, FPS = 200, 25
toy.reset()

# ---------------------------------------------------------------- set: the paper island
sea = paper('sea', '#2B9FA3', rough=0.6, fiber=0.02)
foam = paper('foam', '#86D3CB', rough=0.7, fiber=0.0, tone=0.0)
foam2 = paper('foam2', '#5FBFB8', rough=0.7, fiber=0.0, tone=0.0)
disc('sea', 0.80, 0.004, sea, (0, 0.38, -0.004), edge=None, bw=0.0)
sand = paper('sand', '#F1D6A2', rough=0.9, fiber=0.05)
sand2 = paper('sand_dark', '#E2BE84', rough=0.9, fiber=0.05)
grass = paper('grass', '#7CC26A', rough=0.85, fiber=0.04)
prism('isle0', toy.blob(0.150, 1.0), 0.0, 0.010, sand2)
prism('isle1', toy.blob(0.128, 1.7), 0.010, 0.008, sand)
prism('isle2', [(x + 0.040, y + 0.050) for x, y in toy.blob(0.055, 4.0)], 0.018, 0.006, grass)
palm_root, crown = toy.palm('palm', (0.062, 0.066, 0.024), h=0.14, lean=-10)
peb = paper('pebble', '#CFC3B0', rough=0.9)
for i, (x, y, s) in enumerate([(-0.085, 0.02, 0.008), (-0.072, 0.045, 0.006), (0.092, -0.042, 0.007), (0.05, -0.085, 0.005)]):
    toy.pebble(f'pebble{i}', (x, y, 0.018), s, peb)
star_m = paper('starfish', '#F29A6B', rough=0.85, fiber=0.03)
star = [((0.0085 if i % 2 == 0 else 0.0035) * math.cos(math.pi / 2 + math.pi * i / 5),
         (0.0085 if i % 2 == 0 else 0.0035) * math.sin(math.pi / 2 + math.pi * i / 5)) for i in range(10)]
prism('starfish', star, 0, 0.0025, star_m, bw=0.0005, loc=(-0.060, -0.075, 0.018), rot=(0, 0, 0.4))
toy.backdrop('sky', paper('sky', '#F7C9A3', rough=1.0, fiber=0.0, tone=0.0))
cloud = paper('cloud', '#FFF4E6', rough=1.0, fiber=0.0, tone=0.0)
for i, (x, z, s) in enumerate([(-0.45, 0.30, 1.0), (-0.05, 0.42, 0.8), (0.50, 0.26, 1.2)]):
    for j, (dx, dz, r) in enumerate([(0, 0, 0.07), (0.07, 0.025, 0.055), (-0.07, 0.01, 0.05), (0.13, -0.01, 0.04)]):
        disc(f'cloud{i}_{j}', r * s, 0.01, cloud, (x + dx * s, 1.18, z + dz * s), (math.radians(90), 0, 0), edge=None, bw=0.0)

# ---------------------------------------------------------------- Claude
H0 = Vector((-0.018, -0.030, 0.018))          # home spot
J = Vector((-0.030, -0.058, 0.018))           # front of the beach, closer to the boat
claude = Claude('claude', H0)

# ---------------------------------------------------------------- paper boat, wake, ripples
boat = empty('boat')
boat.scale = (1.3, 1.3, 1.3)
bp = paper('boat_paper', '#F6EFE0', rough=0.9, fiber=0.05)
Lt, Lb, Hh, Wd = 0.058, 0.030, 0.013, 0.019
hull = [(-Lb / 2, 0), (Lb / 2, 0), (Lt / 2, Hh), (Lt / 2 - 0.004, Hh), (0.010, Hh * 0.55), (-0.010, Hh * 0.55), (-Lt / 2 + 0.004, Hh), (-Lt / 2, Hh)]
prism('hull', hull, -Wd / 2, Wd, bp, bw=0.0006, loc=(0, 0, -0.004), rot=(math.radians(90), 0, 0), parent=boat)
prism('sail', [(-0.017, Hh * 0.5), (0.017, Hh * 0.5), (0, Hh + 0.026)], -0.0007, 0.0014, bp, bw=0.0004, loc=(0, 0, -0.004), rot=(math.radians(90), 0, 0), parent=boat)
prism('flag', [(0, 0), (0.010, -0.0035), (0, -0.007)], -0.0004, 0.0008, paper('flag', '#2E6FD8', rough=0.8, fiber=0.0), edge=None, bw=0.0, loc=(0, 0, Hh + 0.0215), rot=(math.radians(90), 0, 0), parent=boat)
BOAT_C, BRX, BRY = Vector((0.0, 0.010, 0.0)), 0.235, 0.205
F_FRONT = 100                     # the boat passes right in front of Claude
TH0 = -math.pi / 2 - 2 * math.pi * F_FRONT / T
ripples = [ring(f'ripple{k}', 0.990, 1.0, 1.0, foam) for k in range(3)]
wakes = [ring(f'wake{k}', 0.95, 1.0, 1.0, foam2) for k in range(2)]


def boat_at(f):
    th = TH0 + 2 * math.pi * f / T
    p = BOAT_C + Vector((BRX * math.cos(th), BRY * math.sin(th), 0))
    return th, p, math.atan2(BRY * math.cos(th), -BRX * math.sin(th))


# ---------------------------------------------------------------- light, camera
toy.world('#E9D2BC', 0.22)
TGT = (-0.008, -0.020, 0.040)
toy.area_light('key', (-0.40, -0.45, 0.80), TGT, 0.35, 52.0, '#FFD9A8')
toy.area_light('fill', (0.60, -0.55, 0.30), TGT, 0.90, 3.0, '#BFD9FF')
toy.area_light('rim', (0.30, 0.65, 0.35), TGT, 0.30, 14.0, '#FFC890')
CAM_AZ = -16
cam = toy.camera(TGT, 0.66, 29, CAM_AZ, 70, 7.0)
cam.data.dof.focus_distance = (H0 + Vector((0, 0, 0.045)) - cam.location).length

# ---------------------------------------------------------------- dope sheet (25 fps, T = 200)
# 0-40    idle, breathing; looks left, blinks, looks right
# 44      notices the boat on the left: eyes pop big, body stretches, arms flap (surprise)
# 56-63   anticipation: squashes down, leans back, arms back
# 66-77   jumps to the front of the beach on an arc; stretch going up and coming down; lands squashed, springs back
# 78-127  happy eyes; waves with the right arm (it faces the camera) while the boat passes (front at 100)
# 124-150 follows the boat with its head (overshoot); the boat leaves behind the island
# 150-165 aww: flat eyes, deflates
# 163-181 anticipation, hops back home, lands, settles; the palm shakes on each landing
# 181-200 settles into the frame-0 pose
LAND1, LAND2 = 77, 181
YAW = Track((0, 0, 'lin'), (8, 0, 'lin'), (16, -24, 'outback'), (26, -24, 'lin'), (35, 12, 'inout'), (41, 12, 'lin'),
            (47, -22, 'outback'), (60, -22, 'lin'), (72, -8, 'inout'), (86, -14, 'inout'), (124, 14, 'inout2'),
            (140, 26, 'outback'), (152, 26, 'lin'), (161, 0, 'inout'), (200, 0, 'lin'))
S = Track((0, 1, 'lin'), (43, 1, 'lin'), (46, 1.13, 'out2'), (51, 0.96, 'inout2'), (56, 1.0, 'inout2'),
          (63, 0.80, 'inout'), (66, 1.20, 'out2'), (71, 1.0, 'inout2'), (76, 1.12, 'in2'), (77, 1.0, 'lin'),
          (150, 1.0, 'lin'), (160, 0.93, 'inout'), (163, 0.93, 'lin'), (167, 0.82, 'inout'), (170, 1.15, 'out2'),
          (175, 1.0, 'inout2'), (180, 1.08, 'in2'), (181, 1.0, 'lin'), (200, 1.0, 'lin'))
PITCH = Track((0, 0, 'lin'), (58, 0, 'lin'), (63, -6, 'inout'), (67, 10, 'out2'), (77, -4, 'inout2'), (84, 0, 'inout2'),
              (163, 0, 'lin'), (167, 5, 'inout'), (171, -9, 'out2'), (181, 3, 'inout2'), (188, 0, 'inout2'), (200, 0, 'lin'))
ARMS = Track((0, 0, 'lin'), (43, 0, 'lin'), (46, 38, 'out2'), (53, -6, 'inout2'), (58, 0, 'inout2'),
             (63, -18, 'inout'), (67, 12, 'out2'), (73, 55, 'inout2'), (77, 62, 'lin'), (80, -14, 'in2'),
             (84, 6, 'inout2'), (88, 0, 'inout2'),
             (164, 0, 'lin'), (167, -15, 'inout'), (171, 10, 'out2'), (177, 50, 'inout2'), (181, 56, 'lin'),
             (184, -12, 'in2'), (188, 5, 'inout2'), (192, 0, 'inout2'), (200, 0, 'lin'))
WAVE = Track((0, 0, 'lin'), (86, 0, 'lin'), (91, 62, 'outback'),
             (94, 22, 'inout'), (97, 62, 'inout'), (100, 22, 'inout'), (103, 62, 'inout'), (106, 22, 'inout'),
             (109, 62, 'inout'), (112, 22, 'inout'), (115, 62, 'inout'), (118, 22, 'inout'), (121, 62, 'inout'),
             (128, -12, 'in2'), (133, 4, 'out2'), (137, 0, 'inout2'), (200, 0, 'lin'))
EYE_BIG = Track((0, 1.0, 'lin'), (43, 1.0, 'lin'), (44, 1.42, 'step'), (60, 1.0, 'inout2'), (200, 1.0, 'lin'))


def place(f):
    """Where Claude stands (world) and how high the jump is (rig units) at frame f."""
    if 66 <= f <= LAND1:
        u = (f - 66) / (LAND1 - 66)
        return H0.lerp(J, u), arc(u, 0.035)
    if LAND1 < f < 170:
        return J, 0.0
    if 170 <= f <= LAND2:
        u = (f - 170) / (LAND2 - 170)
        return J.lerp(H0, u), arc(u, 0.026)
    return H0, 0.0


def eye_kind(f):
    if 22 <= f <= 23 or 192 <= f <= 193:
        return 'line'                  # blinks
    if 78 <= f <= 127:
        return 'happy'
    if 150 <= f <= 165:
        return 'line'                  # the boat is gone: aww
    return 'sq'


def pose(f):
    th, bpos, byaw = boat_at(f)
    boat.location = bpos + Vector((0, 0, 0.0015 * math.sin(2 * math.pi * 8 * f / T)))
    boat.rotation_euler = (math.radians(5) * math.sin(2 * math.pi * 8 * f / T + 1.0),
                           math.radians(3) * math.sin(2 * math.pi * 4 * f / T), byaw)
    # wake: a small ring dropped behind the boat every 20 frames, living 40 frames
    for k in range(2):
        best = None
        for j in range(k, T // 20, 2):
            age = (f - 20 * j) % T
            if age < 40:
                best = (j, age)
        if best is None:
            wakes[k].scale = (0.001, 0.001, 0.001)
            continue
        j, age = best
        _, p0, _ = boat_at(20 * j)
        u = age / 40
        wakes[k].location = (p0.x, p0.y, 0.0)
        r = 0.012 + 0.030 * u
        wakes[k].scale = (r, r, 0.0007 * math.sin(math.pi * u) + 1e-5)
    for k, rg in enumerate(ripples):
        u = ((f + T * k / 3) % T) / T
        r = 0.158 + 0.15 * u
        rg.scale = (r, r, 0.0009 * math.sin(math.pi * u) + 1e-5)
    # palm: slow sway, plus a shake each time Claude lands (secondary action)
    shake = kick(looped(f, LAND1, T), 10, 7) + 0.8 * kick(looped(f, LAND2, T), 10, 7)
    crown.rotation_euler = (math.radians(3) * math.sin(2 * math.pi * 2 * f / T) + math.radians(5) * shake,
                            math.radians(2) * math.sin(2 * math.pi * 2 * f / T + 1.3) - math.radians(3) * shake, 0)
    # Claude
    where, hop = place(f)
    wave = WAVE(f)
    s = S(f)
    s -= 0.26 * spring(looped(f, LAND1, T), 8, 4) + 0.22 * spring(looped(f, LAND2, T), 8, 4)
    s += 0.022 * (WAVE(f - 1) - 42) / 20 * clamp01((f - 88) / 4) * clamp01((124 - f) / 4)
    s *= 1 + 0.012 * math.sin(2 * math.pi * 4 * f / T)
    roll = 0.08 * (WAVE(f - 2) - 22) if 86 <= f <= 137 else 0.0
    claude.pose(s=s, hop=hop, pitch=PITCH(f), roll=roll, yaw=CAM_AZ + YAW(f),
                arm_l=ARMS(f - 1), arm_r=ARMS(f) + wave,
                eyes=eye_kind(f), eye_big=EYE_BIG(f), eye_look=YAW(f + 3) / 25, loc=where)


runner.run(pose, T=T, fps=FPS, size=(1080, 1080))
