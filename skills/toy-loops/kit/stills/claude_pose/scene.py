# Claude alone, in the pose and light of the first loop (claude_isla, frame 0), on a transparent background with a
# soft contact shadow. Made for web pages: render it without eyes and draw live eyes on top (tools/web_eyes.py).
#   python tools/make_loop.py claude_pose --transparent --eyes-off --tag _noeyes
#   python tools/make_loop.py claude_pose --transparent              (with its own eyes, as a fallback picture)
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import bpy
from mathutils import Vector
import toy, runner
from toy import paper, disc
from chars import Claude

toy.reset()
CAM_AZ = -16
claude = Claude('claude', (0, 0, 0))
# the ground only catches the shadow; it is invisible in the transparent picture (Cycles shadow catcher)
# TOY_SHADOW=0 leaves it out (a page that adds its own shadow in CSS)
if os.environ.get('TOY_SHADOW', '1') != '0':
    ground = disc('ground', 0.5, 0.002, paper('ground', '#F1D6A2', rough=0.9, fiber=0.0), (0, 0, -0.002), edge=None, bw=0.0)
    ground.is_shadow_catcher = True

toy.world('#E9D2BC', 0.22)
TGT = Vector((0.0, 0.0, 0.046))
toy.area_light('key', Vector((-0.40, -0.45, 0.80)) * 0.6, TGT, 0.25, 22.0, '#FFD9A8')
toy.area_light('fill', Vector((0.60, -0.55, 0.30)) * 0.6, TGT, 0.60, 1.4, '#BFD9FF')
toy.area_light('rim', Vector((0.30, 0.65, 0.35)) * 0.6, TGT, 0.20, 6.0, '#FFC890')
cam = toy.camera(TGT, 0.34, 29, CAM_AZ, 70, 16.0)


def pose(f):
    claude.pose(s=1.0, yaw=CAM_AZ, eyes='sq')


runner.run(pose, T=1, fps=25, size=(1200, 1200), engine='cycles', samples=192, exposure=-1.0)
