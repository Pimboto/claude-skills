// KIT / captions. One word at a time, fixed to the screen at 78.9 % of the height (measured).
// The first frame of a word is dimmer; key words take a colour, land bigger and settle.
import { W, H, S, FPS } from './core.js';
import { FONT } from './fonts.js';

const CAPTION_COLOUR = { gold: '#FBC459', red: '#FF6451' };       // measured caption gold and red
let words = [], colourOf = {};

// raw: [{ w, t0, t1, line }] in seconds, as the speech recognition gives them. keywords: { word: 'gold' | 'red' }.
export function setWords(raw, keywords = {}) {
  words = []; colourOf = {};
  for (const [word, name] of Object.entries(keywords)) {
    if (!CAPTION_COLOUR[name]) throw new Error(`captions: keyword "${word}" asks for colour "${name}"; use gold or red`);
    colourOf[word] = CAPTION_COLOUR[name];
  }
  for (const w of raw) {
    if (w.w.startsWith(',') && words.length) { const p = words[words.length - 1]; p.w += w.w; p.t1 = w.t1; continue; }   // "$10" + ",000."
    words.push({ ...w });
  }
  words.forEach((w, i) => { w.w = w.w.replace(/[.,]+$/, ''); const nx = words[i + 1];
    w.f0 = Math.round(w.t0 * FPS); w.f1 = nx && nx.line === w.line ? Math.round(nx.t0 * FPS) : Math.round((w.t1 + 0.12) * FPS); });
  return words.map((w) => ({ w: w.w, f0: w.f0, f1: w.f1, line: w.line, key: !!colourOf[w.w] }));
}

export function drawCaption(octx, f) {
  const w = words.find((x) => f >= x.f0 && f < x.f1); if (!w) return;
  octx.save();
  octx.font = `700 ${Math.round(62 * S)}px "${FONT}"`; octx.textAlign = 'center'; octx.textBaseline = 'middle';
  octx.globalAlpha = f === w.f0 ? 0.5 : 1;                                        // the first frame of a word is dimmer
  const age = f - w.f0, key = !!colourOf[w.w];
  const sc = key ? 1 + 0.24 * Math.exp(-age / 1.7) : 1 + 0.07 * Math.exp(-age / 1.2);     // key words land bigger and settle
  octx.translate(W / 2, H * 0.789); octx.scale(sc, sc); octx.translate(-W / 2, -H * 0.789);
  octx.shadowColor = 'rgba(0,0,0,0.9)'; octx.shadowBlur = 18; octx.shadowOffsetY = 3;
  octx.fillStyle = colourOf[w.w] || '#FFFFFF';
  octx.shadowBlur = 46; octx.shadowOffsetY = 0; octx.fillText(w.w, W / 2, H * 0.789);          // wide dark halo: the word must read over bright lines
  octx.shadowBlur = 18; octx.shadowOffsetY = 3; octx.fillText(w.w, W / 2, H * 0.789);
  octx.restore();
}
