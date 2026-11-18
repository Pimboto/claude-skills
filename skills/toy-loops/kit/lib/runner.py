"""Renders a toy3d scene frame by frame. A scene file builds everything, defines pose(f), and ends with:

    runner.run(pose, T=200, fps=25, size=(1080, 1080))

Called by tools/make_loop.py as:
    blender -b --factory-startup --python <scene.py> -- --out <dir> [--frames all|0,40,80|every:8] [--scale 0.5]
                                                          [--engine eevee|cycles] [--samples 64]
pose(f) must set EVERYTHING for frame f (no state carried between frames): frames render in any order.
"""
import sys, os, json, time, argparse
import bpy
import toy


def run(pose, T, fps=25, size=(1080, 1080), engine='eevee', samples=64, exposure=-1.0):
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--frames', default='all')
    ap.add_argument('--scale', type=float, default=1.0)
    ap.add_argument('--engine', default=engine)
    ap.add_argument('--samples', type=int, default=samples)
    ap.add_argument('--save', default='', help='also save the .blend here (frame 0 pose) to inspect it in Blender')
    ap.add_argument('--eyes-off', action='store_true', help='no eyes on Claude; writes eyes.json for live web eyes')
    ap.add_argument('--transparent', action='store_true', help='transparent background (PNG with alpha)')
    a = ap.parse_args(argv)

    w, h = int(round(size[0] * a.scale / 2)) * 2, int(round(size[1] * a.scale / 2)) * 2
    toy.render_settings(w, h, fps, a.engine, a.samples, exposure=exposure)
    import chars
    chars.EYES_OFF = a.eyes_off
    if a.transparent:
        bpy.context.scene.render.film_transparent = True
        bpy.context.scene.render.image_settings.color_mode = 'RGBA'
    if a.frames == 'all':
        frames = list(range(T))
    elif a.frames.startswith('every:'):
        frames = list(range(0, T, int(a.frames.split(':')[1])))
    else:
        frames = [int(x) for x in a.frames.split(',')]
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'meta.json'), 'w') as fh:
        json.dump({'T': T, 'fps': fps, 'size': [w, h], 'engine': a.engine, 'samples': a.samples,
                   'frames': len(frames), 'all': a.frames == 'all'}, fh)
    if a.save:
        pose(0)
        bpy.ops.wm.save_as_mainfile(filepath=a.save)
    sc = bpy.context.scene
    t0 = time.time()
    for i, f in enumerate(frames):
        pose(f % T)
        sc.frame_set(f)
        if a.eyes_off and i == 0 and chars.REGISTRY:
            rigs = [chars.eye_rig(c, sc, sc.camera) for c in chars.REGISTRY]
            with open(os.path.join(a.out, 'eyes.json'), 'w') as fh:
                json.dump(rigs[0] if len(rigs) == 1 else rigs, fh, indent=1)
        sc.render.filepath = os.path.join(a.out, f'{f:04d}.png')
        bpy.ops.render.render(write_still=True)
    dt = time.time() - t0
    print(f'RENDERED {len(frames)} frames in {dt:.1f} s ({dt / max(1, len(frames)):.2f} s/frame) at {w}x{h} {a.engine}')
