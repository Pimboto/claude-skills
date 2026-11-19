import { useEffect, useRef } from 'react';

// Claude rendered in Blender without eyes; its eyes are SVG shapes drawn on the face plane (rig from toy-loops'
// tools/web_eyes.py: pixel centre of each eye + face axes in pixels per mm), so they sit in perspective.
// They follow the pointer with an underdamped spring, blink, go ^ ^ when you come close and > < while you press.
// Temper: quick clicks get a flat -_- look; keep going and he gets angry (slanted eyes, a vein, a red face, a
// shake), hops off to the right, stays away a moment, peeks back in from the edge and hops home, still a bit -_-.
// onMood(name) hears each step (angry, hop, leave, peek, back) for sounds.
const LOOK = { u: 3.6, v: 2.6 }; // how far the eyes slide on the face, in mm
const ANNOYED_AT = 3, ANGRY_AT = 6, CLICK_WINDOW = 3000; // clicks within the window

// angry eyes: the square eye with its top cut down toward the nose (mm, y up; the left eye's nose side is +x)
const ANGRY = {
  left: [[-3.3, -4.6], [3.3, -4.6], [3.3, 0.2], [-3.3, 4.6]],
  right: [[-3.3, -4.6], [3.3, -4.6], [3.3, 4.6], [-3.3, 0.2]],
};

export default function WatchingClaude({ src, srcSet, sizes, rig, className = '', squashOnClick = true, onPress, onRelease, onMood }) {
  const cb = useRef({});
  cb.current = { onPress, onRelease, onMood };
  const shapes = { ...rig.shapes_mm, angry: ANGRY };
  const boxRef = useRef(null);
  const svgRef = useRef(null);
  const eyeRefs = useRef([]);

  useEffect(() => {
    const svg = svgRef.current;
    const box = boxRef.current;
    const eyes = rig.eyes.map((e, i) => {
      const m = [e.ax[0], e.ax[1], e.ay[0], e.ay[1]];
      const det = m[0] * m[3] - m[2] * m[1];
      const { outer, inner, shapes } = eyeRefs.current[i];
      return { e, m, inv: [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det], outer, inner, shapes };
    });
    const mid = [(eyes[0].e.c[0] + eyes[1].e.c[0]) / 2, (eyes[0].e.c[1] + eyes[1].e.c[1]) / 2];
    let kind = '';
    const setKind = (k) => {
      if (k === kind) return;
      kind = k;
      for (const ey of eyes) for (const [name, p] of Object.entries(ey.shapes)) p.style.display = name === k ? '' : 'none';
    };
    setKind('sq');

    let pointer = null, lastMove = 0, pressed = false;
    const pos = { u: 0, v: 0 }, vel = { u: 0, v: 0 };
    let nextBlink = performance.now() + 2200, blinks = [];
    let squash = 1, squashVel = 0;

    const toSvg = (x, y) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = x; pt.y = y;
      return pt.matrixTransform(ctm.inverse());
    };
    // temper (see the top of the file)
    let mood = null, moodUntil = 0, look = null, busy = false;
    const clicks = [];
    const setMood = (m, ms = Infinity) => { mood = m; moodUntil = performance.now() + ms; };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // hops along x (px): a lift and a lean toward where he goes on each, a squash on every landing
    const hop = (from, to, hops, ms) => {
      const dir = Math.sign(to - from) || 1;
      const frames = [];
      for (let i = 0; i <= hops * 2; i++) {
        const up = i % 2 === 1;
        frames.push({ translate: `${from + ((to - from) * i) / (hops * 2)}px ${up ? -8 : 0}%`, rotate: `${up ? dir * 6 : 0}deg`, easing: up ? 'ease-in' : 'ease-out' });
      }
      for (let k = 1; k <= hops; k++) setTimeout(() => { squashVel -= 1.5; cb.current.onMood?.('hop'); }, (ms * k) / hops);
      return box.animate(frames, { duration: ms, fill: 'forwards' }).finished;
    };
    const fade = (a, b, ms) => box.animate([{ opacity: a }, { opacity: b }], { duration: ms, fill: 'forwards' }).finished;
    const tantrum = async () => {
      busy = true;
      clicks.length = 0;
      setMood('angry');
      look = { u: 0, v: 0 };
      box.classList.add('is-angry');
      cb.current.onMood?.('angry');
      squashVel -= 3;
      await box.animate([0, -7, 7, -6, 6, -4, 4, 0].map((x) => ({ translate: `${x}px 0` })), { duration: 560 }).finished;
      await wait(300);
      look = { u: LOOK.u, v: 0 };                      // looks where he is going
      await wait(260);
      const r = box.getBoundingClientRect();
      const away = window.innerWidth - r.left + 40;     // just past the right edge of the window
      cb.current.onMood?.('leave');
      await (reduce ? fade(1, 0, 400) : hop(0, away, 5, 1500));
      box.classList.remove('is-angry');
      setMood('line');
      await wait(2600);
      const peek = window.innerWidth - r.left - r.width * 0.42;   // back in from the edge, looking for you
      look = { u: -LOOK.u, v: 0 };
      cb.current.onMood?.('peek');
      if (!reduce) {
        await box.animate([{ translate: `${away}px 0` }, { translate: `${peek}px 0` }],
          { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' }).finished;
        await wait(1100);
      }
      setMood(null);
      cb.current.onMood?.('back');
      if (reduce) { box.getAnimations().forEach((a) => a.cancel()); await fade(0, 1, 400); }
      else await hop(peek, 0, 4, 1250);
      box.getAnimations().forEach((a) => a.cancel());
      look = null;
      setMood('line', 1600);                           // still a little -_-
      busy = false;
    };

    const onMove = (ev) => { pointer = toSvg(ev.clientX, ev.clientY); lastMove = performance.now(); };
    const onLeave = () => { pointer = null; };
    const onDown = () => {
      if (busy) return;
      pressed = true; squashVel -= 2.2; cb.current.onPress?.();
      const now = performance.now();
      clicks.push(now);
      while (now - clicks[0] > CLICK_WINDOW) clicks.shift();
      if (clicks.length >= ANGRY_AT) { pressed = false; tantrum(); }
      else if (clicks.length >= ANNOYED_AT) setMood('line', 1400);
    };
    const onUp = () => { if (pressed) { pressed = false; squashVel += 4.0; cb.current.onRelease?.(); } };
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    box.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    const target = (now) => {
      if (look) return look;
      if (!pointer || now - lastMove > 6000) {           // idle: glance around on its own
        const k = Math.floor(now / 1600);
        const r = Math.sin(k * 12.9898) * 43758.5453;
        const a = (r - Math.floor(r)) * Math.PI * 2;
        return { u: Math.cos(a) * LOOK.u * 0.7, v: Math.sin(a) * LOOK.v * 0.5 };
      }
      const dx = pointer.x - mid[0], dy = pointer.y - mid[1];
      const inv = eyes[0].inv;
      const u = inv[0] * dx + inv[2] * dy, v = inv[1] * dx + inv[3] * dy;   // pixels -> face mm
      const d = Math.hypot(u / LOOK.u, v / LOOK.v) || 1;
      const reach = Math.tanh(d / 14);
      return { u: (u / LOOK.u) / d * reach * LOOK.u, v: (v / LOOK.v) / d * reach * LOOK.v };
    };

    let raf, prev = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const tg = target(now);
      for (const a of ['u', 'v']) { vel[a] += (260 * (tg[a] - pos[a]) - 21 * vel[a]) * dt; pos[a] += vel[a] * dt; }
      const near = pointer && Math.hypot(pointer.x - mid[0], pointer.y - mid[1]) < rig.near_px;
      if (now > nextBlink) {
        blinks = [now, Math.random() < 0.2 ? now + 260 : -1];
        nextBlink = now + 2500 + Math.random() * 3000;
      }
      let blink = 0;
      for (const b0 of blinks) {
        if (b0 < 0) continue;
        const t = now - b0;
        if (t >= 0 && t < 200) blink = Math.max(blink, t < 60 ? t / 60 : t < 110 ? 1 : 1 - (t - 110) / 90);
      }
      const m = mood && now < moodUntil ? mood : null;
      setKind(m === 'angry' ? 'angry' : pressed ? 'squeeze' : m || (near ? 'happy' : 'sq'));
      const sy = kind === 'sq' ? 1 - 0.88 * blink : 1;
      for (const ey of eyes) {
        const [a, b, c, d] = ey.m;
        ey.outer.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${ey.e.c[0]} ${ey.e.c[1]})`);
        ey.inner.setAttribute('transform', `translate(${pos.u} ${pos.v}) scale(1 ${sy})`);
      }
      if (squashOnClick) {
        squashVel += (180 * ((pressed ? 0.9 : 1) - squash) - 11 * squashVel) * dt;
        squash += squashVel * dt;
        const s = squash * (1 + 0.008 * Math.sin((now / 1000) * 2 * Math.PI / 2.4));
        box.style.transform = `scale(${1 / Math.sqrt(s)}, ${s})`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      box.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [rig, squashOnClick]);

  const [w, h] = rig.image;
  return (
    <div ref={boxRef} className={`watching-claude ${className}`}>
      <img src={src} srcSet={srcSet} sizes={sizes} alt="Claude, a small paper block with four legs, looking at you" draggable="false" width={w} height={h} />
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {rig.eyes.map((e, i) => (
          <g key={e.side} ref={(el) => { if (el) eyeRefs.current[i] = { ...(eyeRefs.current[i] || {}), outer: el }; }}>
            <g ref={(el) => { if (el) eyeRefs.current[i] = { ...(eyeRefs.current[i] || {}), inner: el, shapes: eyeRefs.current[i]?.shapes || {} }; }}>
              {Object.entries(shapes).map(([k, sides]) => (
                <polygon
                  key={k}
                  points={sides[e.side].map((p) => p.join(',')).join(' ')}
                  fill={rig.ink}
                  style={{ display: k === 'sq' ? '' : 'none' }}
                  ref={(el) => { if (el) { eyeRefs.current[i] = eyeRefs.current[i] || {}; eyeRefs.current[i].shapes = { ...(eyeRefs.current[i].shapes || {}), [k]: el }; } }}
                />
              ))}
            </g>
          </g>
        ))}
      </svg>
      {/* the anime anger vein, shown while he is angry */}
      <svg className="vein" viewBox="0 0 40 40" aria-hidden="true">
        <g fill="none" stroke="#e5484d" strokeWidth="5" strokeLinecap="round">
          <path d="M16 4Q16 16 4 16" /><path d="M24 4Q24 16 36 16" /><path d="M4 24Q16 24 16 36" /><path d="M36 24Q24 24 24 36" />
        </g>
      </svg>
    </div>
  );
}
