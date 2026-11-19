// Sound (cuelume: interaction sounds synthesized live, no audio files) and smooth scroll (Lenis), in one place.
// Cues are picked by their job, as cuelume's guide says: select for lists and tabs, open/close for the dialog,
// success/error for outcomes, and the playful "bubble" theme only for one moment: squeezing Claude.
// cuelume is loaded after the page is up (it is a third of the code and nothing can sound before a click anyway).
import Lenis from 'lenis';

const KEY = 'ps_sound';
const stored = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
let soundOn = typeof window !== 'undefined' && stored();
let sound = null;           // the cuelume module, once loaded
let loading = null;
const loadSound = () => (loading ||= import('cuelume').then((m) => { m.setEnabled(soundOn); sound = m; return m; }));

export const isSoundOn = () => soundOn;
export async function setSound(on) {
  soundOn = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  const m = await loadSound();
  m.setEnabled(on);
  if (on) { await m.unlock(); m.play('toggle', { direction: 'forward' }); }
}

export const cue = (name, options) => { if (soundOn && sound) sound.play(name, options); };
export const squeezeClaude = () => cue('tap', { theme: 'bubble', emphasis: 'strong' });
export const releaseClaude = () => cue('select', { theme: 'bubble' });

let lenis = null;
export function startFx() {
  let unbind = null, gone = false;
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => loadSound().then((m) => { if (!gone) unbind = m.bind(); }));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lenis = reduce ? null : new Lenis({ autoRaf: true, anchors: { offset: -12 }, lerp: 0.09 });
  return () => { gone = true; unbind?.(); lenis?.destroy(); lenis = null; };
}
// the download dialog freezes the page behind it
export const lockScroll = (locked) => { if (lenis) (locked ? lenis.stop() : lenis.start()); };
