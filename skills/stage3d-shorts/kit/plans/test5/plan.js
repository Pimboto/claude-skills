// PLAN: test5. A 5 second test video (150 frames) with one station: a chest that opens, a token that rises, and a
// card that shows the frame number. It exists to test a machine or a change to the kit quickly: the frame number on
// the card makes a missing or misplaced frame easy to see. There is no voice; the words have made-up timings.
import { definePlan, POSE, stationX, figure, card, token, chest, ring, label, pool, halo, rays, sparks,
  pop, pulse, flare, level, openLid, lightChest, prog, easeOutCubic, easeOutBack } from '../../src/api.js';

const X = stationX(0), CHX = X + 0.8, CHS = 1.45;
const recoil = (t) => (t <= 0 ? 0 : Math.exp(-t / 11) * (1 - Math.exp(-t / 1.6)));
const WORDS = [['One', 0.30, 0.55, 't1'], ['short', 0.55, 0.85, 't1'], ['test', 0.85, 1.40, 't1'], ['Same', 1.90, 2.20, 't2'], ['look', 2.20, 2.70, 't2'],
  ['every', 3.10, 3.40, 't3'], ['time', 3.40, 4.30, 't3']].map(([w, t0, t1, line]) => ({ w, t0, t1, line }));

export default definePlan({
  name: 'test5',
  frames: 150,
  words: WORDS,
  keywords: { test: 'gold', time: 'gold' },

  build(stage) {
    const S = stage.station(0);
    const fig = figure(); fig.position.set(X - 1.75, 0, -0.5); S.add(fig, { faceCamera: true });
    const box = chest(); box.position.set(CHX, 0, -0.3); box.rotation.y = -0.35; box.scale.setScalar(CHS); S.add(box);
    const coin = token(); coin.position.set(CHX, 0.6, -0.3); S.add(coin);
    const title = label('RENDER TEST', 'white', { height: 0.19, weight: 600, spacing: 0.22 });
    level(title.mesh, 0.5); title.mesh.position.set(X + 0.1, 4.75, -1.6); S.add(title.mesh);
    const ring1 = ring('gold'); ring1.position.set(CHX, 0.006, -0.3); S.add(ring1);
    const ring2 = ring('gold'); ring2.position.set(CHX, 0.006, -0.3); S.add(ring2);
    const counter = card('gold', 'FRAME', '000', { w: 1.9, h: 1.1, maxChars: '000' });
    counter.group.position.set(X - 1.55, 3.55, -0.6); counter.group.rotation.y = 0.12; S.add(counter.group);
    S.spotlight(fig, { tint: 'warm', shadow: [-0.6, 0.8] });
    const floor = pool('gold', 4.6, 3.0); floor.position.set(CHX, 0.005, -0.25); S.add(floor);
    const beams = rays(); beams.position.set(CHX, 0.6 * CHS, -0.3); S.add(beams, { faceCamera: true });
    const glow = halo('gold', 2.4); glow.position.copy(coin.position); S.add(glow, { faceCamera: true });
    const burst = sparks('gold', 64, 31, { t0: 61, spread: 0.7, speed: 0.022, up: 0.05, life: 34 }); burst.position.set(CHX, 0.6 * CHS, -0.3); S.add(burst);
    return { fig, box, coin, title, ring1, ring2, counter, floor, beams, glow };
  },

  animate(f, o) {
    pop(o.counter.group, f, -4, 8); o.counter.val.set(String(f).padStart(3, '0'));       // the card shows the frame number
    pop(o.title.mesh, f, 6, 5, 0.5);
    openLid(o.box, easeOutBack(prog(f, 60, 11), 1.4));                                   // the lid opens at 60
    const rise = easeOutCubic(prog(f, 62, 24));                                          // the token comes out
    o.coin.visible = f >= 61; o.coin.position.y = 0.6 + 2.55 * rise + 0.035 * Math.sin(f * 0.07) * rise;
    o.coin.scale.setScalar(0.4 + 0.8 * rise); o.coin.rotation.y = f * 0.03;
    pulse(o.ring1, f, 63, 1.9); pulse(o.ring2, f, 93, 2.2);
    flare(o.box, 1 + 0.5 * Math.sin(Math.PI * prog(f, 93, 12)));
    const lit = prog(f, 60, 8), fade = 1 - 0.45 * prog(f, 86, 40);
    lightChest(o.box, lit, fade); level(o.beams, lit * fade * 0.5);
    level(o.floor, 0.35 + 0.9 * lit * fade + 0.5 * Math.sin(Math.PI * prog(f, 93, 12)));
    o.glow.position.copy(o.coin.position); level(o.glow, rise * (0.8 + 0.2 * Math.sin(f * 0.13))); o.glow.visible = f >= 61;
    o.fig.rotation.z = -0.07 * recoil(f - 60);
  },

  // One shot: push in (hook), come round to a 3/4 view before the lid opens (60), then one slow arc while the token rises.
  camera: {
    whips: [],
    shots: [
      { start: POSE(X + 0.3, -0.4, 8, 7.4, 1.5, 0.70), moves: [
        { f0: 0, f1: 17, kind: 'hook', to: POSE(X + 0.45, -0.4, 6, 5.8, 1.35, 0.72) },
        { f0: 34, f1: 58, kind: 'reframe', to: POSE(X - 0.3, -0.4, -28, 6.1, 1.5, 0.70) },
        { f0: 66, f1: 150, kind: 'slow', to: POSE(X + 0.4, -0.4, 16, 5.3, 1.4, 0.66) },
      ] },
    ],
  },
});
