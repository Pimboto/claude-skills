"""Quality control of a rendered video. Measures the frames and the MP4 and fails if a number is out of range.

    python scripts/qa.py <plan>        reads out/<plan>/frames, out/<plan>/plan_info.json and out/<plan>/<plan>.mp4
                                       writes out/<plan>/qa.json; exit code 1 if any check fails

What it checks, and where each limit comes from (references/STYLE_BIBLE.md and CAMERA_RULES.md):
  frames      every frame exists, 1080x1920
  frozen      no two consecutive frames are the same picture (the camera never stops dead: it creeps)
  black       the background is the lifted black of the look, not pure black and not grey
  hook        the opening push-in is front-loaded: half of its travel is done in the first 40 % (reference 28 %)
  reframes    each reframe starts hard and brakes long: half of its travel done in the first 45 % (reference 30-32 %)
  holds       between moves the camera holds: median image speed under 1.2 px per frame at 720p (reference 0.3)
  whips       a whip-pan really moves (peak speed over 20 px per frame) and the frame darkens in the middle
  mp4         h264, yuv420p, tagged BT.709, right number of frames, audio present and as long as the picture
It does not judge taste, and it does not check that the captions say the right words.
"""
import sys, os, json, glob, subprocess
import numpy as np, cv2
cv2.setNumThreads(2)
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = sys.argv[1]; OUT = os.path.join(KIT, 'out', plan)
info = json.load(open(os.path.join(OUT, 'plan_info.json')))
files = sorted(glob.glob(os.path.join(OUT, 'frames', 'f_*.png')))
checks = []
def check(name, ok, detail): checks.append(dict(name=name, ok=bool(ok), detail=detail))

# ---- frames
first = cv2.imread(files[0]) if files else None
check('frames', len(files) == info['frames'] and first is not None and first.shape[:2] == (1920, 1080),
      '%d of %d frames, %s' % (len(files), info['frames'], 'x'.join(str(v) for v in first.shape[1::-1]) if first is not None else 'no picture'))
if not files: print('FAIL frames  nothing to check'); sys.exit(1)

# ---- image speed (px per frame at 720p) and frame-to-frame difference, caption band left out
prev = None; flow = []; same = []; luma = []; dark = []
for fn in files:
    full = cv2.imread(fn); g = cv2.cvtColor(cv2.resize(full, (360, 640), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    luma.append(float(g.mean())); dark.append(float(np.percentile(g, 10)))
    g[485:530] = 0                                            # words changing are not camera motion
    if prev is not None:
        same.append(float(np.abs(g.astype(np.int16) - prev).mean()))
        fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 4, 21, 3, 5, 1.1, 0); m = np.hypot(fl[..., 0], fl[..., 1]); bright = prev > 40
        flow.append(float(np.median(m[bright])) * 2 if bright.sum() > 500 else 0.0)
    prev = g
flow = np.array(flow); same = np.array(same); luma = np.array(luma)
np.save(os.path.join(OUT, 'qa_flow.npy'), flow)

frozen = [i + 1 for i, v in enumerate(same) if v < 0.02]
check('frozen', not frozen, 'none' if not frozen else 'frames %s repeat the one before' % frozen[:12])
bg = float(np.median(dark))
check('black', 1.0 <= bg <= 9.0, 'background level %.1f of 255 (expected 1 to 9)' % bg)

moving = np.zeros(len(flow) + 1, bool)                       # frames that belong to a move or a whip-pan
for mv in info['moves']:
    moving[mv['f0']:mv['f1'] + 1] = True
    seg = flow[mv['f0']:mv['f1']]
    if mv['kind'] == 'slow' or len(seg) < 4 or seg.max() < 1.5: continue
    c = np.cumsum(seg) / seg.sum(); half = 100.0 * np.searchsorted(c, 0.5) / len(seg); peak = 100.0 * int(np.argmax(seg)) / len(seg)
    limit = 40 if mv['kind'] == 'hook' else 45
    check('%s %d-%d' % (mv['kind'], mv['f0'], mv['f1']), half <= limit, 'half of the travel at %.0f %% (limit %d %%), fastest at %.0f %%, %.1f px/frame' % (half, limit, peak, seg.max()))
for w in info['whips']:
    a, b = w['at'], w['at'] + w['frames']; moving[max(0, a - 2):b + 3] = True
    seg = flow[a:b]; mid = luma[a + w['frames'] // 2]; before = luma[max(0, a - 3)]
    check('whip %d-%d' % (a, b), seg.max() > 20 and mid < before, 'peak %.0f px/frame (over 20), brightness in the middle %.0f %% of before' % (seg.max(), 100 * mid / max(before, 1e-6)))
hold = flow[~moving[:len(flow)]]
if len(hold): check('holds', np.median(hold) <= 1.2, 'median %.2f px/frame over %d frames (limit 1.2)' % (np.median(hold), len(hold)))

# ---- the MP4
mp4 = os.path.join(OUT, plan + '.mp4')
if os.path.exists(mp4):
    try:
        j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', mp4], capture_output=True, text=True).stdout)
        v = [s for s in j['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in j['streams'] if s['codec_type'] == 'audio']
        okv = v['codec_name'] == 'h264' and v.get('pix_fmt') == 'yuv420p' and v.get('color_space') == 'bt709' and int(v.get('nb_frames', 0)) == info['frames']
        check('mp4 video', okv, '%s %s %s, %s frames' % (v['codec_name'], v.get('pix_fmt'), v.get('color_space'), v.get('nb_frames')))
        want = info['frames'] / info['fps']
        check('mp4 audio', bool(a) and abs(float(a[0]['duration']) - want) <= 0.1, ('%.2f s of audio for %.2f s of picture' % (float(a[0]['duration']), want)) if a else 'no audio track')
    except Exception as e:
        check('mp4', False, 'could not read it with ffprobe: %s' % e)
else:
    check('mp4', False, 'out/%s/%s.mp4 not found' % (plan, plan))

for c in checks: print('%s %-18s %s' % ('ok  ' if c['ok'] else 'FAIL', c['name'], c['detail']))
bad = [c for c in checks if not c['ok']]
json.dump(dict(plan=plan, passed=not bad, checks=checks), open(os.path.join(OUT, 'qa.json'), 'w'), indent=1)
print('QA PASSED: %d checks' % len(checks) if not bad else 'QA FAILED: %d of %d checks' % (len(bad), len(checks)))
sys.exit(1 if bad else 0)
