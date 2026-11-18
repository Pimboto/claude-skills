// KIT / core. Sizes, palette, renderer, shared uniforms and small math helpers. Everything else builds on this file.
// Part of the look: a plan never imports this file (plans import only src/api.js).
// Numbers tagged "measured" come from the analysis of the reference; numbers tagged "guess" are not measured.
import * as THREE from 'three';

export const W = 1080, H = 1920, FPS = 30;
export const S = W / 720;                       // scale from the reference size to ours
export const FIG_H = 1.7;                       // figure height in metres (scale guess from camera.md)
export const FOV = 80;                          // estimate: in the reference orbit a card's near edge is 1.44x its far edge, which needs a wide lens
                                         // close to the subject (somewhere between 55 and 72 degrees; not pinned down)
export const CAM_DIST = 6.0, CAM_H = 1.5;       // typical distance with the 80 degree lens (figure about 17 % of the frame height)
export const FEET_Y = 0.70;                     // feet at 70 % of the frame height (measured 68-76 %)

export const STATION_GAP = 14.0;                // far enough apart that one station is not seen from the other during an orbit
export const FADE_LEN = 0.046 * FIG_H;          // measured: mirror fades with e-folding 0.046 x figure height

export const lin = (hex) => new THREE.Color(hex);   // sRGB hex -> linear working colour
// Palette (measured, color.md). Core = what the line looks like; glow = the chromaticity its halo has.
export const PAL = {
  white:    { core: lin(0xffffff), glow: lin(0xffffff) },
  grey:     { core: lin(0xffffff).multiplyScalar(0.26), glow: lin(0xffffff).multiplyScalar(0.26) }, // ground line: 0.55 display
  dim:      { core: lin(0xffffff).multiplyScalar(0.10), glow: lin(0xffffff).multiplyScalar(0.10) }, // 0.35 display
  gold:     { core: lin(0xfff992), glow: new THREE.Color(1.55, 0.98, 0.30) },                        // halo is amber (hue 38 deg)
  goldSoft: { core: lin(0xfbe87e), glow: new THREE.Color(1.20, 0.82, 0.31) },
  red:      { core: lin(0xff8a80), glow: new THREE.Color(1.15, 0.29, 0.23) },
};
export const BG = lin(0x050505);                // measured: lifted black, Y code 20

// Easing
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const prog = (f, f0, dur) => clamp01((f - f0) / dur);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = (t, s = 1.2) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

// Deterministic random numbers (no Math.random: every render of a frame must be identical)
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------------------------------------------------------------
// 1. Renderer and shared uniforms
// ---------------------------------------------------------------------------------------------------------------------
export const canvas = document.getElementById('gl');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
// Say once which graphics backend is drawing (software or a real GPU): it explains the render time on each machine.
{ const g = renderer.getContext(), e = g.getExtension('WEBGL_debug_renderer_info');
  console.warn('[stage3d] WebGL renderer: ' + (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER))); }
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // the last pass encodes to sRGB itself
renderer.autoClear = false;

// Uniforms every material shares; a render pass changes them once for the whole scene.
export const U = {
  uRes: { value: new THREE.Vector2(W, H) },
  uMinPx: { value: 3.0 * S },        // measured: lines never get thinner than about 3 px at 720p
  uMirror: { value: 0 },             // 1 while drawing the floor reflection
  uGlowPass: { value: 0 },           // 1 while drawing the glow source
  uBlack: { value: 0 },              // 1 = solids draw black (they only hide what is behind them)
  uFadeLen: { value: FADE_LEN },
};

export const world = new THREE.Group();     // everything that lives in the 3D scene
export const scene = new THREE.Scene();
scene.add(world);
export const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);

// Object classes. They decide which passes draw an object.
export const LINE = 'line', SOLID = 'solid', FX = 'fx';
export const tagged = [];
export function tag(obj, cls, noMirror = false) { obj.userData.cls = cls; obj.userData.noMirror = noMirror; tagged.push(obj); return obj; }
