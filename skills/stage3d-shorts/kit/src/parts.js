// KIT / parts. The things a scene is made of: figure, label pill, card, token, chest, compass (dial and screen strip),
// outline frame, die, play button, tally, dashed guide, floor ring, ground line, specks.
// To add a prop: build it from LineSet lines (and fillMat faces if it needs volume), return a THREE.Group or Mesh,
// and export a plan-facing wrapper for it in api.js. Do not invent new materials or colours here.
import * as THREE from 'three';
import { FIG_H, PAL, tag, SOLID, LINE, FX, U, W, H, FOV, CAM_DIST, rng, clamp01, easeOutCubic } from './core.js';
import { LineSet, roundRect, QUAD_CORNERS, QUAD_INDEX } from './lines.js';
import { solidMat, softMat, makeText, fillMat, ADDITIVE } from './materials.js';

// ---------------------------------------------------------------------------------------------------------------------
// 4. Scene parts
// ---------------------------------------------------------------------------------------------------------------------
// 4.1 The pill person: a flat upright cut-out fixed in the world (measured on 81 instances, characters.md).
// headset: false leaves the accessory out (a plain figure, for a logo or a profile picture).
export function makeFigure({ headset = true } = {}) {
  const g = new THREE.Group(), Hh = FIG_H;
  const HEAD_R = 0.164 * Hh, GAP = 0.056 * Hh, BODY_H = 0.621 * Hh, BODY_W = 0.512 * Hh, TOP_R = 0.43 * BODY_W, BOT_R = 0.03 * Hh;
  const s = new THREE.Shape(), w = BODY_W / 2, h = BODY_H;
  s.moveTo(-w + BOT_R, 0); s.lineTo(w - BOT_R, 0); s.quadraticCurveTo(w, 0, w, BOT_R);
  s.lineTo(w, h - TOP_R); s.absarc(w - TOP_R, h - TOP_R, TOP_R, 0, Math.PI / 2, false);
  s.lineTo(-w + TOP_R, h); s.absarc(-w + TOP_R, h - TOP_R, TOP_R, Math.PI / 2, Math.PI, false);
  s.lineTo(-w, BOT_R); s.quadraticCurveTo(-w, 0, -w + BOT_R, 0);
  const mat = solidMat(PAL.white); mat.uniforms.uTopLight.value = 1;
  const body = tag(new THREE.Mesh(new THREE.ShapeGeometry(s, 24), mat), SOLID);
  const headY = BODY_H + GAP + HEAD_R;
  const head = tag(new THREE.Mesh(new THREE.CircleGeometry(HEAD_R, 64), mat), SOLID); head.position.y = headY;
  g.add(body, head);
  // Our own accessory (not the reference's tie): a headset. Two ear cups and a band over the head.
  const cup = new THREE.Shape(); const cw = 0.045 * Hh, ch = 0.105 * Hh, cr = 0.02 * Hh;
  cup.moveTo(-cw / 2 + cr, -ch / 2); cup.lineTo(cw / 2 - cr, -ch / 2); cup.quadraticCurveTo(cw / 2, -ch / 2, cw / 2, -ch / 2 + cr);
  cup.lineTo(cw / 2, ch / 2 - cr); cup.quadraticCurveTo(cw / 2, ch / 2, cw / 2 - cr, ch / 2); cup.lineTo(-cw / 2 + cr, ch / 2);
  cup.quadraticCurveTo(-cw / 2, ch / 2, -cw / 2, ch / 2 - cr); cup.lineTo(-cw / 2, -ch / 2 + cr); cup.quadraticCurveTo(-cw / 2, -ch / 2, -cw / 2 + cr, -ch / 2);
  if (headset) for (const sx of [-1, 1]) { const c = tag(new THREE.Mesh(new THREE.ShapeGeometry(cup, 8), mat), SOLID);
    c.position.set(sx * (HEAD_R + cw * 0.28), headY - 0.012 * Hh, 0.001); g.add(c); }
  if (headset) {
    const band = new LineSet(PAL.white).arc([0, headY, 0.001], HEAD_R + 0.03 * Hh, [1, 0, 0], [0, 1, 0], 0.14 * Math.PI, 0.86 * Math.PI, 28, 0.022 * Hh).build();
    const mic = new LineSet(PAL.white).arc([-(HEAD_R + 0.01 * Hh), headY - 0.02 * Hh, 0.001], 0.105 * Hh, [1, 0, 0], [0, 1, 0], 1.02 * Math.PI, 1.55 * Math.PI, 12, 0.014 * Hh).build();
    g.add(band, mic);
  }
  // Contact pool on the floor (characters.md): about 1.6 body widths wide, brightest at the foot line.
  const pool = tag(new THREE.Mesh(new THREE.PlaneGeometry(1.6 * BODY_W, 0.9), softMat(new THREE.Color(0.2, 0.2, 0.2), 0)), FX, true);
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.004, 0.05); g.add(pool);
  g.userData.headTop = headY + HEAD_R;
  return g;
}

// 4.2 A label pill above something: outlined rounded rectangle with spaced uppercase text
export function makePill(text, pal, hgt = 0.34) {
  const g = new THREE.Group();
  const t = makeText(text, pal, { height: hgt * 0.42, weight: 700, spacing: 0.16 });
  const wdt = t.width + hgt * 0.35;
  g.add(roundRect(new LineSet(pal), wdt, hgt, hgt * 0.32, 0.022).build());
  t.mesh.position.z = 0.002; g.add(t.mesh);
  return g;
}

// 4.3 An outlined card with a small label and a big value (type sizes are guesses until type-ui runs)
export function makeCard(pal, label, value, { w = 2.3, h = 1.25, maxChars = null, valuePal = null }) {
  const g = new THREE.Group();
  const frame = roundRect(new LineSet(pal), w, h, 0.16, 0.03).build(); g.add(frame);
  const lab = makeText(label, PAL.white, { height: 0.105, weight: 600, spacing: 0.2 });
  lab.mesh.material.uniforms.uOpacity.value = 0.3;            // "normal" level of the ladder: 0.55 display
  lab.mesh.position.set(0, h * 0.27, 0.002); g.add(lab.mesh);
  const val = makeText(value, valuePal || pal, { height: 0.5, weight: 700, spacing: 0.01, maxChars });
  val.mesh.position.set(0, -h * 0.1, 0.002); g.add(val.mesh);
  return { group: g, frame, lab, val };
}

// 4.4 The token: a 3D coin made of lines (two faces, joined by short bridges) with a compass star
export function makeToken() {
  const set = new LineSet(PAL.gold), R = 0.42, T = 0.055, X = [1, 0, 0], Y = [0, 1, 0], TAU = Math.PI * 2;
  for (const z of [-T, T]) {
    set.arc([0, 0, z], R, X, Y, 0, TAU, 56, 0.042);
    set.arc([0, 0, z], R * 0.78, X, Y, 0, TAU, 48, 0.022);
    const star = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + Math.PI / 2, r = i % 2 === 0 ? (i % 4 === 0 ? R * 0.62 : R * 0.4) : R * 0.15;
      star.push([Math.cos(a) * r, Math.sin(a) * r, z]); }
    set.poly(star, 0.024, true);
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; set.seg([Math.cos(a) * R, Math.sin(a) * R, -T], [Math.cos(a) * R, Math.sin(a) * R, T], 0.03); }
  return set.build();
}

// 4.5 The chest: a 3D box with an arched lid that opens on a hinge at the back.
// pal: gold for a chest that matters; 'grey' or 'dim' for chests that are only a crowd. simple = without planks, rivets
// and handles: use it for small chests in the background, where the minimum line width would turn the detail into a blob.
export function makeChest(pal = PAL.gold, { simple = false } = {}) {
  const g = new THREE.Group(), hx = 0.72, hy = 0.6, hz = 0.46, P = 0.046, D = 0.026;
  const body = new LineSet(pal);
  for (const z of [-hz, hz]) body.poly([[-hx, 0, z], [hx, 0, z], [hx, hy, z], [-hx, hy, z]], P, true);
  for (const x of [-hx, hx]) for (const y of [0, hy]) body.seg([x, y, -hz], [x, y, hz], P);
  for (const x of [-0.36, 0.36]) { for (const z of [-hz, hz]) body.seg([x, 0, z], [x, hy, z], D); body.seg([x, 0, -hz], [x, 0, hz], D); }
  body.poly([[-0.1, hy - 0.2, hz + 0.01], [0.1, hy - 0.2, hz + 0.01], [0.1, hy - 0.02, hz + 0.01], [-0.1, hy - 0.02, hz + 0.01]], D, true);   // lock plate
  body.arc([0, hy - 0.1, hz + 0.01], 0.035, [1, 0, 0], [0, 1, 0], 0, Math.PI * 2, 14, D * 0.8);
  // more to look at on the hero prop: planks, rivets, side handles
  if (!simple) {
    for (const y of [hy * 0.36, hy * 0.7]) body.seg([-hx, y, hz], [hx, y, hz], D * 0.8);
    for (const x of [-0.36, 0.36]) for (const y of [0.1, hy * 0.5, hy - 0.1]) body.arc([x, y, hz + 0.012], 0.022, [1, 0, 0], [0, 1, 0], 0, Math.PI * 2, 8, D * 0.7);
    for (const sx of [-1, 1]) body.arc([sx * (hx + 0.012), hy * 0.52, 0], 0.11, [0, 0, 1], [0, -1, 0], 0, Math.PI, 10, D);
  }
  g.add(body.build());
  // translucent faces: the box reads as a solid thing, not only as lines
  const fm = fillMat(pal === PAL.gold ? new THREE.Color(0x422d15).multiplyScalar(0.5) : pal.core.clone().multiplyScalar(0.03)), faces = [];
  const face = (w, h2, pos, rotY) => { const q = tag(new THREE.Mesh(new THREE.PlaneGeometry(w, h2), fm), LINE); q.position.set(...pos); q.rotation.y = rotY; g.add(q); faces.push(q); };
  face(2 * hx, hy, [0, hy / 2, hz], 0); face(2 * hx, hy, [0, hy / 2, -hz], 0); face(2 * hz, hy, [hx, hy / 2, 0], Math.PI / 2); face(2 * hz, hy, [-hx, hy / 2, 0], Math.PI / 2);
  // the light inside: a glowing sheet at the mouth of the chest, dark until it opens
  const inner = tag(new THREE.Mesh(new THREE.PlaneGeometry(2 * hx * 1.25, 2 * hz * 1.5), softMat(new THREE.Color(1.6, 1.0, 0.32), 0)), FX, true);
  inner.rotation.x = -Math.PI / 2; inner.position.y = hy - 0.02; inner.material.uniforms.uOpacity.value = 0; g.add(inner);
  g.userData.inner = inner.material; g.userData.fill = fm;
  const lid = new THREE.Group(); lid.position.set(0, hy, -hz);            // hinge line at the back top edge
  const ls = new LineSet(pal), Y = [0, 1, 0], Z = [0, 0, 1], LH = 0.34;
  for (const x of [-hx, hx]) ls.arc([x, 0, hz], hz, [0, 0, -1], [0, LH / hz, 0], 0, Math.PI, 16, P);
  for (const x of [-0.36, 0.36]) ls.arc([x, 0, hz], hz, [0, 0, -1], [0, LH / hz, 0], 0, Math.PI, 16, D);
  ls.seg([-hx, 0, 0], [hx, 0, 0], P).seg([-hx, 0, 2 * hz], [hx, 0, 2 * hz], P).seg([-hx, LH, hz], [hx, LH, hz], D);
  lid.add(ls.build()); g.add(lid);
  g.userData.lid = lid;
  return g;
}

// 4.6 A ring on the floor that expands and fades (stage.md: 14-frame ease-out, fades by frame 16)
export function makeRing(pal) {
  const m = new LineSet(pal, { fixedW: true, noMirror: true }).arc([0, 0, 0], 1, [1, 0, 0], [0, 0, 1], 0, Math.PI * 2, 72, 0.075).build();
  m.position.y = 0.006; m.userData.on = false; return m;
}
export function animRing(ring, f, f0, rMax) {
  const t = f - f0; ring.userData.on = t >= 0 && t <= 17;                 // lifetime 17 frames
  if (!ring.userData.on) return;
  ring.scale.setScalar(Math.max(0.001, rMax * easeOutCubic(clamp01(t / 14))));
  ring.material.uniforms.uOpacity.value = t < 4 ? t / 4 : Math.max(0, 1 - (t - 4) / 12);
}

// 4.6b A compass: a round dial with a needle. Never a star: the token already carries an 8-point compass star, so every
// other compass in a video is a dial with a needle. The needle turns on its own (userData.needle; api: turnNeedle).
export function makeCompass(pal, needlePal = pal) {
  const g = new THREE.Group(), X = [1, 0, 0], Y = [0, 1, 0], TAU = Math.PI * 2;
  const dial = new LineSet(pal);
  dial.arc([0, 0, 0], 1, X, Y, 0, TAU, 72, 0.055).arc([0, 0, 0], 0.88, X, Y, 0, TAU, 64, 0.02);
  for (let i = 0; i < 32; i++) { if (i % 8 === 0) continue;                             // the four cardinal points carry a letter
    const a = i / 32 * TAU, r0 = i % 4 === 0 ? 0.70 : 0.79;
    dial.seg([Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a) * 0.88, Math.sin(a) * 0.88, 0], i % 4 === 0 ? 0.03 : 0.02); }
  dial.arc([0, 1.14, 0], 0.14, X, Y, 0, TAU, 20, 0.035);                                // the loop a pocket compass hangs from
  g.add(dial.build());
  [['N', 0, 1], ['E', 1, 0], ['S', 0, -1], ['W', -1, 0]].forEach(([ch, x, y]) => {
    const t = makeText(ch, pal, { height: 0.17, weight: 700 }); t.mesh.position.set(x * 0.71, y * 0.71, 0.002); g.add(t.mesh); });
  const needle = new THREE.Group(); needle.position.z = 0.03;
  const ns = new LineSet(needlePal);
  ns.poly([[-0.1, 0, 0], [0, 0.56, 0], [0.1, 0, 0]], 0.045).seg([0, 0.02, 0], [0, 0.46, 0], 0.075);      // the half that points: heavy
  ns.poly([[-0.1, 0, 0], [0, -0.56, 0], [0.1, 0, 0]], 0.022);                                           // the tail: thin
  ns.arc([0, 0, 0], 0.06, X, Y, 0, TAU, 14, 0.04);
  needle.add(ns.build()); g.add(needle);
  g.userData.needle = needle;
  return g;
}

// 4.6c The compass a game draws at the top of the screen: a strip with ticks, headings and a marker in the middle.
export function makeCompassStrip(pal) {
  const g = new THREE.Group(), Wd = 4.0, set = new LineSet(pal);
  set.seg([-Wd / 2, 0, 0], [Wd / 2, 0, 0], 0.022);
  for (let i = 0; i <= 24; i++) { const x = -Wd / 2 + Wd * i / 24, big = i % 4 === 0; set.seg([x, 0, 0], [x, big ? 0.2 : 0.1, 0], big ? 0.03 : 0.018); }
  set.poly([[0, -0.07, 0], [0.1, -0.23, 0], [-0.1, -0.23, 0]], 0.028, true);            // marker: where you are looking
  g.add(set.build());
  ['NW', '330', '345', 'N', '15', '30', 'NE'].forEach((m, i) => { const word = /^[A-Z]+$/.test(m);
    const t = makeText(m, pal, { height: word ? 0.2 : 0.12, weight: 700, spacing: 0.04 });
    if (!word) t.mesh.material.uniforms.uOpacity.value = 0.55;
    t.mesh.position.set(-Wd / 2 + Wd * i / 6, 0.43, 0.002); g.add(t.mesh); });
  return g;
}

// 4.6d A plain rounded outline: a screen, a phone, a video thumbnail.
export function makeFrame(pal, w, h, r = 0.16, lw = 0.03) { return roundRect(new LineSet(pal), w, h, r, lw).build(); }

// 4.6e A die: a cube of lines with pips on three faces (on all six the see-through cube turns into a cloud of dots).
export function makeDie(pal, size = 0.42) {
  const s = size / 2, set = new LineSet(pal), P = size * 0.075, d = s * 0.5, r = size * 0.05;
  for (const z of [-s, s]) set.poly([[-s, -s, z], [s, -s, z], [s, s, z], [-s, s, z]], P, true);
  for (const x of [-s, s]) for (const y of [-s, s]) set.seg([x, y, -s], [x, y, s], P);
  const face = (o, ux, uy, spots) => { for (const [a, b] of spots)
    set.arc([o[0] + (ux[0] * a + uy[0] * b) * d, o[1] + (ux[1] * a + uy[1] * b) * d, o[2] + (ux[2] * a + uy[2] * b) * d], r, ux, uy, 0, Math.PI * 2, 8, r * 1.5); };
  face([0, 0, s], [1, 0, 0], [0, 1, 0], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]);
  face([0, s, 0], [1, 0, 0], [0, 0, 1], [[-1, -1], [0, 0], [1, 1]]);
  face([s, 0, 0], [0, 0, 1], [0, 1, 0], [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]);
  return set.build();
}

// 4.6f A play button: a circle with a triangle.
export function makePlayIcon(pal, r = 0.22) {
  return new LineSet(pal).arc([0, 0, 0], r, [1, 0, 0], [0, 1, 0], 0, Math.PI * 2, 32, r * 0.16)
    .poly([[-0.3 * r, 0.45 * r, 0], [0.5 * r, 0, 0], [-0.3 * r, -0.45 * r, 0]], r * 0.16, true).build();
}

// 4.6g A tally: four strokes and one across them, the way people count by hand. One group per mesh, so a plan can
// pop, drop and fade each group on its own. h = height of the strokes.
export function makeTally(pal, h = 0.36) {
  const set = new LineSet(pal), d = h * 0.21, w = h * 0.075;
  [-0.02, 0.03, -0.035, 0.015].forEach((lean, i) => { const x = (i - 1.5) * d;      // a hand never draws them quite straight
    set.seg([x - lean * h, -h / 2, 0], [x + lean * h, h / 2, 0], w); });
  set.seg([-2.3 * d, -0.3 * h, 0.002], [2.3 * d, 0.32 * h, 0.002], w);
  return set.build();
}

// 4.6h A dashed guide along +x, from 0 to length: a path between two things (rotate and place it).
export function makeGuide(pal, length, { dash = 0.16, gap = 0.12, width = 0.02 } = {}) {
  const set = new LineSet(pal, { noMirror: true });
  for (let x = 0; x < length; x += dash + gap) set.seg([x, 0, 0], [Math.min(length, x + dash), 0, 0], width);
  return set.build();
}

// 4.7 Ground line: dashed, grey, in the world. Measured: dash 0.62 of the period, period about 80 px at 720p.
export function makeGroundLine(x0, x1) {
  const frameW = 2 * CAM_DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * W / H, period = frameW * 80 / 720;
  const set = new LineSet(PAL.grey, { noMirror: true });
  for (let x = x0; x < x1; x += period) set.seg([x, 0.004, -0.52], [x + period * 0.62, 0.004, -0.52], 0.014);
  return set.build();
}

// 4.9 Specks, second version. They sit at real depths, drift slowly, and go in and out of focus as the camera moves:
// the blur radius grows with the distance from the focus plane, like a lens (the lens strength is a guess).
export function makeSpecks3D(n, x0, x1) {
  const r = rng(11), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), dat = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x0 + r() * (x1 - x0); pos[i * 3 + 1] = 0.2 + r() * 7.5; pos[i * 3 + 2] = -8 + r() * 15.5;
    const a = r() * Math.PI * 2, sp = 0.0004 + r() * 0.001;                       // metres per frame: under 0.3 px/frame on screen
    vel[i * 3] = Math.cos(a) * sp; vel[i * 3 + 1] = 0.0002 + r() * 0.0006; vel[i * 3 + 2] = Math.sin(a) * sp * 0.6;
    dat[i * 3] = 0.028 + r() * 0.03;                                               // size in metres
    dat[i * 3 + 1] = 0.01 + Math.pow(r(), 2.0) * 0.085;                            // linear brightness when sharp
    dat[i * 3 + 2] = r() < 0.06 ? 1 : 0;                                           // a few take the key colour
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  g.setAttribute('corner', new THREE.BufferAttribute(QUAD_CORNERS, 2)); g.setIndex(QUAD_INDEX);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(vel, 3));
  g.setAttribute('iD', new THREE.InstancedBufferAttribute(dat, 3)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, uTint: { value: new THREE.Color(1.0, 0.8, 0.42) }, uFrame: { value: 0 }, uFocus: { value: 9 }, uAperture: { value: 36 * W / 1080 },
      uSpots: { value: [new THREE.Vector4(), new THREE.Vector4()] } },                    // x, z, strength of each spotlight
    ...ADDITIVE, depthTest: false,
    vertexShader: /* glsl */ `attribute vec2 corner; attribute vec3 iP; attribute vec3 iV; attribute vec3 iD;
      uniform vec2 uRes; uniform float uFrame; uniform float uFocus; uniform float uAperture; uniform vec4 uSpots[2];
      varying vec2 vC; varying float vB; varying float vDisc; varying float vTint;
      void main(){
        vec3 wp = iP + iV * uFrame; float beam = 0.0;
        for (int i = 0; i < 2; i++) { vec2 dxz = wp.xz - uSpots[i].xy; float sg = 1.516 * max(0.05, 1.0 - wp.y / 10.71);
          beam += uSpots[i].z * exp(-dot(dxz, dxz) / (2.0 * sg * sg)) * exp(-max(0.0, wp.y - 2.29) / 3.40); }
        vec4 mv = viewMatrix * modelMatrix * vec4(wp, 1.0); float depth = -mv.z;
        if (depth < 0.2) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float k = projectionMatrix[1][1] * 0.5 * uRes.y;
        float r0 = max(iD.x * 0.5 * k / depth, 0.9);                              // radius in px when in focus
        float coc = uAperture * abs(1.0 / depth - 1.0 / uFocus);                  // blur radius in px
        float R = sqrt(r0 * r0 + coc * coc);
        vec4 clip = projectionMatrix * mv; clip.xy += corner * R * 1.7 * 2.0 / uRes * clip.w;
        gl_Position = clip; vC = corner * 1.7; vDisc = smoothstep(1.5, 5.0, coc); vB = iD.y * pow(r0 / R, 1.25) * (1.0 + 4.0 * beam); vTint = iD.z; }`,
    fragmentShader: /* glsl */ `uniform vec3 uTint; varying vec2 vC; varying float vB; varying float vDisc; varying float vTint;
      void main(){ float r = length(vC); float soft = exp(-r * r * 2.3); float disc = smoothstep(1.0, 0.86, r) * 0.75;
        float m = mix(soft, disc, vDisc); if (m < 0.002) discard;
        gl_FragColor = vec4(mix(vec3(1.0), uTint, vTint) * vB * m, 0.0); }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return tag(mesh, FX, true);
}
