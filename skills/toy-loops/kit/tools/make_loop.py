"""Render a toy3d scene and turn it into GIFs and MP4s, then check the loop.

    python tools/make_loop.py <name>                 full render + GIF 1080/720 + MP4 x1/x3 + QA
    python tools/make_loop.py <name> --preview       every 8th frame at half size + a contact sheet (fast look)
    python tools/make_loop.py <name> --frames 44,62,77 [--scale 0.5]   just those frames + a sheet
    python tools/make_loop.py <name> --encode-only   re-encode and re-check frames already rendered
    options: --engine cycles --samples 128 (stills), --blender <path>

<name> is a folder in kit/loops/ (a looping animation) or kit/stills/ (a single picture, T = 1).
Output: kit/out/<name>/ (frames/, the GIF/MP4/PNG files, sheet.jpg, qa.json). Run from anywhere.
"""
import argparse, json, os, shutil, subprocess, sys, time

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANYMATION = os.path.dirname(os.path.dirname(os.path.dirname(KIT)))
def find_blender():
    """$BLENDER, then Pimbo's portable copy (anymation/tools/blender), then 'blender' on the PATH."""
    if os.environ.get('BLENDER'):
        return os.environ['BLENDER']
    local = os.path.join(ANYMATION, 'tools', 'blender', 'blender.exe')
    return local if os.path.exists(local) else (shutil.which('blender') or 'blender')


DEFAULT_BLENDER = find_blender()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_loop  # noqa: E402


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', **kw)
    if r.returncode != 0:
        print(r.stdout[-3000:])
        print(r.stderr[-3000:])
        raise SystemExit(f'FAILED: {" ".join(cmd[:3])} ... (exit {r.returncode})')
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--frames', default='')
    ap.add_argument('--scale', type=float, default=None)
    ap.add_argument('--engine', default='')
    ap.add_argument('--samples', type=int, default=0)
    ap.add_argument('--encode-only', action='store_true')
    ap.add_argument('--blender', default=DEFAULT_BLENDER)
    ap.add_argument('--eyes-off', action='store_true', help='Claude without eyes + eyes.json (live web eyes)')
    ap.add_argument('--transparent', action='store_true', help='PNG with a transparent background')
    ap.add_argument('--tag', default='', help='suffix for the output name, e.g. _noeyes')
    a = ap.parse_args()

    scene = None
    for kind in ('loops', 'stills'):
        p = os.path.join(KIT, kind, a.name, 'scene.py')
        if os.path.exists(p):
            scene, is_still = p, kind == 'stills'
    if not scene:
        raise SystemExit(f'no scene: kit/loops/{a.name}/scene.py or kit/stills/{a.name}/scene.py')
    out = os.path.join(KIT, 'out', a.name)
    frames_dir = os.path.join(out, 'frames' if not (a.preview or a.frames) else 'preview')
    partial = bool(a.preview or a.frames)

    if not a.encode_only:
        if partial and os.path.isdir(frames_dir):
            shutil.rmtree(frames_dir)
        stale = os.path.join(frames_dir, 'eyes.json')
        if os.path.exists(stale):
            os.remove(stale)
        cmd = [a.blender, '-b', '--factory-startup', '--python', scene, '--', '--out', frames_dir]
        if a.preview:
            cmd += ['--frames', 'every:8', '--scale', str(a.scale or 0.5)]
        elif a.frames:
            cmd += ['--frames', a.frames, '--scale', str(a.scale or 0.5)]
        elif a.scale:
            cmd += ['--scale', str(a.scale)]
        if a.engine:
            cmd += ['--engine', a.engine]
        if a.samples:
            cmd += ['--samples', str(a.samples)]
        if a.eyes_off:
            cmd += ['--eyes-off']
        if a.transparent:
            cmd += ['--transparent']
        t0 = time.time()
        r = run(cmd)
        line = [l for l in r.stdout.splitlines() if l.startswith('RENDERED')]
        print('render:', line[-1] if line else f'done in {time.time() - t0:.0f} s')

    meta = json.load(open(os.path.join(frames_dir, 'meta.json')))
    pngs = sorted(f for f in os.listdir(frames_dir) if f.endswith('.png'))
    if partial:
        sheet = os.path.join(out, 'preview_sheet.jpg')
        qa_loop.sheet([os.path.join(frames_dir, p) for p in pngs], sheet, labels=[p[:-4] for p in pngs])
        print('sheet:', sheet)
        return
    if is_still or meta['T'] == 1:
        dst = os.path.join(out, f'{a.name}{a.tag}.png')
        shutil.copy(os.path.join(frames_dir, pngs[0]), dst)
        print('still:', dst)
        ej = os.path.join(frames_dir, 'eyes.json')
        if os.path.exists(ej):
            shutil.copy(ej, os.path.join(out, f'{a.name}{a.tag}_eyes.json'))
            print('eyes:', os.path.join(out, f'{a.name}{a.tag}_eyes.json'))
        return

    fps, pat = meta['fps'], os.path.join(frames_dir, '%04d.png')
    gif = os.path.join(out, f'{a.name}_1080.gif')
    pal = os.path.join(out, 'palette.png')
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', pat, '-vf', 'palettegen=stats_mode=full', pal])
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', pat, '-i', pal, '-lavfi',
         'paletteuse=dither=sierra2_4a', '-loop', '0', gif])
    os.remove(pal)
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', pat, '-vf',
         'scale=720:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
         '-loop', '0', os.path.join(out, f'{a.name}_720.gif')])
    mp4 = os.path.join(out, f'{a.name}_1loop.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', pat, '-c:v', 'libx264', '-crf', '16', '-preset', 'slow',
         '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
         '-movflags', '+faststart', mp4])
    run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '2', '-i', mp4, '-c', 'copy', os.path.join(out, f'{a.name}_3loops.mp4')])
    res = qa_loop.check(gif, meta['T'])
    qa_loop.sheet([os.path.join(frames_dir, p) for p in pngs[::max(1, len(pngs) // 12)][:12]],
                  os.path.join(out, 'sheet.jpg'), labels=[p[:-4] for p in pngs[::max(1, len(pngs) // 12)][:12]])
    json.dump(res, open(os.path.join(out, 'qa.json'), 'w'), indent=1)
    for line in res['lines']:
        print(line)
    for f in sorted(os.listdir(out)):
        if f.endswith(('.gif', '.mp4')):
            print(f'file: {f}  {os.path.getsize(os.path.join(out, f)) / 1e6:.1f} MB')
    if not res['pass']:
        raise SystemExit('QA FAILED')


if __name__ == '__main__':
    main()
