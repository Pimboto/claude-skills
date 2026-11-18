# Hero picture for a web page: Claude the film director, standing on its (too big) director's chair with a beret
# and a megaphone pointing left, towards where the page headline goes. Wide 2:1, subject on the right third.
#   python tools/make_loop.py director_hero --engine cycles --samples 256
#   (add --scale 0.5 --frames 0 for a quick look; tools/duotone.py makes the blue version)
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import bpy
from mathutils import Vector
import toy, runner
from toy import paper, prism, disc, lathe, box, empty, ring, no_shadow, billboard
from chars import Claude, W, H

toy.reset()
toy.world('#10152A', 0.45)

# ---------------------------------------------------------------- floor and backdrop
disc('floor', 1.0, 0.004, paper('floor', '#2B2838', rough=0.8, fiber=0.02), (0, 0.3, -0.004), edge=None, bw=0.0)
toy.backdrop('backdrop', paper('backdrop', '#151D3A', rough=1.0, fiber=0.0, tone=0.0), radius=1.1, y=0.0, arc_deg=200)
# a background light paints a soft blue pool on the backdrop behind Claude (fades to dark towards the text side)
toy.area_light('bg_light', (0.12, 0.45, 0.02), (0.14, 1.08, 0.22), 0.35, 22.0, '#4A63C9')
bulb = toy.flame_mat('marquee', '#FFC870', 5.0)
for i in range(9):
    b = lathe(f'bulb{i}', [(0, -0.008)] + [(0.008 * math.sin(math.pi * k / 8), -0.008 * math.cos(math.pi * k / 8)) for k in range(1, 8)] + [(0, 0.008)],
              bulb, segs=14, loc=(0.18 + 0.075 * i, 0.95 - 0.02 * i, 0.30 + 0.035 * math.sin(i * 0.9)))
    no_shadow(b)

# ---------------------------------------------------------------- the director's chair (wood frame, red canvas)
wood = paper('chairwood', '#C8955A', rough=0.7, fiber=0.04)
canvas = paper('canvas', '#B8323A', rough=0.85, fiber=0.05)
chair = empty('chair', (0, 0, 0), (0, 0, math.radians(-8)))
SEAT, SW, SD = 0.068, 0.118, 0.082
for sx in (-1, 1):
    x = sx * (SW / 2 + 0.004)
    for sy in (-1, 1):   # crossed legs on each side: bars centred at mid height, tilted +-31 degrees
        th, L = math.radians(31 * sy), 0.082
        box(f'xleg{sx}{sy}', 0.006, 0.006, L, wood, (x, math.sin(th) * L / 2, SEAT / 2 - math.cos(th) * L / 2), (th, 0, 0), parent=chair, bw=0.0006)
    box(f'post_f{sx}', 0.006, 0.006, 0.034, wood, (x, -SD / 2 + 0.004, SEAT - 0.004), parent=chair, bw=0.0006)
    box(f'post_b{sx}', 0.006, 0.006, 0.110, wood, (x, SD / 2 - 0.004, SEAT - 0.004), parent=chair, bw=0.0006)
    box(f'armrest{sx}', 0.010, SD + 0.010, 0.006, wood, (x, 0, SEAT + 0.028), parent=chair, bw=0.0008)
box('seat', SW, SD, 0.004, canvas, (0, 0, SEAT), parent=chair, bw=0.0008)
box('back', SW + 0.004, 0.004, 0.036, canvas, (0, SD / 2 - 0.004, SEAT + 0.064), parent=chair, bw=0.0008)

# ---------------------------------------------------------------- Claude on the seat
claude = Claude('claude', (0.0, -0.006, SEAT + 0.004))
mega_root = empty('mega_root', (-0.017, 0, 0.001), Vector((-1.0, -0.50, -0.25)).normalized().to_track_quat('Z', 'Y').to_euler(),
                  parent=claude.hand(-1))
yellow = paper('megaphone', '#F2C14E', rough=0.55, fiber=0.0, spec=0.5)
lathe('mega', [(0, 0), (0.0045, 0), (0.0050, 0.012), (0.0175, 0.043), (0.0182, 0.046), (0.0150, 0.046), (0.0040, 0.004), (0, 0.004)],
      yellow, segs=40).parent = mega_root
lathe('mega_band', [(0.0116, 0.0300), (0.0130, 0.0300), (0.0143, 0.0350), (0.0129, 0.0350)], paper('megaband', '#D9544A', rough=0.6, fiber=0.0),
      segs=40).parent = mega_root
lathe('mega_grip', [(0, -0.012), (0.0035, -0.012), (0.0035, 0.002), (0, 0.002)], paper('grip', '#2A2B30', rough=0.5, fiber=0.0), segs=16).parent = mega_root
beret = empty('beret', (0.004, 0.002, H), (math.radians(-6), math.radians(15), 0), parent=claude.torso)
lathe('beret_cap', [(0, 0), (0.024, 0.0005), (0.0275, 0.0035), (0.0262, 0.0080), (0.018, 0.0118), (0, 0.0128)],
      paper('beret', '#2A2233', rough=0.9, fiber=0.05), segs=40).parent = beret
lathe('beret_stem', [(0, 0.012), (0.0016, 0.012), (0.0012, 0.0175), (0, 0.0178)], paper('beret_s', '#2A2233', rough=0.9, fiber=0.0),
      segs=12).parent = beret
claude.pose(s=1.0, yaw=-12, pitch=-3, roll=-4, arm_l=38, arm_r=-8, eyes='happy', eye_look=-0.6)

# sound lines out of the megaphone (three arcs)
arc_m = toy.flame_mat('soundlines', '#FFF4DA', 1.6)
bpy.context.view_layer.update()
bell = (mega_root.matrix_world @ Vector((0, 0, 0.046)))
fwd = (mega_root.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
for k in range(3):
    r = 0.016 + 0.009 * k
    pts_o = [(r * math.cos(a), r * math.sin(a)) for a in [math.radians(-50 + 100 * i / 16) for i in range(17)]]
    pts_i = [((r - 0.0022) * math.cos(a), (r - 0.0022) * math.sin(a)) for a in [math.radians(-50 + 100 * i / 16) for i in range(17)]]
    sl = prism(f'sound{k}', pts_o + pts_i[::-1], 0, 0.0012, arc_m, edge=None, bw=0.0)
    sl.location = bell + fwd * (0.010 + 0.011 * k)
    flat = Vector((fwd.x, fwd.y, 0)).normalized()
    sl.rotation_euler = (math.radians(90), 0, math.atan2(flat.y, flat.x))   # arcs bulge the way the sound goes
    no_shadow(sl)

# ---------------------------------------------------------------- film camera on a tripod (aims left, at the scene)
cam_body = empty('filmcam', (0.165, 0.035, 0.118), (0, 0, math.radians(160)))
dark = paper('cambody', '#2E3038', rough=0.45, fiber=0.0, spec=0.5)
metal = paper('brass', '#C9A05A', rough=0.35, fiber=0.0, metal=0.6, spec=0.6)
box('cam_box', 0.066, 0.040, 0.046, dark, (0, 0, 0), parent=cam_body, bw=0.0012)
lens = empty('lens', (0.033, 0, 0.022), (0, math.radians(90), 0), parent=cam_body)
lathe('lens_barrel', [(0, 0), (0.012, 0), (0.012, 0.026), (0.0135, 0.028), (0.0135, 0.032), (0, 0.032)], dark, segs=32).parent = lens
lathe('lens_ring', [(0.0124, 0.010), (0.0132, 0.010), (0.0132, 0.014), (0.0124, 0.014)], metal, segs=32).parent = lens
disc('lens_glass', 0.0105, 0.001, paper('glass', '#1B2A55', rough=0.08, fiber=0.0, spec=0.9), (0, 0, 0.0322), parent=lens, edge=None, bw=0.0)
reel_m = paper('reel', '#3A3D46', rough=0.5, fiber=0.0, spec=0.4)
for i, x in enumerate((-0.018, 0.020)):
    rr = empty(f'reel{i}', (x, 0, 0.046 + 0.022), (math.radians(90), 0, 0), parent=cam_body)
    disc(f'reel{i}_d', 0.022, 0.005, reel_m, (0, 0, -0.0025), parent=rr, bw=0.0006)
    for k in range(5):
        a = 2 * math.pi * k / 5
        disc(f'reel{i}_h{k}', 0.0045, 0.0062, paper('reelhole', '#14161B', rough=0.9, fiber=0.0),
             (0.012 * math.cos(a), 0.012 * math.sin(a), -0.0031), parent=rr, edge=None, bw=0.0)
    disc(f'reel{i}_hub', 0.004, 0.007, metal, (0, 0, -0.0035), parent=rr, edge=None, bw=0.0)
for k in range(3):
    a = math.radians(90 + 120 * k)
    leg = box(f'tripod{k}', 0.004, 0.004, 0.125, paper('tripod', '#1F2026', rough=0.5, fiber=0.0), (0, 0, 0), edge=None, bw=0.0003)
    leg.location = (0.165 + 0.035 * math.cos(a), 0.035 + 0.035 * math.sin(a), 0.0)
    tilt = Vector((0.165, 0.035, 0.118)) - Vector(leg.location)
    leg.rotation_euler = tilt.normalized().to_track_quat('Z', 'Y').to_euler()

# ---------------------------------------------------------------- clapperboard on the floor, leaning on the chair
slate = empty('slate', (-0.088, -0.050, 0.0), (math.radians(-14), 0, math.radians(18)))
box('slate_board', 0.064, 0.005, 0.046, paper('slateblack', '#1E1F24', rough=0.7, fiber=0.02), parent=slate, bw=0.0008)
stripes_m = paper('stripe_w', '#F4F1EA', rough=0.7, fiber=0.0)
clap = empty('clap', (-0.032, 0, 0.047), (0, math.radians(-16), 0), parent=slate)
box('clap_bar', 0.064, 0.006, 0.010, paper('slateblack2', '#1E1F24', rough=0.7, fiber=0.0), (0.032, 0, 0), parent=clap, bw=0.0006)
for k in range(5):
    x0 = 0.004 + 0.0125 * k
    prism(f'stripe{k}', [(x0, 0), (x0 + 0.006, 0), (x0 + 0.010, 0.010), (x0 + 0.004, 0.010)], -0.0032, 0.0002, stripes_m,
          edge=None, bw=0.0, rot=(math.radians(90), 0, 0), parent=clap)
font = bpy.data.fonts.load('C:/Windows/Fonts/arialbd.ttf')
chalk = paper('chalk', '#F4F1EA', rough=0.9, fiber=0.0)
for txt, size, z in (('CLAUDE', 0.0105, 0.026), ('TAKE 1', 0.0065, 0.010)):
    cu = bpy.data.curves.new('txt_' + txt, 'FONT')
    cu.body, cu.size, cu.align_x, cu.extrude, cu.font = txt, size, 'CENTER', 0.0002, font
    ob = bpy.data.objects.new('txt_' + txt, cu)
    toy.col().objects.link(ob)
    ob.data.materials.append(chalk)
    ob.parent = slate
    ob.location = (0, -0.0028, z)
    ob.rotation_euler = (math.radians(90), 0, 0)
disc('floor_reel', 0.026, 0.006, reel_m, (0.070, -0.085, 0.0), (0, 0, 0.3), bw=0.0006)
disc('floor_reel_hub', 0.006, 0.0068, metal, (0.070, -0.085, 0.0), edge=None, bw=0.0)

# ---------------------------------------------------------------- studio lamp at the back right
lamp = empty('lamp', (0.27, 0.17, 0.0))
lathe('lamp_pole', [(0, 0), (0.0025, 0), (0.0025, 0.20), (0, 0.20)], paper('lamppole', '#1F2026', rough=0.5, fiber=0.0), segs=12).parent = lamp
head = empty('lamp_head', (0, 0, 0.205), (0, 0, 0), parent=lamp)
aim = Vector((0.0, 0.0, 0.13)) - Vector((0.27, 0.17, 0.205))
head.rotation_euler = aim.normalized().to_track_quat('Z', 'Y').to_euler()
lathe('lamp_can', [(0, -0.03), (0.018, -0.03), (0.024, 0.0), (0, 0.0)], paper('lampcan', '#2A2C33', rough=0.4, fiber=0.0, spec=0.5), segs=32).parent = head
lf = disc('lamp_face', 0.0225, 0.001, toy.flame_mat('lampface', '#FFF0CC', 6.0), (0, 0, 0.0002), parent=head, edge=None, bw=0.0)
no_shadow(lf)

# ---------------------------------------------------------------- light and camera
TGT = Vector((0.075, 0.0, 0.100))
toy.area_light('key', (-0.35, -0.45, 0.45), TGT, 0.30, 30.0, '#FFD7A8')
toy.area_light('rim', (0.26, 0.15, 0.21), Vector((0, 0, 0.13)), 0.05, 12.0, '#FFE6C0')
toy.area_light('fill', (0.40, -0.50, 0.15), TGT, 0.60, 6.0, '#8FA6FF')
sd = bpy.data.lights.new('pool', 'SPOT')
sd.energy, sd.spot_size, sd.spot_blend, sd.shadow_soft_size = 26.0, math.radians(38), 0.7, 0.03
sd.color = toy.hexc('#FFD9A8')[:3]
spot = bpy.data.objects.new('pool', sd)
toy.col().objects.link(spot)
spot.location = (0.0, -0.08, 0.62)
spot.rotation_euler = (Vector((0.0, 0.0, 0.0)) - spot.location).to_track_quat('-Z', 'Y').to_euler()
cam = toy.camera(TGT, 0.88, 7, -14, 50, 3.2)
cam.data.shift_x = -0.24                      # pushes the subject to the right third: the left stays clear for text
cam.data.dof.focus_distance = (Vector((0.0, -0.01, 0.12)) - cam.location).length


def pose(f):
    # the same pose again, so runner's --eyes-off (live web eyes) can hide the eyes
    claude.pose(s=1.0, yaw=-12, pitch=-3, roll=-4, arm_l=38, arm_r=-8, eyes='happy', eye_look=-0.6)


runner.run(pose, T=1, fps=25, size=(2400, 1200), engine='cycles', samples=256, exposure=-0.6)
