// PLAN: pricetag_demo. The first two lines of the "pricetag" video (9.7 s, 291 frames). This is the clip approved as
// v5 and the worked example of the kit: read it before writing a new plan.
//
//   Station 0  "People have listed Fortnite accounts with the Pirate Shop token for up to $10,000."
//   Station 1  "In a match, the same token comes out of a chest, for free."
//
// Every frame number below follows the real voice (words.json). Word starts, in frames:
//   People 10, have 18, listed 26, Fortnite 35, accounts 48, with 62, the 80, Pirate 84, Shop 94, token 102, for 118,
//   up 128, to 132, $10,000 136-176 | In 186, a 189, match 192, the 206, same 209, token 218, comes 229, out 239,
//   of 244, a 247, chest 248, for 259, free 271.
import { definePlan, POSE, stationX, figure, pill, card, token, chest, ring, label, pool, halo, rays, sparks,
  pop, pulse, flare, level, dim, openLid, lightChest, money, prog, rng, easeOutCubic, easeOutExpo, easeOutBack } from '../../src/api.js';
import WORDS from './words.json';

const AX = stationX(0), BX = stationX(1);
const CHX = BX + 0.8, CHS = 1.45;                      // where the chest stands and how big it is
// the figure reacts to a hit: a quick lean that dies away
const recoil = (t) => (t <= 0 ? 0 : Math.exp(-t / 11) * (1 - Math.exp(-t / 1.6)));

export default definePlan({
  name: 'pricetag_demo',
  frames: 291,
  words: WORDS,
  keywords: { token: 'gold', '$10,000': 'red', free: 'gold' },

  build(stage) {
    const A = stage.station(0), B = stage.station(1), between = stage.passing(0);
    // A background tag belongs to the station it stands in; the ones in between are only seen during the whip-pan.
    const place = (o) => (o.position.x < AX + 4.6 ? A : o.position.x > BX - 6.2 ? B : between).add(o);

    // ---- Station 0: the listing
    const figA = figure(); figA.position.set(AX - 1.25, 0, -0.5); A.add(figA, { faceCamera: true });
    const youA = pill('YOU', 'white', 0.36); youA.position.set(AX - 1.25, figA.userData.headTop + 0.62, -0.5); A.add(youA, { faceCamera: true });
    const price = card('red', 'ACCOUNT · FOR SALE', '$0', { w: 2.15, maxChars: '$10,000' });
    // The card is turned a little away from the 3/4 camera, which gives it more keystone there.
    price.group.position.set(AX + 0.75, 1.7, -0.75); price.group.rotation.y = 0.24; A.add(price.group);
    const tokenA = token(); tokenA.position.set(AX + 0.75, 3.55, -0.2); A.add(tokenA);
    const tokPill = pill('PIRATE SHOP TOKEN', 'gold', 0.32); tokPill.position.set(AX + 0.75, 4.47, -0.2); A.add(tokPill, { faceCamera: true });
    const ringA1 = ring('gold'); ringA1.position.set(AX + 0.75, 0.006, -0.2); A.add(ringA1);
    const ringA2 = ring('red'); ringA2.position.set(AX + 0.75, 0.006, -0.75); A.add(ringA2);
    const ringA0 = ring('red'); ringA0.position.set(AX + 0.75, 0.006, -0.75); A.add(ringA0);
    // Behind it: a loose wall of dim listings. It is what slides against the foreground when the camera comes round.
    const wallR = rng(5), wallTags = [];
    for (let i = 0; i < 8; i++) { const t = pill(['FOR SALE', '$7,900', 'ACCOUNT', '$10,000', 'SOLD', '$9,500', 'FOR SALE', '$8,200'][i], 'red', 0.32);
      const side = i % 2 === 0 ? -1 : 1;
      t.position.set(AX + 0.3 + side * (2.9 + wallR() * 2.4), 0.9 + wallR() * 4.6, -3.0 - wallR() * 3.5); t.rotation.y = -0.25 + wallR() * 0.5;
      dim(t, 0.22); place(t); wallTags.push(t); }
    // Between the stations: a few dim price tags. The whip-pan streaks across them.
    const passR = rng(21);
    for (let i = 0; i < 5; i++) { const t = pill(['FOR SALE', '$8,500', '$10,000', 'SOLD', '$6,200'][i], 'red', 0.3);
      t.position.set(AX + 5.2 + i * 0.9, 1.0 + passR() * 3.2, -1.2 + passR() * 2.2); t.rotation.y = -0.3 + passR() * 0.6;
      dim(t, 0.55); place(t); }

    // ---- Station 1: the chest
    const figB = figure(); figB.position.set(BX - 1.75, 0, -0.5); B.add(figB, { faceCamera: true });
    const box = chest(); box.position.set(CHX, 0, -0.3); box.rotation.y = -0.35; box.scale.setScalar(CHS); B.add(box);
    const tokenB = token(); tokenB.position.set(CHX, 0.6, -0.3); B.add(tokenB);
    const matchTxt = label('IN A MATCH', 'white', { height: 0.19, weight: 600, spacing: 0.22 });
    level(matchTxt.mesh, 0.5); matchTxt.mesh.position.set(BX + 0.1, 4.75, -1.6); B.add(matchTxt.mesh);
    const ringB1 = ring('gold'); ringB1.position.set(CHX, 0.006, -0.3); B.add(ringB1);
    const ringB2 = ring('gold'); ringB2.position.set(CHX, 0.006, -0.3); B.add(ringB2);
    const free = card('gold', 'PRICE', 'FREE', { w: 1.9, h: 1.1 });
    free.group.position.set(BX - 1.55, 3.55, -0.6); free.group.rotation.y = 0.12; B.add(free.group);

    // ---- Light: a spotlight on each figure, and what the glowing things leave on the floor and in the air
    A.spotlight(figA, { tint: 'neutral', shadow: [0.71, 0.71] });
    B.spotlight(figB, { tint: 'warm', shadow: [-0.6, 0.8] });          // warmer: the key colour of this shot is gold
    const poolCard = pool('red', 3.4, 2.2); poolCard.position.set(AX + 0.75, 0.005, -0.6); A.add(poolCard);
    const poolTokA = pool('goldSoft', 2.6, 1.8); poolTokA.position.set(AX + 0.75, 0.0055, -0.2); A.add(poolTokA);
    const poolChest = pool('gold', 4.6, 3.0); poolChest.position.set(CHX, 0.005, -0.25); B.add(poolChest);
    const chestRays = rays(); chestRays.position.set(CHX, 0.6 * CHS, -0.3); B.add(chestRays, { faceCamera: true });
    const haloA = halo('goldSoft', 2.2); haloA.position.copy(tokenA.position); A.add(haloA, { faceCamera: true });
    const haloB = halo('gold', 2.4); haloB.position.copy(tokenB.position); B.add(haloB, { faceCamera: true });
    const sparksB = sparks('gold', 64, 31, { t0: 215, spread: 0.7, speed: 0.022, up: 0.05, life: 34 }); sparksB.position.set(CHX, 0.6 * CHS, -0.3); B.add(sparksB);
    const sparksA = sparks('red', 26, 47, { t0: 150, spread: 0, speed: 0.04, up: 0.006, life: 22, ring: 0.9 }); sparksA.position.set(AX + 0.75, 1.7, -0.72); sparksA.rotation.y = 0.24; A.add(sparksA);

    return { figA, youA, price, tokenA, tokPill, ringA0, ringA1, ringA2, wallTags, figB, box, tokenB, matchTxt, ringB1, ringB2, free,
      poolCard, poolTokA, poolChest, chestRays, haloA, haloB };
  },

  animate(f, o) {
    // ---- Station 0
    pop(o.price.group, f, -8, 8, 1.2, 1.2);                                       // the listing is the hook: complete on frame 0, and 1.2x bigger
    pulse(o.ringA0, f, 0, 1.5);
    pop(o.youA, f, 18, 5, 0.5);                                                   // "have"
    o.wallTags.forEach((t, i) => pop(t, f, 26 + i * 4, 6, 0.8));                  // "listed ... accounts": more listings, one by one
    // The price is the protagonist from frame 0: it races to $2,000 while the camera pushes in, keeps climbing while the
    // sentence builds, and runs to $10,000 on the words.
    const burst = 2000 * easeOutCubic(prog(f, 0, 20)), slow = 4400 * prog(f, 20, 110), run = 3600 * easeOutExpo(prog(f, 132, 24));
    const step = f < 20 ? 10 : (f < 132 ? 50 : 1);
    o.price.val.set(money(Math.round((burst + slow + run) / step) * step));
    level(o.price.val.mesh, 1);
    flare(o.price.frame, 1 + 0.7 * Math.sin(Math.PI * prog(f, 146, 14)));         // the frame flares as the price lands (156)
    pulse(o.ringA2, f, 154, 1.5);
    pop(o.tokenA, f, 86, 9, 1.2, 1.2);                                            // "Pirate" 84: the camera has just landed (88)
    o.tokenA.rotation.y = 0.5 + f * 0.022; o.tokenA.position.y = 3.55 + 0.035 * Math.sin(f * 0.07);
    pop(o.tokPill, f, 94, 5, 0.5);                                                // "Shop"
    pulse(o.ringA1, f, 101, 1.5);                                                 // "token"
    // ---- Station 1
    pop(o.matchTxt.mesh, f, 186, 5, 0.5);
    const open = easeOutBack(prog(f, 214, 11), 1.4);                              // lid opens on "token"
    openLid(o.box, open);
    const rise = easeOutCubic(prog(f, 216, 24));                                  // "token comes out"
    o.tokenB.visible = f >= 215; o.tokenB.position.y = 0.6 + 2.55 * rise + 0.035 * Math.sin(f * 0.07) * rise;
    o.tokenB.scale.setScalar(0.4 + 0.8 * rise); o.tokenB.rotation.y = f * 0.03;
    pulse(o.ringB1, f, 217, 1.9);
    pulse(o.ringB2, f, 247, 2.2);                                                 // "chest"
    flare(o.box, 1 + 0.5 * Math.sin(Math.PI * prog(f, 247, 12)));
    pop(o.free.group, f, 269, 8);                                                 // "free"
    // ---- Light spill: whatever glows lights the floor under it, and follows its flares
    const priceHit = Math.sin(Math.PI * prog(f, 146, 16));
    level(o.poolCard, (0.5 + 0.5 * prog(f, 130, 20)) * prog(f, -8, 8) + 0.9 * priceHit);
    const tokA = prog(f, 86, 9); level(o.poolTokA, tokA * (0.85 + 0.15 * Math.sin(f * 0.13)));
    o.haloA.position.copy(o.tokenA.position); level(o.haloA, tokA * (0.8 + 0.2 * Math.sin(f * 0.13))); o.haloA.visible = tokA > 0;
    const lit = prog(f, 214, 8), fade = 1 - 0.45 * prog(f, 240, 40);              // chest opens: light floods out, then settles
    lightChest(o.box, lit, fade);
    level(o.chestRays, lit * fade * 0.5);
    level(o.poolChest, 0.35 + 0.9 * lit * fade + 0.5 * Math.sin(Math.PI * prog(f, 247, 12)));
    o.haloB.position.copy(o.tokenB.position); level(o.haloB, rise * (0.8 + 0.2 * Math.sin(f * 0.13))); o.haloB.visible = f >= 215;
    // ---- The figure reacts: rocks back when the price lands, leans in when the chest opens
    o.figA.rotation.z = 0.085 * recoil(f - 153); o.youA.rotation.z = 0;
    o.figB.rotation.z = -0.07 * recoil(f - 214);
  },

  // Camera. Each move has a reason, a clear start and a clear end; between moves the camera holds (the kit adds a
  // slow creep). See references/CAMERA_RULES.md.
  camera: {
    whips: [166],            // lands at 182, four frames before "In" (186); the whoosh in the audio mix starts at 163
    shots: [
      { start: POSE(AX + 0.0, -0.5, 6, 6.1, 1.45, 0.72), moves: [
        // "People have listed..." (first word at frame 10): fast push-in that lands on the listing card. The hook.
        { f0: 0, f1: 17, kind: 'hook', to: POSE(AX - 0.02, -0.6, 4, 4.7, 1.1, 0.82) },
        // "...accounts | with the Pirate Shop token" (62-102): pull back and come round to a 3/4 view. Reason: the token is
        // about to appear above the card and needs room; the side view separates card, token and figure in depth.
        // It ends at 88; the token pops in at 86 and its ring fires on the word "token" (102).
        { f0: 62, f1: 88, kind: 'reframe', to: POSE(AX - 0.05, -0.5, -40, 4.4, 1.45, 0.71) },
        // "token | for up to $10,000" (102-136): come back towards the front so the price is read face-on, landed
        // before the number starts to run (132).
        { f0: 112, f1: 134, kind: 'reframe', to: POSE(AX + 0.0, -0.65, -14, 4.7, 1.3, 0.72) },
      ] },
      { start: POSE(BX + 0.15, -0.4, -15, 5.9, 1.5, 0.70), moves: [
        // "In a match, the same token comes out of a chest, for free.": one slow arc around the chest for the whole
        // shot (one object, one line, one orbit).
        { f0: 184, f1: 291, kind: 'slow', to: POSE(BX + 0.4, -0.4, 19, 5.3, 1.4, 0.66) },
      ] },
    ],
  },
});
