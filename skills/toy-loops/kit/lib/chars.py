"""Characters for toy3d.

Claude: the salmon paper block with four legs and stub arms (Anthropic's mascot; Pimbo chose it on 2026-11-18,
"ese Claude está hermoso"). Build it with Claude(...) and drive it with .pose(...) once per frame.
Every number here was tuned on renders; see references/CHARACTERS.md.
"""
import math
from mathutils import Vector
import toy
from toy import paper, box, prism, empty, set_visible
from anim import squash

CLAUDE_COLOR = '#EA8661'
REGISTRY = []          # every Claude built in this scene (runner uses it for --eyes-off)
EYES_OFF = False       # set by runner --eyes-off: render without eyes, for live web eyes drawn on top
W, D, H, LH = 0.060, 0.046, 0.046, 0.013     # body width, depth, height, leg height (rig units, before scale)

# eye shapes in millimetres, (left eye, right eye); x = right, y = up as seen from the front
_SQ = [(-3.3, -4.6), (3.3, -4.6), (3.3, 4.6), (-3.3, 4.6)]
_HAPPY = [(-5.0, -2.2), (0, 2.8), (5.0, -2.2), (3.5, -3.4), (0, 0.8), (-3.5, -3.4)]
_LINE = [(-4.6, -1.1), (4.6, -1.1), (4.6, 1.1), (-4.6, 1.1)]
_GT = [(-2.2, 5.0), (2.8, 0), (-2.2, -5.0), (-3.4, -3.5), (0.8, 0), (-3.4, 3.5)]          # '>'
_LT = [(-x, y) for x, y in _GT]                                                           # '<'
_DOT = [(2.0 * math.cos(2 * math.pi * i / 20), 2.0 * math.sin(2 * math.pi * i / 20)) for i in range(20)]
_SAD = [(-4.4, 1.4), (4.4, -0.6), (4.4, -2.6), (-4.4, -0.6)]                             # sloped lines
EYES = {
    'sq': (_SQ, _SQ),            # normal
    'happy': (_HAPPY, _HAPPY),   # ^ ^ joy
    'line': (_LINE, _LINE),      # - - blink, bored, "aww"
    'squeeze': (_GT, _LT),       # > < effort, eyes shut tight
    'dot': (_DOT, _DOT),         # . . small, unsure
    'sad': ([(-x, y) for x, y in _SAD], _SAD),   # / \ worried
}


class Claude:
    """Rig: root (place, turn) > rig (jump height, lean) > legs (stretch) + torso (squash, arms, face)."""

    def __init__(self, name='claude', loc=(0, 0, 0), scale=1.45, color=CLAUDE_COLOR):
        self.name = name
        self.scale = scale
        REGISTRY.append(self)
        self.root = empty(name, loc)
        self.root.scale = (scale, scale, scale)
        self.rig = empty(name + '_rig', (0, 0, 0), parent=self.root)
        skin = paper(name + '_skin', color, rough=0.85, fiber=0.03)
        self.legs = empty(name + '_legs', (0, 0, 0), parent=self.rig)
        for i, x in enumerate((-0.0225, -0.0075, 0.0075, 0.0225)):
            box(f'{name}_leg{i}', 0.0085, 0.030, LH + 0.001, skin, (x, 0.002, 0), parent=self.legs, bw=0.0007)
        self.torso = empty(name + '_torso', (0, 0, LH), parent=self.rig)
        box(name + '_body', W, D, H, skin, (0, 0, 0), parent=self.torso, bw=0.0010)
        self.arm = {}
        for s in (-1, 1):
            piv = empty(f'{name}_armpiv{s}', (s * W / 2, 0, 0.46 * H), parent=self.torso)
            box(f'{name}_arm{s}', 0.017, 0.016, 0.014, skin, (s * 0.0085, 0, -0.0070), parent=piv, bw=0.0007)
            self.arm[s] = piv
        self.face = empty(name + '_face', (0, -D / 2 - 0.0002, 0.60 * H), (math.radians(90), 0, 0), parent=self.torso)
        ink = toy.ink_mat()
        mm = lambda pts: [(x / 1000, y / 1000) for x, y in pts]
        self.eyes = {}
        for kind, (left, right) in EYES.items():
            e = empty(f'{name}_eyes_{kind}', (0, 0, 0), parent=self.face)
            for s, shape in ((-1, left), (1, right)):
                prism(f'{name}_eye_{kind}{s}', mm(shape), 0, 0.0006, ink, edge=None, bw=0.0, loc=(s * 0.0135, 0, 0), parent=e)
            self.eyes[kind] = e

    def hand(self, side):
        """The arm pivot (side -1 = Claude's left, +1 = right). Parent a held prop to it, offset +side*0.017 in x."""
        return self.arm[side]

    def pose(self, s=1.0, hop=0.0, pitch=0.0, roll=0.0, yaw=0.0, arm_l=0.0, arm_r=0.0,
             eyes='sq', eye_big=1.0, eye_look=0.0, loc=None):
        """One frame of Claude.
        s: squash (<1) / stretch (>1), volume kept; the legs take most of it.  hop: jump height (rig units).
        pitch: lean forward (+) / back (-), roll: lean to its right (+), yaw: turn left (+) seen from above; degrees.
        arm_l / arm_r: arm raised (+) or lowered (-) in degrees.  eyes: a key of EYES, swapped in one frame.
        eye_big: eye scale (surprise ~1.4).  eye_look: -1..1, eyes slide towards its left / right."""
        if loc is not None:
            self.root.location = loc
        self.root.rotation_euler = (0, 0, math.radians(yaw))
        legf = max(0.35, min(1.4, 1 + 1.6 * (s - 1)))
        self.rig.location = (0, 0, hop)
        self.rig.rotation_euler = (math.radians(pitch), math.radians(roll), 0)
        self.legs.scale = (1, 1, legf)
        self.torso.location = (0, 0, LH * legf)
        self.torso.scale = squash(s)
        self.arm[-1].rotation_euler = (0, math.radians(arm_l), 0)
        self.arm[1].rotation_euler = (0, -math.radians(arm_r), 0)
        for k, e in self.eyes.items():
            set_visible(e, k == eyes and not EYES_OFF)
        if eyes == 'none':
            return
        e = self.eyes[eyes]
        e.scale = (eye_big, eye_big, 1)
        e.location = (0.0028 * max(-1.0, min(1.0, eye_look)), 0, 0)


def eye_rig(claude, scene, cam):
    """Where the eyes sit in the rendered picture, for eyes drawn live on a web page (SVG over a PNG).
    Returns pixel centres of both eyes and the face plane's axes in pixels per millimetre (eye-shape units),
    so an SVG group with transform matrix(ax.x, ax.y, ay.x, ay.y, cx, cy) draws the shapes of EYES on the face."""
    from bpy_extras.object_utils import world_to_camera_view
    import bpy
    bpy.context.view_layer.update()
    r = scene.render
    w, h = r.resolution_x * r.resolution_percentage // 100, r.resolution_y * r.resolution_percentage // 100

    def px(co):
        v = world_to_camera_view(scene, cam, co)
        return (v.x * w, (1 - v.y) * h)

    m = claude.face.matrix_world
    out = {'image': [w, h], 'eyes': []}
    for s in (-1, 1):
        c = m @ Vector((s * 0.0135, 0, 0))
        cx, cy = px(c)
        x1 = px(m @ Vector((s * 0.0135 + 0.001, 0, 0)))
        y1 = px(m @ Vector((s * 0.0135, 0.001, 0)))
        out['eyes'].append({'side': 'left' if s < 0 else 'right', 'c': [cx, cy],
                            'ax': [x1[0] - cx, x1[1] - cy], 'ay': [y1[0] - cx, y1[1] - cy]})
    # face rectangle corners (to keep the eyes on the face), in mm from the eye line
    out['face_mm'] = {'x': [-W * 500, W * 500], 'y': [-0.60 * H * 1000, 0.40 * H * 1000]}
    out['shapes_mm'] = {k: {'left': v[0], 'right': v[1]} for k, v in EYES.items()}
    out['ink'] = '#1C1B1F'
    return out
