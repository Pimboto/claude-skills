// First visit: the page opens on Claude's face (#intro, see Intro.jsx and the intro rules in styles.css). Once his
// picture is decoded he pops up, looks at you and winks; when the page under it is ready (fonts, the real sky,
// the real Claude) and the wink has played, the camera pulls back: Claude flies into his place and lands with a
// squash, the blurred sky clears and the page settles from a slight zoom. Scroll or a key skips ahead; so does a
// second tap (the first one squishes Claude and turns the sound on).
// Shown once per browser (localStorage ps_intro); ?intro shows it again. The head script in index.html decides,
// blocks scrolling meanwhile and preloads Claude's picture.
// introDone resolves when the intro is over (or at once when there is none): heavy extras wait for it.
// Sounds (cuelume, fx.js): nothing can sound before the visitor taps or clicks, so a tap during the intro squishes
// Claude with his bubble sound and the rest plays with sound: a ding on the wink, a swoosh, a tap as he lands.
import { withSound, preloadSound, INTRO_CUES } from './fx.js';

const ENTER = 700;               // the CSS timeline: pop-up, then a loop whose first part is the wink
const CYCLE = 2600;
const WINK_END = 0.29 * CYCLE;  // the '<' is gone and the eye is reopening: the flight can start

const html = typeof document !== 'undefined' ? document.documentElement : null;
let finish = () => {};
export const introDone = !html || !html.classList.contains('intro-on')
  ? Promise.resolve()
  : new Promise((r) => { finish = r; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const upTo = (p, ms) => Promise.race([p, sleep(ms)]);
const loaded = (img) => (img ? upTo((img.decode ? img.decode() : Promise.resolve()).catch(() => {}), 3000) : null);

// the page's own sky (preloaded in the head, the one whose media query matches)
function pageSky() {
  const l = [...document.querySelectorAll('link[rel="preload"][as="image"][media]')].find((x) => matchMedia(x.media).matches);
  if (!l) return null;
  return upTo(new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = l.href; }), 3000);
}

// until the first wink has played and no wink is playing (the animation's own clock: it starts on the next
// frame drawn after intro-ready, which can be a few hundred ms later)
async function afterWink(el) {
  const anim = el.querySelector('.intro-body')?.getAnimations()[0];
  if (!anim) return;
  await anim.ready;
  const t = Number(anim.currentTime) - ENTER;
  if (t < WINK_END) return sleep(WINK_END - t);
  const phase = t % CYCLE;
  if (phase < WINK_END) await sleep(WINK_END - phase);
}

// ms until the next wink (the '<' pops in at 10% of the loop), on the wink animation's own clock
async function untilWink(el) {
  const anim = el.querySelector('.intro-body')?.getAnimations()[0];
  if (!anim) return null;
  await anim.ready;
  const t = Number(anim.currentTime) - ENTER - 0.1 * CYCLE;
  return t < 0 ? -t : CYCLE - (t % CYCLE);
}

let started = false;
export function runIntro() {
  if (started) return;
  started = true;
  const el = document.getElementById('intro');
  if (!el || !html.classList.contains('intro-on')) { end(el); return; }
  window.__intro = true;         // the head script's safety timer stands down
  try { localStorage.setItem('ps_intro', '1'); } catch { /* private mode */ }

  let going = false;
  const go = async (fast) => {
    if (going) return;
    going = true;
    removeEventListener('introskip', skip);
    el.removeEventListener('pointerdown', onTap);
    const root = document.getElementById('root');
    const sky = el.querySelector('.intro-sky');
    if (!html.classList.contains('intro-ready')) {     // Claude never showed: just clear the sky
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' }).finished;
      return end(el);
    }
    // the loops finish the cycle they are in (the eye reopens in flight) and do not start another
    for (const a of el.getAnimations({ subtree: true })) {
      const t = a.effect?.getComputedTiming();
      if (t?.iterations === Infinity) a.effect.updateTiming({ iterations: (t.currentIteration ?? 0) + 1 });
    }
    const claude = el.querySelector('.intro-claude');
    const A = claude.getBoundingClientRect();
    const B = document.querySelector('.hero-claude').getBoundingClientRect();
    const r = root.getBoundingClientRect();
    const s = B.width / A.width;
    // Claude scaled by (sx, sy), standing where the real one stands (bottom centre on bottom centre)
    const at = (sx, sy) => `translate(${B.left + B.width / 2 - (A.width * sx) / 2 - A.left}px, ${B.bottom - A.height * sy - A.top}px) scale(${sx}, ${sy})`;
    const D = fast ? 600 : 1150;
    const t0 = performance.now();
    withSound(() => {
      const late = performance.now() - t0;
      if (late < 250) INTRO_CUES.fly();
      if (D * 0.76 - late > -100) setTimeout(INTRO_CUES.land, Math.max(0, D * 0.76 - late));
    });
    const fly = claude.animate([
      { offset: 0, transform: 'none', easing: 'cubic-bezier(0.6, 0, 0.25, 1)' },
      { offset: 0.76, transform: at(s, s), easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
      { offset: 0.86, transform: at(s * 1.07, s * 0.9), easing: 'cubic-bezier(0.4, 0, 0.4, 1)' },
      { offset: 0.94, transform: at(s * 0.98, s * 1.03), easing: 'ease-out' },
      { offset: 1, transform: at(s, s) },
    ], { duration: D, fill: 'forwards' });
    sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.6, delay: D * 0.12, easing: 'ease-in-out', fill: 'forwards' });
    root.style.transformOrigin = `${B.left + B.width / 2 - r.left}px ${B.top + B.height / 2 - r.top}px`;
    root.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: D * 0.76, easing: 'cubic-bezier(0.6, 0, 0.25, 1)' });
    await fly.finished;
    root.style.transformOrigin = '';
    end(el);
  };
  const skip = () => go(true);
  let tapped = false;
  const onTap = () => {
    if (tapped || !html.classList.contains('intro-ready')) return skip();
    tapped = true;
    el.querySelector('.intro-pop').animate([{ scale: '1' }, { scale: '1.07 0.9' }, { scale: '0.97 1.04' }, { scale: '1' }],
      { duration: 420, easing: 'ease-out' });
    withSound(async () => {
      INTRO_CUES.tap();
      const d = await untilWink(el);
      if (d !== null) setTimeout(() => { if (!going) INTRO_CUES.wink(); }, d);
    });
  };
  addEventListener('introskip', skip);
  el.addEventListener('pointerdown', onTap);
  if (window.__introSkip) { go(true); return; }

  const ready = upTo(window.__introReady || Promise.resolve(), 3000);
  // the sound code, when the browser has a moment, so a tap can sound at once
  ready.then(() => (window.requestIdleCallback || setTimeout)(preloadSound, { timeout: 1500 }));
  Promise.all([
    ready,
    upTo(document.fonts?.ready, 1500),
    pageSky(),
    loaded(document.querySelector('.hero-claude img')),
  ]).then(() => ready).then(() => afterWink(el)).then(() => go(false));
}

function end(el) {
  html.classList.remove('intro-on', 'intro-ready');
  el?.remove();
  window.__introUnblock?.();
  finish();
}
