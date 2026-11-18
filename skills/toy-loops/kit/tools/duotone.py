"""Gradient-map a picture to a few colours (the blue monochrome look of web heroes like the ServerOS reference).

    python tools/duotone.py <in.png> <out.png> [--stops "#081150,#2447D8,#9DB4FF,#F2F5FF"] [--contrast 1.1]

Brightness picks a colour along the stops (dark to light). Works on stills and on every PNG of a frames folder.
"""
import argparse
import numpy as np
from PIL import Image


def hex_rgb(h):
    h = h.strip().lstrip('#')
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def duotone(src, dst, stops, contrast=1.1):
    im = np.asarray(Image.open(src).convert('RGB'), dtype=np.float32) / 255
    lum = 0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2]
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99.5)
    t = np.clip((lum - lo) / max(hi - lo, 1e-6), 0, 1)
    t = np.clip((t - 0.5) * contrast + 0.5, 0, 1)
    cols = np.array([hex_rgb(s) for s in stops], dtype=np.float32)
    pos = np.linspace(0, 1, len(cols))
    out = np.stack([np.interp(t, pos, cols[:, c]) for c in range(3)], axis=-1)
    Image.fromarray(out.astype(np.uint8)).save(dst)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--stops', default='#081150,#2447D8,#9DB4FF,#F2F5FF')
    ap.add_argument('--contrast', type=float, default=1.1)
    a = ap.parse_args()
    duotone(a.src, a.dst, a.stops.split(','), a.contrast)
    print('duotone:', a.dst)
