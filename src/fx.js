// Sound (cuelume: interaction sounds synthesized live, no audio files) and smooth scroll (Lenis), in one place.
// Cues are picked by their job, as cuelume's guide says: select for lists and tabs, open/close for the dialog,
// success/error for outcomes, and the playful "bubble" theme only for one moment: squeezing Claude.
import { bind, play, setEnabled, unlock } from 'cuelume';
import Lenis from 'lenis';

const KEY = 'ps_sound';
const stored = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
let soundOn = stored();
setEnabled(soundOn);

export const isSoundOn = () => soundOn;
export async function setSound(on) {
  soundOn = on;
  setEnabled(on);
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  if (on) { await unlock(); play('toggle', { direction: 'forward' }); }
}

export const cue = (name, options) => { if (soundOn) play(name, options); };
export const squeezeClaude = () => cue('tap', { theme: 'bubble', emphasis: 'strong' });
export const releaseClaude = () => cue('select', { theme: 'bubble' });

let lenis = null;
export function startFx() {
  const unbind = bind();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lenis = reduce ? null : new Lenis({ autoRaf: true, anchors: { offset: -12 }, lerp: 0.09 });
  return () => { unbind(); lenis?.destroy(); lenis = null; };
}
// the download dialog freezes the page behind it
export const lockScroll = (locked) => { if (lenis) (locked ? lenis.stop() : lenis.start()); };
