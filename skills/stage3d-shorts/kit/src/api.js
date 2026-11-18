// KIT / api. Everything a plan may use. A plan imports from this file and from nothing else in the kit.
// Colours are given by name ('white', 'gold', 'red'...): a plan never writes a colour value.
import * as THREE from 'three';
import { PAL, STATION_GAP, prog, clamp01, rng, easeOutCubic, easeOutQuad, easeOutExpo, easeInOutQuad, easeInOutSine, easeOutBack } from './core.js';
import { makeText, makePicture } from './materials.js';
import { makeFigure, makePill, makeCard, makeToken, makeChest, makeRing, animRing, makeCompass, makeCompassStrip, makeFrame, makeDie, makePlayIcon, makeTally, makeGuide } from './parts.js';
import { makePool, makeRays, makeSparks, makeHalo } from './vfx.js';
import { POSE } from './camera.js';
import { registerTick } from './stage.js';

const pal = (name) => { if (!PAL[name]) throw new Error(`unknown colour "${name}" (use ${Object.keys(PAL).join(', ')})`); return PAL[name]; };
// Light given off by glowing things, by colour: what it leaves on the floor (pool), around itself (halo) and in sparks.
const GLOW = {
  red:      { pool: new THREE.Color(0.20, 0.035, 0.03), spark: new THREE.Color(1.5, 0.4, 0.32) },
  gold:     { pool: new THREE.Color(0.16, 0.10, 0.03), halo: new THREE.Color(0.16, 0.10, 0.03), spark: new THREE.Color(1.5, 0.95, 0.3) },
  goldSoft: { pool: new THREE.Color(0.10, 0.065, 0.02), halo: new THREE.Color(0.14, 0.09, 0.028) },
};
const glow = (name, what) => { const c = GLOW[name] && GLOW[name][what]; if (!c) throw new Error(`no ${what} light for "${name}"`); return c; };

// ---- the plan itself
export function definePlan(plan) {
  for (const key of ['name', 'frames', 'build', 'animate', 'camera']) if (plan[key] === undefined) throw new Error(`plan: "${key}" is missing`);
  return plan;
}
export { POSE };
export const stationX = (i) => i * STATION_GAP;        // x of station i, for camera poses written outside build()

// ---- things to put on the stage (position, rotation, scale and visible are yours to set)
export const figure = (opts) => makeFigure(opts);                                // .userData.headTop = height of the top of the head. figure({ headset: false }) = plain
// A black-and-white SVG or PNG of the plan folder, drawn as light: import art from './art.svg', then picture(art, width, height).
export const picture = (url, width, height, colour = 'white') => makePicture(url, width, height, pal(colour));
export const pill = (text, colour = 'white', height = 0.34) => makePill(text, pal(colour), height);
// A text only redraws its texture when the text really changes, so a plan can call set() on every frame.
const cached = (t) => { let last = null; const draw = t.set; t.set = (text) => { if (text !== last) { last = text; draw(text); } }; return t; };
export const card = (colour, label, value, opts = {}) => { const c = makeCard(pal(colour), label, value, opts); cached(c.val); cached(c.lab); return c; };   // -> { group, frame, lab, val }; val.set(text)
export const token = () => makeToken();
// chest(): the gold hero chest. chest('grey', { simple: true }): a plain one for a crowd of chests in the background.
export const chest = (colour = 'gold', opts = {}) => makeChest(pal(colour), opts);
// A round compass with a needle (radius 1: scale it). The needle may have its own colour. Turn it with turnNeedle.
export const compass = (colour = 'white', needle = colour) => makeCompass(pal(colour), pal(needle));
export const compassStrip = (colour = 'white') => makeCompassStrip(pal(colour));           // the strip at the top of a game screen, 4 wide
export const frame = (colour, width, height, radius) => makeFrame(pal(colour), width, height, radius);   // rounded outline: a screen, a thumbnail
export const die = (colour = 'white', size) => makeDie(pal(colour), size);
export const playIcon = (colour = 'white', radius) => makePlayIcon(pal(colour), radius);
export const tally = (colour = 'white', height) => makeTally(pal(colour), height);            // one group of five hand-drawn strokes
export const guide = (colour, length, opts) => makeGuide(pal(colour), length, opts);        // dashed line along +x, 0 to length
export const ring = (colour) => makeRing(pal(colour));
export const label = (text, colour = 'white', opts = {}) => cached(makeText(text, pal(colour), opts));   // -> { mesh, set(text) }
export const pool = (colour, width, depth) => makePool(glow(colour, 'pool'), width, depth);
export const halo = (colour, size) => makeHalo(glow(colour, 'halo'), size);
export const rays = () => { const m = makeRays(); registerTick(m.material); return m; };
export const sparks = (colour, count, seed, opts) => { const m = makeSparks(count, seed, glow(colour, 'spark'), opts); registerTick(m.material); return m; };

// ---- moving them, frame by frame
// Pop in with a small overshoot: n frames from f0. s = overshoot, k = final scale.
export function pop(obj, f, f0, n = 8, s = 1.2, k = 1) { const t = prog(f, f0, n); obj.visible = t > 0; obj.scale.setScalar(Math.max(0.001, k * easeOutBack(t, s))); }
// A floor ring fires at f0, grows to rMax in 14 frames and is gone by frame 17.
export const pulse = (ringObj, f, f0, rMax) => animRing(ringObj, f, f0, rMax);
// Brightness of the lines of an object (1 = normal). Use it for a short flare when something lands.
export function flare(obj, v) { obj.traverse((o) => { if (o.material && o.material.uniforms.uGain) o.material.uniforms.uGain.value = v; }); }
// Strength of one light-like thing (pool, halo, rays, a text mesh): 0 = off, 1 = full.
export function level(obj, v) { obj.material.uniforms.uOpacity.value = v; }
// Push a whole object back in the brightness ladder (0.22 = background, 0.55 = secondary, 1 = normal).
export function dim(obj, v) { obj.traverse((o) => { if (o.material && o.material.uniforms.uGain) o.material.uniforms.uGain.value = v; if (o.material && o.material.uniforms.uOpacity) o.material.uniforms.uOpacity.value = v; }); }
// Chest: lid angle (0 = shut, 1 = open) and the light inside (lit 0..1, fade 0..1).
export function openLid(chestObj, amount) { chestObj.userData.lid.rotation.x = -1.32 * amount; }
export function lightChest(chestObj, lit, fade = 1) { chestObj.userData.inner.uniforms.uOpacity.value = lit * fade * 0.55; chestObj.userData.fill.uniforms.uOpacity.value = 1 + 1.6 * lit * fade; }
// Compass needle: 0 = pointing up, positive = anticlockwise (radians).
export function turnNeedle(compassObj, angle) { compassObj.userData.needle.rotation.z = angle; }
// The opposite of pop: shrink away in n frames from f0. Call it after pop() in the same frame.
export function leave(obj, f, f0, n = 6) { const t = prog(f, f0, n); if (t <= 0) return; obj.scale.multiplyScalar(Math.max(0.001, 1 - easeOutCubic(t))); if (t >= 1) obj.visible = false; }
export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// ---- time and randomness (never Math.random or the clock: every frame must come out the same every time)
export { prog, clamp01, rng, easeOutCubic, easeOutQuad, easeOutExpo, easeInOutQuad, easeInOutSine, easeOutBack };
