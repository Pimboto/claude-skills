"""Turn an eyes-off render into a web piece where Claude's eyes follow the cursor.

    python tools/web_eyes.py <noeyes.png> <eyes.json> <out_dir> [--ink-from <render_with_eyes.png> | --ink #35210D] [--title ...]
                             [--hero]   (keep the full picture as a page hero instead of cropping a cut-out)

Writes <out_dir>/index.html (self-contained apart from the picture) and the picture next to it.
The eyes are SVG shapes drawn on the face plane: the render's eyes.json gives each eye's pixel centre and the face
axes in pixels per millimetre, so the shapes sit on the face in perspective and slide across it.
Behaviour, animated like the loops (springs, one-frame swaps):
  - the eyes follow the pointer with a slightly underdamped spring (a small overshoot, then they settle)
  - blinks every 2.5-5.5 s, sometimes twice
  - ^ ^ while the pointer is near Claude; > < while pressed; a squash-and-stretch bounce on click
  - with no pointer (phones, or the pointer left the page) the eyes look around on their own
"""
import argparse, json, os, shutil
import numpy as np
from PIL import Image

HTML = r'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root { --bg1: #0b1233; --bg2: #18245c; --text: #f2f5ff; --muted: #a9b4e8; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { background: radial-gradient(1200px 700px at 70% 40%, var(--bg2), var(--bg1)); color: var(--text);
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif; overflow-x: hidden; }
  .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 2rem;
          max-width: 1200px; margin: 0 auto; padding: 2rem 16px; }
  .hero.full { display: block; max-width: none; padding: 0; position: relative; }
  h1 { font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1.05; margin: 0 0 1rem; letter-spacing: -0.02em; }
  p { color: var(--muted); font-size: 1.1rem; margin: 0; }
  .claude { position: relative; width: 100%; transform-origin: 50% 88%; cursor: pointer; user-select: none;
            -webkit-tap-highlight-color: transparent; }
  .claude img, .claude svg { display: block; width: 100%; height: auto; }
  .claude svg { position: absolute; inset: 0; height: 100%; pointer-events: none; }
  .full .copy { position: absolute; left: 6%; top: 50%; transform: translateY(-50%); max-width: 36%; }
  @media (max-width: 760px) { .hero { grid-template-columns: 1fr; text-align: center; }
    .full .copy { position: static; transform: none; max-width: none; padding: 1.5rem 16px; } }
</style>
</head>
<body>
<main class="hero __MODE__">
  <div class="copy">
    <h1>__TITLE__</h1>
    <p>Mueve el mouse: Claude te sigue con los ojos. Acércate o haz clic.</p>
  </div>
  <div class="claude" id="claude">
    <img src="__IMG__" alt="Claude" draggable="false">
    <svg id="eyes" viewBox="0 0 __W__ __H__" aria-hidden="true"></svg>
  </div>
</main>
<script>
const RIG = __RIG__;
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('eyes');
const box = document.getElementById('claude');
const LOOK = { u: 3.6, v: 2.6 };          // how far the eyes may slide on the face, in mm (eye-shape units)

// one <g> per eye on the face plane; inside it one <polygon> per expression, only one visible at a time
const eyes = RIG.eyes.map(e => {
  const g = document.createElementNS(SVGNS, 'g');
  const inner = document.createElementNS(SVGNS, 'g');
  g.appendChild(inner);
  const shapes = {};
  for (const [kind, sides] of Object.entries(RIG.shapes_mm)) {
    const poly = document.createElementNS(SVGNS, 'polygon');
    poly.setAttribute('points', sides[e.side].map(p => p.join(',')).join(' '));
    poly.setAttribute('fill', RIG.ink);
    poly.style.display = 'none';
    inner.appendChild(poly);
    shapes[kind] = poly;
  }
  svg.appendChild(g);
  const m = [e.ax[0], e.ax[1], e.ay[0], e.ay[1]];
  const det = m[0] * m[3] - m[2] * m[1];
  return { e, g, inner, shapes, m, inv: [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det] };
});

let kind = 'sq', pointer = null, near = false, pressed = false, lastMove = 0;
const pos = { u: 0, v: 0 }, vel = { u: 0, v: 0 };
let blink = 0, nextBlink = performance.now() + 2500, blinkPlan = [];
let squash = 1, squashVel = 0;

function setKind(k) {
  if (k === kind) return;
  kind = k;
  for (const ey of eyes) for (const [name, p] of Object.entries(ey.shapes)) p.style.display = name === k ? '' : 'none';
}
setKind('none'); setKind('sq');

function toSvg(x, y) {
  const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
addEventListener('pointermove', ev => { pointer = toSvg(ev.clientX, ev.clientY); lastMove = performance.now(); });
document.addEventListener('pointerleave', () => { pointer = null; });
box.addEventListener('pointerdown', () => { pressed = true; squashVel -= 2.2; });
addEventListener('pointerup', () => { if (pressed) { pressed = false; squashVel += 4.0; } });

function target(now) {
  // where to look, in face millimetres: towards the pointer, saturating; idle glances when there is none
  if (!pointer || now - lastMove > 6000) {
    const t = now / 1000;
    const k = Math.floor(t / 1.6);
    const r = Math.sin(k * 12.9898) * 43758.5453; const a = (r - Math.floor(r)) * Math.PI * 2;
    return { u: Math.cos(a) * LOOK.u * 0.7, v: Math.sin(a) * LOOK.v * 0.5 };
  }
  const mid = eyes.map(ey => ey.e.c).reduce((a, c) => [a[0] + c[0] / eyes.length, a[1] + c[1] / eyes.length], [0, 0]);
  const dx = pointer.x - mid[0], dy = pointer.y - mid[1];
  const inv = eyes[0].inv;
  let u = inv[0] * dx + inv[2] * dy, v = inv[1] * dx + inv[3] * dy;      // pixels -> face mm
  const d = Math.hypot(u / LOOK.u, v / LOOK.v) || 1;
  const reach = Math.tanh(d / 14);                                      // far pointer = eyes at the edge
  return { u: (u / LOOK.u) / d * reach * LOOK.u, v: (v / LOOK.v) / d * reach * LOOK.v };
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  // eyes: underdamped spring (zeta ~0.65): they overshoot a hair and settle, like an animator's follow-through
  const tg = target(now), k = 260, c = 21;
  for (const a of ['u', 'v']) { vel[a] += (k * (tg[a] - pos[a]) - c * vel[a]) * dt; pos[a] += vel[a] * dt; }
  // near Claude? (pointer within the picture's box around the face)
  if (pointer) {
    const mid = eyes.map(ey => ey.e.c).reduce((a, c) => [a[0] + c[0] / 2, a[1] + c[1] / 2], [0, 0]);
    near = Math.hypot(pointer.x - mid[0], pointer.y - mid[1]) < RIG.near_px;
  } else near = false;
  // blinks: close in 60 ms, hold 50 ms, open in 90 ms; one in five is a double blink
  if (now > nextBlink) {
    blinkPlan = [now, Math.random() < 0.2 ? now + 260 : -1];
    nextBlink = now + 2500 + Math.random() * 3000;
  }
  blink = 0;
  for (const b0 of blinkPlan) {
    if (b0 < 0) continue;
    const t = now - b0;
    if (t >= 0 && t < 200) blink = Math.max(blink, t < 60 ? t / 60 : t < 110 ? 1 : 1 - (t - 110) / 90);
  }
  setKind(pressed ? 'squeeze' : near ? 'happy' : 'sq');
  const sy = kind === 'sq' ? 1 - 0.88 * blink : 1;
  for (const ey of eyes) {
    const [a, b, cc, d] = ey.m, [cx, cy] = ey.e.c;
    ey.g.setAttribute('transform', `matrix(${a} ${b} ${cc} ${d} ${cx} ${cy})`);
    ey.inner.setAttribute('transform', `translate(${pos.u} ${pos.v}) scale(1 ${sy})`);
  }
  // squash and stretch of the whole picture on click (volume kept), plus a slow breath
  const restS = pressed ? 0.9 : 1;
  squashVel += (180 * (restS - squash) - 11 * squashVel) * dt; squash += squashVel * dt;
  const s = squash * (1 + 0.008 * Math.sin(now / 1000 * 2 * Math.PI / 2.4));
  if (RIG.squash !== false) box.style.transform = `scale(${1 / Math.sqrt(s)}, ${s})`;   // a hero picture stays still
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script>
</body>
</html>
'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('png')
    ap.add_argument('rig')
    ap.add_argument('out')
    ap.add_argument('--ink-from', default='')
    ap.add_argument('--ink', default='', help='eye colour, e.g. #35210D (overrides --ink-from)')
    ap.add_argument('--title', default='Claude te mira')
    ap.add_argument('--hero', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    rig = json.load(open(a.rig))
    im = Image.open(a.png)
    ox = oy = 0
    if not a.hero and im.mode == 'RGBA':
        al = np.asarray(im)[..., 3]
        ys, xs = np.where(al > 60)          # ignore the faint far edge of the caught shadow
        pad = int(0.04 * max(im.size))
        x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
        x1, y1 = min(im.width, xs.max() + pad), min(im.height, ys.max() + pad)
        im = im.crop((x0, y0, x1, y1))
        ox, oy = x0, y0
    for e in rig['eyes']:
        e['c'] = [e['c'][0] - ox, e['c'][1] - oy]
    rig['image'] = [im.width, im.height]          # the cropped picture's size (the SVG viewBox)
    if a.ink_from:
        ref = np.asarray(Image.open(a.ink_from).convert('RGB'))
        cols = []
        for e in rig['eyes']:
            cx, cy = int(e['c'][0] + ox), int(e['c'][1] + oy)
            cols.append(np.median(ref[cy - 3:cy + 4, cx - 3:cx + 4].reshape(-1, 3), axis=0))
        c = np.mean(cols, axis=0).astype(int)
        rig['ink'] = '#%02X%02X%02X' % tuple(c)
    if a.ink:
        rig['ink'] = a.ink
    rig['squash'] = not a.hero
    # "near" = within about the face width of the eyes
    ax = rig['eyes'][0]['ax']
    rig['near_px'] = 1.1 * 60 * (ax[0] ** 2 + ax[1] ** 2) ** 0.5
    name = 'claude.png' if not a.hero else 'hero.png'
    im.save(os.path.join(a.out, name))
    html = (HTML.replace('__RIG__', json.dumps(rig)).replace('__IMG__', name).replace('__TITLE__', a.title)
            .replace('__W__', str(im.width)).replace('__H__', str(im.height)).replace('__MODE__', 'full' if a.hero else ''))
    open(os.path.join(a.out, 'index.html'), 'w', encoding='utf-8').write(html)
    json.dump(rig, open(os.path.join(a.out, 'rig.json'), 'w'), indent=1)   # for a React/JS component (site/)
    # a single-file copy (picture inside as base64) to send or preview anywhere
    import base64
    data = base64.b64encode(open(os.path.join(a.out, name), 'rb').read()).decode()
    one = html.replace(f'src="{name}"', f'src="data:image/png;base64,{data}"')
    open(os.path.join(a.out, os.path.basename(os.path.normpath(a.out)) + '_un_archivo.html'), 'w', encoding='utf-8').write(one)
    print('web:', os.path.join(a.out, 'index.html'), f'({im.width}x{im.height}, ink {rig["ink"]})')


if __name__ == '__main__':
    main()
