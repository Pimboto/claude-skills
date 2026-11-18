// KIT / stage. Turns a plan into a video: builds the stations, runs the plan's timeline every frame, moves the camera,
// keeps the spotlights, specks and effects in step, and draws the frame.
//
// How a video is laid out: the stage is a row of stations, STATION_GAP metres apart. Each sentence or idea gets a
// station. The camera stays on one station per shot and whip-pans to the next one. A station is only drawn around
// its own shot, so a wide orbit never shows its neighbours.
import * as THREE from 'three';
import { FPS, STATION_GAP, world, camera, prog } from './core.js';
import { makeGroundLine, makeSpecks3D } from './parts.js';
import { makeBeam } from './vfx.js';
import { setCamera, cameraAt, camState } from './camera.js';
import { renderPasses } from './post.js';
import { setWords } from './captions.js';

const faceCam = [];        // things that turn around the vertical axis to face the lens (figures, labels, beams, halos)
const ticking = [];        // materials whose uFrame uniform must follow the frame number (sparks, rays)
const spots = [];          // spotlights: { beam, figure, station }
// The two spotlight tints. Level of the cone: the reference measures +2 to +15 codes over black; ours gives +9 to +20.
const BEAM_TINT = { neutral: new THREE.Color(0.0098, 0.0094, 0.0092), warm: new THREE.Color(0.0105, 0.0094, 0.0077) };

export function registerTick(material) { ticking.push(material); return material; }

function makeStation(index) {
  const group = new THREE.Group(), pass = new THREE.Group();
  const add = (g) => (obj, opts = {}) => { g.add(obj); if (opts.faceCamera) faceCam.push(obj); return obj; };
  return {
    index, x: index * STATION_GAP, group, pass,
    add: add(group),
    // Theatre spotlight on a figure. tint: 'neutral' or 'warm'. shadow: floor direction [x, z] the shadow falls in;
    // give it a sideways part, or the shadow hides under the figure's own reflection.
    spotlight(figure, { tint = 'neutral', shadow = [0.71, 0.71] } = {}) {
      if (!BEAM_TINT[tint]) throw new Error(`spotlight: unknown tint "${tint}" (use neutral or warm)`);
      const beam = makeBeam(BEAM_TINT[tint], shadow); beam.position.copy(figure.position);
      group.add(beam); faceCam.push(beam); spots.push({ beam, figure, station: index }); return beam;
    },
    // things between this station and the next one: only drawn while the camera whips past them
    passing: { add: add(pass) },
  };
}

export function createVideo(plan) {
  const cam = setCamera(plan.camera.shots, plan.camera.whips || []);
  const whips = cam.whips, count = cam.shots.length, lastX = (count - 1) * STATION_GAP;
  const captions = setWords(plan.words || [], plan.keywords || {});
  // the floor line and the floating specks run along the whole row (same density of specks whatever the length)
  world.add(makeGroundLine(-22, lastX + 24));
  const specks = makeSpecks3D(Math.round(980 * (lastX + 20) / (STATION_GAP + 20)), -10, lastX + 10); world.add(specks);
  const stations = Array.from({ length: count }, (_, i) => makeStation(i));
  const objects = plan.build({
    station(i) { if (!stations[i]) throw new Error(`plan: station ${i} does not exist; the camera has ${count} shot(s)`); return stations[i]; },
    passing(i) { if (i < 0 || i >= whips.length) throw new Error(`plan: there is no whip-pan after station ${i}`); return stations[i].passing; },
  }) || {};
  for (const s of stations) world.add(s.group, s.pass);
  // a spotlight of a later station fades in over 10 frames, starting 6 frames before the whip-pan lands on it
  const fadeIn = (station, f) => (station === 0 ? 1 : prog(f, whips[station - 1].at + whips[station - 1].frames - 6, 10));

  function render(f) {
    stations.forEach((s, i) => {
      s.group.visible = (i === 0 || f >= whips[i - 1].at + 3) && (i === whips.length || f < whips[i].at + whips[i].frames - 3);
      s.pass.visible = i < whips.length && f >= whips[i].at - 1 && f <= whips[i].at + whips[i].frames + 1;
    });
    plan.animate(f, objects);
    const breathe = 1 + 0.04 * Math.sin(f * 0.09);
    for (const s of spots) {
      s.beam.userData.foot.uniforms.uFig.value.set(s.figure.position.x, s.figure.position.z);
      s.beam.userData.mat.uniforms.uFrame.value = f; s.beam.userData.mat.uniforms.uOpacity.value = breathe * fadeIn(s.station, f);
    }
    for (const m of ticking) m.uniforms.uFrame.value = f;
    const c = cameraAt(f);
    for (const o of faceCam) o.rotation.y = Math.atan2(camera.position.x - o.position.x, camera.position.z - o.position.z);
    specks.material.uniforms.uFrame.value = f; specks.material.uniforms.uFocus.value = camState.focus;
    // the specks are lit by at most two spotlights at a time: with more than two in the video, the visible ones win
    const lit = spots.length <= 2 ? spots : spots.filter((s) => stations[s.station].group.visible).slice(0, 2);
    const sp = specks.material.uniforms.uSpots.value;
    for (let k = 0; k < 2; k++) {
      const s = lit[k];
      if (s) sp[k].set(s.figure.position.x, s.figure.position.z, stations[s.station].group.visible ? fadeIn(s.station, f) : 0, 0); else sp[k].set(0, 0, 0, 0);
    }
    renderPasses(c.exposure, c.vel);
  }
  const info = { name: plan.name, frames: plan.frames, fps: FPS, stations: count,
    whips: whips.map((w) => ({ at: w.at, frames: w.frames })),
    moves: cam.shots.flatMap((s, i) => s.moves.map((m) => ({ shot: i, f0: m.f0, f1: m.f1, kind: m.kind }))),
    words: captions };
  return { frames: plan.frames, info, render };
}
