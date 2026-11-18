"""Has a change to the kit changed the look? Compares stills of pricetag_demo with the approved frames.

    node scripts/build.cjs pricetag_demo
    node scripts/render.cjs pricetag_demo stills 0,17,88,150,174,236        (add --gpu on a PC with a graphics card)
    python scripts/check_look.py [--gpu]

Software rendering must match exactly. A graphics card draws almost the same picture: with --gpu the check allows an
average difference of 1.5 levels of 255 per frame (measured on Pimbo's PC against software: 0.8, after encoding).
"""
import sys, os, glob
import numpy as np, cv2
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(KIT, '..', 'references', 'frames'); gpu = '--gpu' in sys.argv; bad = 0
refs = sorted(glob.glob(os.path.join(REF, 'pricetag_demo_*.png')))
for ref in refs:
    n = os.path.basename(ref).split('_')[-1][:-4]; still = os.path.join(KIT, 'out', 'pricetag_demo', 'stills', 'still_%s.png' % n)
    if not os.path.exists(still): print('FAIL frame %s: still not rendered' % n); bad += 1; continue
    d = np.abs(cv2.imread(ref).astype(np.int16) - cv2.imread(still).astype(np.int16))
    ok = d.mean() <= 1.5 if gpu else d.max() == 0
    bad += not ok
    print('%s frame %s: largest difference %d, average %.3f, pixels that differ %.2f %%' % ('ok  ' if ok else 'FAIL', n, d.max(), d.mean(), 100.0 * (d.max(axis=2) > 0).mean()))
print('LOOK UNCHANGED' if not bad else 'LOOK CHANGED in %d of %d frames' % (bad, len(refs)))
sys.exit(1 if bad else 0)
