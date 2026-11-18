# Claude camping at night: toasts a marshmallow, it catches fire, panics, blows it out, eats it anyway, loves it,
# and a new one flies out of the bag onto the stick. Seamless 8 s loop (200 frames at 25 fps, square).
#   python tools/make_loop.py claude_fogata
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import bpy
from mathutils import Vector, Quaternion
import toy, runner
from toy import paper, prism, disc, lathe, box, empty, no_shadow, billboard, set_color, mix_color, noise
from anim import Track, spring, kick, looped, arc, clamp01
from chars import Claude, W, H, LH

T, FPS = 200, 25
toy.reset()
Z0 = 0.008                                    # top of the grass

# ---------------------------------------------------------------- set: a round clearing in the woods
soil = paper('soil', '#6B4A33', rough=0.9, fiber=0.05)
grass = paper('grass', '#5C8F4A', rough=0.9, fiber=0.05)
prism('soil', toy.blob(0.215, 2.2, wob=(0.05, 0.03)), -0.022, 0.022, soil)
prism('grass', toy.blob(0.205, 2.2, wob=(0.05, 0.03)), 0.0, Z0, grass)
blade = paper('blade', '#6FA65A', rough=0.85, fiber=0.0)
for i, (x, y) in enumerate([(-0.15, -0.06), (-0.12, 0.12), (0.15, -0.09), (0.10, -0.13), (-0.03, -0.15), (0.18, 0.06), (-0.17, 0.02), (0.02, 0.14)]):
    for k in range(3):
        a = 0.6 * k - 0.6
        prism(f'blade{i}_{k}', [(-0.0018, 0), (0.0018, 0), (0.0006 * math.sin(a * 3), 0.011 + 0.003 * k)], -0.0004, 0.0008, blade,
              edge=None, bw=0.0, loc=(x + 0.003 * (k - 1), y, Z0), rot=(math.radians(90), math.radians(a * 25), 0.4 * i))

# campfire: stone ring, crossed logs, three flame layers, embers, and the light it gives
F = Vector((0.040, -0.010, Z0))
stone = paper('stone', '#8E8A86', rough=0.9, fiber=0.04)
for i in range(9):
    t = 2 * math.pi * i / 9 + 0.2
    toy.pebble(f'stone{i}', (F.x + 0.031 * math.cos(t), F.y + 0.031 * math.sin(t), Z0), 0.0075 + 0.0012 * math.sin(3 * i), stone)
wood = paper('logwood', '#7A4A2B', rough=0.85, fiber=0.06)
for i, a in enumerate((10, 70, 130)):
    lg = lathe(f'log{i}', [(0, -0.023), (0.0045, -0.023), (0.0045, 0.023), (0, 0.023)], wood, segs=16, loc=(F.x, F.y, Z0 + 0.0045 + 0.002 * i))
    lg.rotation_euler = (math.radians(90), 0, math.radians(a))
flames = []
for i, (w, h, c, e) in enumerate([(0.032, 0.058, '#FF4A0A', 2.2), (0.021, 0.042, '#FF8A10', 2.6), (0.012, 0.026, '#FFC93A', 3.0)]):
    fl = prism(f'flame{i}', toy.flame_pts(w, h), 0, 0.0012, toy.flame_mat(f'flame{i}', c, e),
               edge=None, bw=0.0, loc=(F.x, F.y - 0.002 * i, Z0 + 0.004))
    no_shadow(fl)
    flames.append(fl)
fire_light = toy.point_light('fire', (F.x, F.y - 0.004, Z0 + 0.028), 2.0, '#FF8C3A', radius=0.012)
ember_m = toy.flame_mat('ember', '#FFA030', 4.0)
embers = []
for i in range(6):
    em = lathe(f'ember{i}', [(0, -1)] + [(math.sin(math.pi * k / 6), -math.cos(math.pi * k / 6)) for k in range(1, 6)] + [(0, 1)], ember_m, segs=10)
    no_shadow(em)
    embers.append(em)

# tent, pines, a bag of marshmallows
canvas = paper('tent', '#3F8A8C', rough=0.85, fiber=0.04)
door = paper('tentdoor', '#24464A', rough=0.9, fiber=0.0)
tent = empty('tent', (0.095, 0.120, Z0), (0, 0, math.radians(-24)))
prism('tent_body', [(-0.052, 0), (0.052, 0), (0, 0.068)], -0.055, 0.110, canvas, rot=(math.radians(90), 0, 0), parent=tent)
prism('tent_door', [(-0.019, 0), (0.019, 0), (0, 0.046)], 0.0552, 0.0008, door, edge=None, bw=0.0, rot=(math.radians(90), 0, 0), parent=tent)
pine = paper('pine', '#2F6A4A', rough=0.85, fiber=0.03)
bark = paper('bark', '#5A3B26', rough=0.9, fiber=0.05)
for i, (x, y, s) in enumerate([(-0.120, 0.125, 1.0), (-0.172, 0.030, 0.8), (0.175, 0.040, 0.85), (0.000, 0.172, 0.75)]):
    lathe(f'trunk{i}', [(0, 0), (0.005 * s, 0), (0.005 * s, 0.02 * s), (0, 0.02 * s)], bark, segs=12, loc=(x, y, Z0))
    for k in range(3):
        r, h0, hh = (0.034 - 0.008 * k) * s, (0.016 + 0.026 * k) * s, (0.050 - 0.006 * k) * s
        lathe(f'pine{i}_{k}', [(0, 0), (r, 0), (0, hh)], pine, segs=24, loc=(x, y, Z0 + h0))
BAG = Vector((-0.112, -0.012, Z0))
bag = empty('bag', BAG, (0, 0, math.radians(-15)))
box('bag_body', 0.026, 0.019, 0.030, paper('bagpaper', '#8CB8E0', rough=0.85, fiber=0.04), parent=bag, bw=0.0007)
box('bag_label', 0.016, 0.0006, 0.012, paper('baglabel', '#FBF6EE', rough=0.9, fiber=0.0), (0, -0.0098, 0.009), parent=bag, edge=None, bw=0.0)
marsh_m = paper('marsh', '#FBF6EE', rough=0.7, fiber=0.02, tone=0.1)
for i, (x, y) in enumerate([(-0.005, 0.002), (0.006, -0.002)]):
    lathe(f'bagmarsh{i}', [(0, 0), (0.0055, 0), (0.0055, 0.008), (0, 0.008)], paper('marsh_bag', '#FBF6EE', rough=0.7, fiber=0.02, tone=0.1),
          segs=20, loc=(x, y, 0.027)).parent = bag

# night sky: deep blue card, stars, moon
toy.backdrop('sky', paper('night', '#22386E', rough=1.0, fiber=0.0, tone=0.0, emit=0.25))
star_m = paper('star', '#FFF3C4', rough=1.0, fiber=0.0, tone=0.0, emit=4.0)
stars = []
for i in range(36):
    x = -0.55 + 1.1 * ((i * 0.618) % 1)
    z = 0.12 + 0.85 * ((i * 0.381 + 0.17) % 1)
    st = prism(f'star{i}', [(0.006 * math.cos(math.pi / 2 + math.pi * k / 4) * (1 if k % 2 == 0 else 0.35),
                            0.006 * math.sin(math.pi / 2 + math.pi * k / 4) * (1 if k % 2 == 0 else 0.35)) for k in range(8)],
               0, 0.002, star_m, edge=None, bw=0.0, loc=(x, 1.16, z), rot=(math.radians(90), 0, 0))
    no_shadow(st)
    stars.append(st)
moon = disc('moon', 0.065, 0.004, paper('moon', '#FFF0C8', rough=1.0, fiber=0.0, tone=0.0, emit=2.5), (-0.33, 1.15, 0.58), (math.radians(90), 0, 0), edge=None, bw=0.0)
no_shadow(moon)
fly_m = paper('firefly', '#D9FF7A', rough=1.0, fiber=0.0, tone=0.0, emit=7.0)
fireflies = []
for i in range(5):
    ff = lathe(f'firefly{i}', [(0, -1)] + [(math.sin(math.pi * k / 6), -math.cos(math.pi * k / 6)) for k in range(1, 6)] + [(0, 1)], fly_m, segs=10)
    no_shadow(ff)
    fireflies.append(ff)
FLY_C = [(-0.14, 0.10, 0.06), (0.13, 0.09, 0.07), (0.08, 0.17, 0.10), (-0.05, 0.16, 0.09), (0.17, -0.03, 0.05)]

# ---------------------------------------------------------------- Claude with a stick in its right hand
C0 = Vector((-0.060, 0.000, Z0))
claude = Claude('claude', C0)
BASE_YAW = 32
# the stick starts at the right arm's tip and points at a spot just above the flames (rig units)
S0 = Vector((0.012, 0, 0))                                 # in the arm pivot's frame
target = Vector((0.0548, -0.0424, 0.031)) - Vector((W / 2 + 0.012, 0, LH + 0.46 * H))
stick_root = empty('stick_root', S0, target.normalized().to_track_quat('Z', 'Y').to_euler(), parent=claude.hand(1))
lathe('stick', [(0, 0), (0.0011, 0), (0.0009, 0.052), (0, 0.052)], paper('stickwood', '#B08354', rough=0.8, fiber=0.03), segs=10).parent = stick_root
marsh = lathe('marsh', [(0, -0.0045), (0.0052, -0.0045), (0.0057, -0.0035), (0.0057, 0.0035), (0.0052, 0.0045), (0, 0.0045)], marsh_m, segs=24)
marsh.parent = stick_root
marsh.location = (0, 0, 0.046)
burn = prism('burn', toy.flame_pts(0.011, 0.024), 0, 0.0010, toy.flame_mat('burnflame', '#FF6A12', 2.6), edge=None, bw=0.0)
no_shadow(burn)
flyer = lathe('flyer', [(0, -0.006), (0.0075, -0.006), (0.008, 0), (0.0075, 0.006), (0, 0.006)], paper('marsh_fly', '#FBF6EE', rough=0.7, fiber=0.02, tone=0.1), segs=24)
puff_m = toy.flame_mat('breath', '#F4F6FF', 2.6)
puffs = [disc(f'puff{k}', 1.0, 0.05, puff_m, edge=None, bw=0.0) for k in range(3)]
smoke_m = paper('smoke', '#8F8F9C', rough=1.0, fiber=0.0, tone=0.0)
smokes = [disc(f'smoke{k}', 1.0, 0.05, smoke_m, edge=None, bw=0.0) for k in range(4)]
heart = prism('heart', toy.heart_pts(0.020), 0, 0.0025, paper('heart', '#F2627E', rough=0.8, fiber=0.0, tone=0.0, emit=0.4), bw=0.0005)
for o in puffs + smokes + [heart, flyer]:
    no_shadow(o)

# ---------------------------------------------------------------- light, camera
toy.world('#1A2A55', 1.1)
TGT = Vector((-0.008, 0.000, Z0 + 0.036))
toy.area_light('moon', (-0.50, 0.60, 0.70), TGT, 0.80, 30.0, '#8FAEFF')
toy.area_light('fill', (-0.30, -0.60, 0.30), TGT, 0.90, 9.0, '#7C93D6')
cam = toy.camera(TGT, 0.62, 21, -6, 65, 4.5)
cam.data.dof.focus_distance = (C0 + Vector((0.02, 0, 0.05)) - cam.location).length
CAM = cam.location.copy()

# ---------------------------------------------------------------- dope sheet (25 fps, T = 200)
# 0-43    toasting: the stick turns slowly over the fire, Claude breathes, eyes on the marshmallow
# 44      the marshmallow catches fire: eyes pop, body stretches, the stick yanks up (surprise)
# 50-63   panic: shakes the stick up and down, free arm flapping; the flame trails
# 64-72   anticipation: inhales, stretches tall, leans back, eyes squeezed (> <)
# 72-80   BLOW: squashes forward, three breath puffs; the flame dies at 75, smoke rises; the campfire leans away
# 81-111  looks at the charred marshmallow, brings it closer, tilts its head: '. .' hmm
# 112-130 shrug, leans back (anticipation), CHOMP at 116 (it vanishes), chews in little bounces, ^ ^
# 130-150 happy wiggle, a heart pops above its head
# 150-168 turns to the bag, taps it (the bag squashes), a new marshmallow flies on an arc onto the stick (168)
# 168-200 ^ ^ got it, turns back to the fire with overshoot, settles into the frame-0 pose
EAT, POP, HIT_BAG, CATCH = 116, 44, 158, 168
YAW = Track((0, BASE_YAW, 'lin'), (44, BASE_YAW, 'lin'), (47, BASE_YAW - 5, 'outback'), (64, BASE_YAW - 5, 'lin'),
            (72, BASE_YAW, 'inout'), (150, BASE_YAW, 'lin'), (156, -8, 'inoutback'), (170, -8, 'lin'),
            (180, BASE_YAW + 5, 'inout'), (188, BASE_YAW, 'inout2'), (200, BASE_YAW, 'lin'))
S = Track((0, 1, 'lin'), (43, 1, 'lin'), (46, 1.14, 'out2'), (51, 0.97, 'inout2'), (55, 1.0, 'inout2'),
          (64, 1.0, 'lin'), (72, 1.16, 'inout'), (75, 0.84, 'out2'), (80, 0.87, 'lin'), (88, 1.0, 'outback'),
          (110, 1.0, 'lin'), (113, 0.94, 'inout'), (EAT, 0.86, 'out2'), (120, 1.0, 'inout2'),
          (150, 1.0, 'lin'), (155, 0.92, 'inout'), (HIT_BAG, 1.06, 'out2'), (163, 1.0, 'inout2'),
          (CATCH, 1.0, 'lin'), (170, 1.10, 'out2'), (175, 1.0, 'inout2'), (200, 1.0, 'lin'))
PITCH = Track((0, 0, 'lin'), (64, 0, 'lin'), (72, -8, 'inout'), (75, 12, 'out2'), (80, 10, 'lin'), (88, 0, 'inout2'),
              (110, 0, 'lin'), (113, -6, 'inout'), (EAT, 8, 'out2'), (122, 0, 'inout2'),
              (152, 0, 'lin'), (156, 6, 'inout'), (HIT_BAG, 9, 'out2'), (164, 0, 'inout2'), (200, 0, 'lin'))
ROLL = Track((0, 0, 'lin'), (96, 0, 'lin'), (100, -11, 'outback'), (108, -11, 'lin'), (112, 0, 'inout'),
             (130, 0, 'lin'), (134, 8, 'inout'), (138, -8, 'inout'), (142, 8, 'inout'), (146, -8, 'inout'), (150, 0, 'inout'),
             (200, 0, 'lin'))
ARM_R = Track((0, 0, 'lin'), (43, 0, 'lin'), (47, 42, 'outback'), (50, 14, 'inout'), (53, 46, 'inout'), (56, 14, 'inout'),
              (59, 42, 'inout'), (62, 18, 'inout'), (66, 26, 'inout'), (90, 26, 'lin'), (97, 38, 'inout'),
              (110, 38, 'lin'), (113, 30, 'inout'), (EAT, 52, 'out2'), (124, 18, 'inout2'), (132, 4, 'inout2'),
              (150, 4, 'lin'), (156, 10, 'inout'), (CATCH, 10, 'lin'), (172, 24, 'out2'), (182, -4, 'inout'),
              (188, 0, 'inout2'), (200, 0, 'lin'))
ARM_L = Track((0, 0, 'lin'), (44, 0, 'lin'), (46, 42, 'out2'), (50, -8, 'inout'), (53, 36, 'inout'), (56, -8, 'inout'),
              (59, 34, 'inout'), (63, 0, 'inout'), (70, -20, 'inout'), (80, -20, 'lin'), (88, 0, 'inout2'),
              (113, 0, 'lin'), (EAT, 34, 'out2'), (122, 0, 'inout2'),
              (130, 0, 'lin'), (134, 28, 'inout'), (138, -6, 'inout'), (142, 28, 'inout'), (146, -6, 'inout'), (150, 0, 'inout'),
              (154, 0, 'lin'), (HIT_BAG - 1, -38, 'in2'), (HIT_BAG + 3, 16, 'out2'), (166, 0, 'inout2'),
              (CATCH, 0, 'lin'), (171, 30, 'out2'), (176, 0, 'inout2'), (200, 0, 'lin'))
EYE_BIG = Track((0, 1.0, 'lin'), (POP - 1, 1.0, 'lin'), (POP, 1.45, 'step'), (62, 1.0, 'inout2'),
                (HIT_BAG, 1.0, 'lin'), (HIT_BAG + 1, 1.25, 'step'), (CATCH - 1, 1.15, 'lin'), (CATCH, 1.0, 'step'), (200, 1.0, 'lin'))
LOOK = Track((0, 0.8, 'lin'), (64, 0.8, 'lin'), (70, 0.3, 'inout'), (96, 0.3, 'lin'), (100, 0.6, 'inout'),
             (150, 0.6, 'lin'), (156, -0.7, 'inout'), (HIT_BAG, -0.9, 'lin'), (CATCH, 0.9, 'inout'), (176, 0.8, 'inout'), (200, 0.8, 'lin'))


def eye_kind(f):
    if 66 <= f <= 80:
        return 'squeeze'               # inhale and blow
    if 96 <= f <= 111:
        return 'dot'                   # hmm, it's burnt
    if EAT <= f <= 148 or CATCH + 1 <= f <= 175:
        return 'happy'
    if 190 <= f <= 191:
        return 'line'                  # blink
    return 'sq'


TOAST = ['#FBF6EE', '#F2C27A', '#4A2A1A']


def marsh_color(f):
    if f < POP:
        return mix_color(TOAST[0], TOAST[1], f / POP)
    if f < 75:
        return mix_color(TOAST[1], TOAST[2], (f - POP) / (75 - POP))
    if f < CATCH:
        return toy.hexc(TOAST[2])
    return toy.hexc(TOAST[0])


def pose(f):
    # ---- the campfire flickers (and leans away when Claude blows)
    blow_push = kick(looped(f, 74, T), 12, 6)
    for i, fl in enumerate(flames):
        n1, n2, n3 = noise(f, T, 3 * i + 1), noise(f, T, 3 * i + 2), noise(f, T, 3 * i + 3)
        fl.scale = (1 + 0.07 * n1, 1, 1 + 0.15 * n2)
        billboard(fl, CAM, lean_deg=4 * n3 - 14 * blow_push)
    fire_light.data.energy = 2.0 * (1 + 0.16 * noise(f, T, 11)) * (1 - 0.25 * max(0.0, blow_push))
    for i, em in enumerate(embers):
        k = 5 + i
        p = (k * f / T + 0.17 * i) % 1.0
        em.location = F + Vector((0.010 * math.sin(2 * math.pi * (1.5 * p + 0.3 * i)), 0.006 * math.cos(2 * math.pi * p + i), 0.012 + 0.10 * p))
        r = 0.0013 * (1 - p) * clamp01(p * 20)
        em.scale = (r, r, r)
    for i, st in enumerate(stars):
        tw = 1 + 0.45 * math.sin(2 * math.pi * (3 + i % 5) * f / T + i)
        st.scale = (tw, tw, 1)
    for i, ff in enumerate(fireflies):
        c = Vector(FLY_C[i])
        ff.location = c + Vector((0.03 * math.sin(2 * math.pi * (1 + i % 2) * f / T + i),
                                  0.02 * math.sin(2 * math.pi * (2 + i % 3) * f / T + 2 * i),
                                  0.015 * math.sin(2 * math.pi * 3 * f / T + 0.5 * i)))
        r = 0.0016 * max(0.0, math.sin(2 * math.pi * (4 + i) * f / T + i)) ** 0.5
        ff.scale = (r, r, r)
    # the bag squashes when Claude taps it
    bs = 1 - 0.22 * spring(looped(f, HIT_BAG, T), 7, 4) if looped(f, HIT_BAG, T) < 40 else 1.0
    bag.scale = (1 / math.sqrt(bs), 1 / math.sqrt(bs), bs)

    # ---- Claude
    s = S(f) * (1 + 0.012 * math.sin(2 * math.pi * 4 * f / T))
    chew = looped(f, EAT + 2, T)
    if chew < 14:
        s -= 0.05 * abs(math.sin(math.pi * chew / 4.5)) * (1 - chew / 14)     # three little chewing bounces
    toast_turn = 3 * math.sin(2 * math.pi * 5 * f / T) * (1 - clamp01((f - 40) / 4)) if f < 44 else 0.0
    claude.pose(s=s, pitch=PITCH(f), roll=ROLL(f), yaw=YAW(f), arm_l=ARM_L(f), arm_r=ARM_R(f) + toast_turn,
                eyes=eye_kind(f), eye_big=EYE_BIG(f), eye_look=LOOK(f))
    # ---- the marshmallow on the stick
    set_color(marsh_m, marsh_color(f))
    if EAT <= f < CATCH:
        marsh.scale = (0.001, 0.001, 0.001)
    elif f >= CATCH:
        pop = Track((CATCH, 0.4, 'lin'), (CATCH + 6, 1.0, 'outback'))(f)
        marsh.scale = (pop, pop, pop)
    else:
        marsh.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    mpos = marsh.matrix_world.translation.copy()
    face = claude.face.matrix_world.translation.copy()
    # the flame on the marshmallow: pops at 44, flickers, trails behind the stick's motion, dies at 75
    b = Track((POP - 1, 0.0, 'lin'), (POP + 3, 1.0, 'outback'), (72, 1.0, 'lin'), (74, 1.3, 'out2'), (76, 0.0, 'in2'))(f)
    b *= 1 + 0.15 * noise(f, T, 21)
    burn.scale = (max(b, 0.001),) * 3
    burn.location = mpos + Vector((0, 0, 0.003))
    trail = -1.4 * (ARM_R(f) - ARM_R(f - 2))
    billboard(burn, CAM, lean_deg=max(-35, min(35, trail)) + 5 * noise(f, T, 22))
    # breath puffs from the face to the marshmallow
    for k, pf in enumerate(puffs):
        u = (f - 72 - 2 * k) / 7
        if 0 <= u <= 1:
            pf.location = face.lerp(mpos, 0.45 + 0.75 * u)   # from the edge of the face, past the marshmallow
            r = 0.0085 * math.sin(math.pi * u) ** 0.7
            pf.scale = (r, r, 0.02)
            billboard(pf, CAM)
        else:
            pf.scale = (0.0001,) * 3
    # smoke from the charred marshmallow
    for k, sm in enumerate(smokes):
        u = (f - 76 - 5 * k) / 26
        if 0 <= u <= 1:
            sm.location = mpos + Vector((0.004 * math.sin(6 * u + k), 0.002 * k, 0.006 + 0.035 * u))
            r = (0.003 + 0.007 * u) * math.sin(math.pi * u) ** 0.5
            sm.scale = (r, r, 0.02)
            billboard(sm, CAM)
        else:
            sm.scale = (0.0001,) * 3
    # the heart above the head
    u = (f - 128) / 24
    if 0 <= u <= 1:
        top = claude.torso.matrix_world @ Vector((0, 0, H))
        heart.location = top + Vector((0.004, 0, 0.014 + 0.025 * u))
        sc = Track((0, 0.0, 'lin'), (0.25, 1.15, 'outback'), (0.4, 1.0, 'inout2'), (0.8, 1.0, 'lin'), (1.0, 0.0, 'in2'))(u)
        heart.scale = (max(sc, 0.001),) * 3
        billboard(heart, CAM, lean_deg=8 * math.sin(2 * math.pi * u * 2))
    else:
        heart.scale = (0.0001,) * 3
    # the new marshmallow flies from the bag onto the stick
    u = (f - HIT_BAG) / (CATCH - HIT_BAG)
    if 0 <= u < 1:
        src = BAG + Vector((0, 0, 0.034))
        flyer.location = src.lerp(mpos, u) + Vector((0, 0, arc(u, 0.06)))
        flyer.rotation_euler = (3.5 * u * math.pi, 0.5, 2.0 * u)
        flyer.scale = (1, 1, 1)
    else:
        flyer.scale = (0.0001,) * 3


runner.run(pose, T=T, fps=FPS, size=(1080, 1080), exposure=-0.35)   # night: brighter than the day default

