// First visit: the page opens on Claude's face (#intro, see Intro.jsx and the intro rules in styles.css). Once his
// picture is decoded he pops up, looks at you and winks; when the page under it is ready (fonts, the real sky,
// the real Claude) and the wink has played, the camera pulls back: Claude flies into his place and lands with a
// squash, the blurred sky clears and the page settles from a slight zoom. Scroll, a key or a click skips ahead.
// Shown once per browser (localStorage ps_intro); ?intro shows it again. The head script in index.html decides,
// blocks scrolling meanwhile and preloads Claude's picture.
// introDone resolves when the intro is over (or at once when there is none): heavy extras wait for it.

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
    el.removeEventListener('pointerdown', skip);
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
  addEventListener('introskip', skip);
  el.addEventListener('pointerdown', skip);
  if (window.__introSkip) { go(true); return; }

  const ready = upTo(window.__introReady || Promise.resolve(), 3000);
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
