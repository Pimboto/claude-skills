// First visit: the page opens on Claude's face (the #intro layer, already winking from the first paint), and once
// the app is up and the wink has played, the camera pulls back: Claude shrinks into his place on the page, the
// blurred sky clears and the page settles from a slight zoom. A click, key or scroll skips ahead.
// Shown once per browser (localStorage ps_intro); ?intro shows it again. The head script in index.html decides.
import { lockScroll } from './fx.js';

const CYCLE = 2800;              // the CSS wink loop (styles.css, .intro)
const WINK = [0.2, 0.5];         // the part of the loop where the wink happens
let started = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// wait until the wink is not playing, and at least one wink has been seen
function afterWink(el) {
  const anim = el.querySelector('.winks')?.getAnimations()[0];
  const t = Number(anim?.currentTime) || 0;
  if (t < WINK[1] * CYCLE) return sleep(WINK[1] * CYCLE - t);
  const phase = t % CYCLE;
  return phase > WINK[0] * CYCLE && phase < WINK[1] * CYCLE ? sleep(WINK[1] * CYCLE - phase) : Promise.resolve();
}

export function runIntro() {
  if (started) return;
  started = true;
  const html = document.documentElement;
  const el = document.getElementById('intro');
  if (!el || !html.classList.contains('intro-on')) { html.classList.remove('intro-on'); el?.remove(); return; }
  window.__intro = true;         // the head script's safety timer stands down
  try { localStorage.setItem('ps_intro', '1'); } catch { /* private mode */ }
  lockScroll(true);

  let going = false;
  const go = async (fast) => {
    if (going) return;
    going = true;
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((n) => window.removeEventListener(n, skip));
    const claude = el.querySelector('.intro-claude');
    const sky = el.querySelector('.intro-sky');
    const root = document.getElementById('root');
    const target = document.querySelector('.hero-claude');
    const a = claude.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    const D = fast ? 560 : 1150;
    const ease = 'cubic-bezier(0.65, 0, 0.2, 1)';
    root.style.transformOrigin = `${b.left + b.width / 2 - r.left}px ${b.top + b.height / 2 - r.top}px`;
    const fly = claude.animate(
      [{ transform: 'none' }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})` }],
      { duration: D, easing: ease, fill: 'forwards' },
    );
    sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D * 0.7, delay: D * 0.12, easing: 'ease-in-out', fill: 'forwards' });
    root.animate([{ transform: 'scale(1.16)' }, { transform: 'none' }], { duration: D, easing: ease });
    await fly.finished;
    html.classList.remove('intro-on');
    el.remove();
    root.style.transformOrigin = '';
    lockScroll(false);
  };
  const skip = () => go(true);
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((n) => window.addEventListener(n, skip, { passive: true }));

  const fonts = Promise.race([document.fonts?.ready, sleep(1500)]);
  Promise.all([fonts, afterWink(el)]).then(() => go(false));
}
