// KIT / camera. Poses, the three allowed move curves, shots separated by whip-pans.
import * as THREE from 'three';
import { camera, W, H, prog, easeInOutSine, easeOutQuad } from './core.js';

// Camera, fourth version (wider lens, closer, reframes that start hard). Edited the way video 1 of the reference is edited (analysis/reports/camera_edit_video1.md):
//   - a shot has one or two real moves, each with a reason, a clear start and a clear end;
//   - between moves the camera holds and only creeps in (measured 0.03-0.05 % per frame);
//   - a reframing move lasts 20-28 frames, starts hard and brakes long (see easeFastStart), bridges two
//     sentences, and has landed a few frames before the new element appears;
//   - a slow push or a slow orbit runs across a whole shot with an ease-in-out curve;
//   - the hook starts with a fast push-in that lands on the first words.
// A pose is: the floor point the camera looks after (cx, cz), the angle around it (yaw, degrees, negative = from the left),
// the distance, the camera height, and where that floor point sits in the frame (feetY, 0 = top, 1 = bottom).
export const POSE = (cx, cz, yaw, dist, h, feetY) => ({ cx, cz, yaw, dist, h, feetY });
export const POSE_FIELDS = ['cx', 'cz', 'yaw', 'dist', 'h', 'feetY'];
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Reframing curve: starts hard, brakes long. Measured on the reference (video 1, image speed per frame): the pull-back
// at 56-84 peaks 21 % of the way in and has done half its travel at 32 %; the move at 162-182 peaks at 25 % and is
// half done at 30 %. This curve peaks at 23 % and is half done at 31 %.
export const easeFastStart = (t) => 1 - Math.pow(1 - Math.pow(t, 1.5), 3.7);

export const lerpPose = (a, b, t) => { const o = {}; for (const n of POSE_FIELDS) o[n] = a[n] + (b[n] - a[n]) * t; return o; };
// During a hold the camera is never dead: it creeps in and drifts a hair sideways.
export const creep = (p, n) => ({ ...p, dist: p.dist * Math.pow(1 - 0.00045, n), cx: p.cx + 0.0005 * n, yaw: p.yaw + 0.01 * n });
export function shotPose(shot, f) {
  let p = shot.start, last = shot.from;
  for (const m of shot.moves) {
    if (f <= m.f0) return creep(p, Math.max(0, f - last));
    const held = creep(p, m.f0 - last);
    if (f < m.f1) return lerpPose(held, m.to, m.ease((f - m.f0) / (m.f1 - m.f0)));
    p = m.to; last = m.f1;
  }
  return creep(p, Math.max(0, f - last));
}
export const camState = { yaw: 0, focus: 9 };
export function frameCamera(p) {
  const yaw = THREE.MathUtils.degToRad(p.yaw);
  camera.position.set(p.cx + Math.sin(yaw) * p.dist, p.h, p.cz + Math.cos(yaw) * p.dist);
  // tilt so that the floor point under the subject lands at feetY of the frame height
  let lo = -6, hi = 8;
  for (let i = 0; i < 30; i++) { const ty = (lo + hi) / 2; camera.lookAt(p.cx, ty, p.cz); camera.updateMatrixWorld(true);
    const q = new THREE.Vector3(p.cx, 0, p.cz).project(camera); const y = (1 - q.y) / 2; if (y > p.feetY) hi = ty; else lo = ty; }
  camState.focus = Math.hypot(p.dist, p.h - 1.0);
}

// The only curves a plan may use for a camera move (references/CAMERA_RULES.md):
//   hook     fast push-in at the start of the video, fastest at its first frame
//   reframe  a short move between two sentences: starts hard, brakes long
//   slow     a slow push or orbit across a whole shot, ease-in-out
export const MOVE_KINDS = { hook: easeOutQuad, reframe: easeFastStart, slow: easeInOutSine };
export const WHIP_FRAMES = 16;         // measured: whip-pans last 16 frames (median), symmetric ease
let SHOTS = [], WHIPS = [];

// shots: [{ start: POSE, moves: [{ f0, f1, kind, to: POSE }] }], one per station, in order.
// whips: frame at which each whip-pan starts; whip i leads from shot i to shot i + 1.
export function setCamera(shots, whipStarts) {
  if (shots.length !== whipStarts.length + 1) throw new Error(`camera: ${shots.length} shots need ${shots.length - 1} whips, got ${whipStarts.length}`);
  WHIPS = whipStarts.map((at) => ({ at, frames: WHIP_FRAMES }));
  SHOTS = shots.map((s, i) => {
    const from = i === 0 ? 0 : WHIPS[i - 1].at + WHIP_FRAMES; let last = from;
    const moves = s.moves.map((m) => {
      if (!MOVE_KINDS[m.kind]) throw new Error(`camera: unknown move kind "${m.kind}" (use hook, reframe or slow)`);
      if (m.f0 < last || m.f1 <= m.f0) throw new Error(`camera: move ${m.f0}-${m.f1} of shot ${i} overlaps the one before it or runs backwards`);
      const len = m.f1 - m.f0;
      if (m.kind === 'reframe' && (len < 16 || len > 32)) throw new Error(`camera: reframe ${m.f0}-${m.f1} lasts ${len} frames; the reference uses 20 to 28`);
      if (m.kind === 'hook' && (i !== 0 || m.f0 !== 0 || len > 24)) throw new Error(`camera: the hook is the first move of the video, from frame 0, at most 24 frames`);
      if (m.kind === 'slow' && len < 40) throw new Error(`camera: slow move ${m.f0}-${m.f1} lasts ${len} frames; a slow push or orbit runs across the shot (40 or more)`);
      last = m.f1; return { f0: m.f0, f1: m.f1, kind: m.kind, ease: MOVE_KINDS[m.kind], to: m.to };
    });
    return { from, start: s.start, moves };
  });
  return { shots: SHOTS, whips: WHIPS };
}
export function poseAt(f) {
  let i = 0; while (i < WHIPS.length && f >= WHIPS[i].at + WHIPS[i].frames) i++;          // shot whose stretch f is in
  if (i < WHIPS.length && f > WHIPS[i].at) {                                             // inside whip i: blend shot i into shot i + 1
    const w = WHIPS[i], a = shotPose(SHOTS[i], w.at), b = shotPose(SHOTS[i + 1], w.at + w.frames);
    return lerpPose(a, b, easeInOutSine(prog(f, w.at, w.frames)));
  }
  if (i === 0) return shotPose(SHOTS[0], f);
  // after a whip the pose is written as "previous shot's last pose + the whole way to this one", exactly as during the whip
  const w = WHIPS[i - 1]; return lerpPose(shotPose(SHOTS[i - 1], w.at), shotPose(SHOTS[i], f), 1);
}
export function cameraAt(f) {
  // screen motion of a fixed world point between the previous frame and this one: drives the motion blur
  const p = poseAt(f), anchor = new THREE.Vector3(p.cx, 1.2, p.cz);
  frameCamera(poseAt(f - 1)); const q0 = anchor.clone().project(camera);
  frameCamera(p); const q1 = anchor.clone().project(camera);
  const vx = (q1.x - q0.x) * 0.5 * W, vy = (q1.y - q0.y) * 0.5 * H;
  let dip = 1;
  for (const w of WHIPS) { const t = prog(f, w.at, w.frames); if (t > 0 && t < 1) dip = 1 - 0.47 * Math.pow(Math.sin(Math.PI * t), 2); }   // measured: frame darkens to 0.53x mid-whip
  return { vel: new THREE.Vector2(vx, vy), exposure: dip };
}
