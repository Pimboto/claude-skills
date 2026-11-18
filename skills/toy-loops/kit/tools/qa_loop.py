"""Checks a looping GIF the way the reference study measured the style2 GIFs (mean grey step between frames).

    python tools/qa_loop.py <file.gif> [T]

FAIL: wrong frame count; the jump from the last frame to the first is bigger than the 90th percentile of the
normal steps (the loop shows a seam). WARN: identical consecutive frames (a dead hold); motion under 0.8 % of the
mean brightness (a dark scene moves fewer grey levels for the same action, so motion is compared relative to
brightness). INFO: the motion numbers next to the references.
"""
import sys
import numpy as np
from PIL import Image, ImageSequence, ImageDraw, ImageFont

REFS = 'references r2/r3/r4: 1.65/1.97/1.07 %; approved claude_isla 0.89 %'


def grey_frames(path, width=540):
    im = Image.open(path)
    out = []
    for fr in ImageSequence.Iterator(im):
        g = fr.convert('RGB').convert('L')
        if g.width > width:
            g = g.resize((width, round(g.height * width / g.width)), Image.BILINEAR)
        out.append(np.asarray(g, dtype=np.float32))
    return out


def check(path, T=None):
    fr = grey_frames(path)
    n = len(fr)
    steps = np.array([np.abs(fr[i + 1] - fr[i]).mean() for i in range(n - 1)])
    wrap = float(np.abs(fr[0] - fr[-1]).mean())
    med, p90, mx = float(np.median(steps)), float(np.percentile(steps, 90)), float(steps.max())
    frozen = [int(i) for i in np.where(steps < 0.02)[0]]
    lines, ok = [], True
    if T is not None and n != T:
        lines.append(f'FAIL frames: {n}, expected {T}')
        ok = False
    else:
        lines.append(f'PASS frames: {n}')
    if wrap <= p90:
        lines.append(f'PASS loop seam: last->first {wrap:.2f} (normal step median {med:.2f}, p90 {p90:.2f})')
    else:
        lines.append(f'FAIL loop seam: last->first {wrap:.2f} > p90 {p90:.2f}: the loop jumps')
        ok = False
    if frozen:
        lines.append(f'WARN identical frames after: {frozen[:12]}{" ..." if len(frozen) > 12 else ""} (a dead hold?)')
    luma = float(np.mean([x.mean() for x in fr]))
    rel = 100 * med / max(luma, 1)
    if rel < 0.8:
        lines.append(f'WARN motion {rel:.2f} % of brightness < 0.8 %: too quiet?')
    lines.append(f'INFO motion median {med:.2f} grey levels = {rel:.2f} % of brightness {luma:.0f}; p90 {p90:.2f}, max {mx:.2f}  ({REFS})')
    return {'pass': ok, 'frames': n, 'seam': wrap, 'median': med, 'p90': p90, 'max': mx, 'luma': luma, 'motion_pct': rel,
            'frozen': frozen, 'lines': lines}


def sheet(paths, dst, labels=None, cols=6, width=300):
    ims = [Image.open(p).convert('RGB') for p in paths]
    if not ims:
        return
    h = round(ims[0].height * width / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    out = Image.new('RGB', (cols * width, rows * h), (20, 20, 24))
    d = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 18)
    except OSError:
        font = ImageFont.load_default()
    for i, im in enumerate(ims):
        x, y = (i % cols) * width, (i // cols) * h
        out.paste(im.resize((width, h), Image.LANCZOS), (x, y))
        if labels:
            d.rectangle((x, y, x + 58, y + 24), fill=(0, 0, 0))
            d.text((x + 5, y + 2), str(labels[i]), font=font, fill=(255, 255, 255))
    out.save(dst, quality=88)


if __name__ == '__main__':
    r = check(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else None)
    print('\n'.join(r['lines']))
