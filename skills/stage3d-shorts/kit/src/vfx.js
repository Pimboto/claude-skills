// KIT / vfx. Light effects: theatre spotlight, floor pools, rays, sparks.
import * as THREE from 'three';
import { FIG_H, U, tag, FX, rng } from './core.js';
import { QUAD_CORNERS, QUAD_INDEX } from './lines.js';
import { FLAT_VS, ADDITIVE, softMat } from './materials.js';

// 4.10 VFX layer ------------------------------------------------------------------------------------------------------
// Theatre spotlight on a figure. Measured on the reference (video 1, frames 200-230, median of 16 frames):
// a soft cone from above; its width grows linearly towards the floor (about 2.1 figure heights wide at the floor, apex
// about 6.3 figure heights up); it is brightest just above the figure and fades upwards; +15 codes over black at most.
export const BEAM = { apex: 6.3 * FIG_H, sigma0: 1.8 * FIG_H / 2.355, top: 1.35 * FIG_H, decay: 2.0 * FIG_H };
export function makeBeam(tint, shadowDir) {
  const Hq = 10.0, Wq = 7.0;
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, uColor: { value: tint.clone() }, uOpacity: { value: 1 }, uFrame: { value: 0 } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE, depthTest: false,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; uniform float uFrame; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){ float x = (vUv.x - 0.5) * ${Wq.toFixed(1)}; float y = vUv.y * ${Hq.toFixed(1)};
        float sig = ${BEAM.sigma0.toFixed(3)} * max(0.05, 1.0 - y / ${BEAM.apex.toFixed(2)});
        float across = exp(-x * x / (2.0 * sig * sig));
        float along = exp(-max(0.0, y - ${BEAM.top.toFixed(2)}) / ${BEAM.decay.toFixed(2)}) * smoothstep(0.0, 0.35, y) * smoothstep(${Hq.toFixed(1)}, ${(Hq * 0.72).toFixed(1)}, y);
        float dust = 0.80 + 0.40 * noise(vec2(x * 1.1 + 3.0, y * 0.8 - uFrame * 0.012)) * (0.6 + 0.8 * noise(vec2(x * 3.3 + 9.0, y * 2.1 + uFrame * 0.02)));
        gl_FragColor = vec4(uColor * across * along * dust * uOpacity, 0.0); }` });
  const g = new THREE.Group();
  const cone = tag(new THREE.Mesh(new THREE.PlaneGeometry(Wq, Hq), m), FX, true); cone.position.y = Hq / 2; g.add(cone);
  // where the cone meets the floor: a wide, dim disc of light
  // The light sits above, behind and to one side of the figure, so the figure throws a long soft shadow forwards and
  // sideways. Sideways matters: straight towards the viewer it would hide under the figure's own reflection.
  const footM = new THREE.ShaderMaterial({ uniforms: { ...U, uColor: { value: tint.clone().multiplyScalar(2.0) }, uOpacity: { value: 1 }, uFig: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(shadowDir[0], shadowDir[1]).normalize() } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; uniform vec2 uFig; uniform vec2 uDir; varying vec2 vUv; varying vec2 vWxz;
      void main(){ vec2 q = (vUv - 0.5) * 2.0; float r = length(q); float disc = exp(-r * r * 3.2) * smoothstep(1.0, 0.55, r);
        vec2 d = vWxz - uFig; float along = dot(d, uDir); float across = dot(d, vec2(-uDir.y, uDir.x));
        float wdt = 0.32 + 0.13 * max(along, 0.0);                                    // the shadow widens as it runs away from the feet
        float sh = exp(-across * across / (2.0 * wdt * wdt)) * smoothstep(-0.15, 0.25, along) * exp(-max(along, 0.0) / 2.6);
        gl_FragColor = vec4(uColor * disc * (1.0 - 0.92 * sh) * uOpacity, 0.0); }` });
  const foot = tag(new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), footM), FX, true);
  foot.rotation.x = -Math.PI / 2; foot.position.y = 0.003; g.add(foot);
  g.userData.mat = m; g.userData.foot = foot.material;
  return g;
}
// A pool of coloured light on the floor under something that glows (the reference has a red pool under its opening number).
export function makePool(color, w, d) {
  const m = tag(new THREE.Mesh(new THREE.PlaneGeometry(w, d), softMat(color, 0)), FX, true);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.005; return m;
}

// Rays of light fanning up out of the open chest.
export function makeRays() {
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, uColor: { value: new THREE.Color(1.5, 0.95, 0.28) }, uOpacity: { value: 0 }, uFrame: { value: 0 } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE, depthTest: false,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; uniform float uFrame; varying vec2 vUv;
      void main(){ vec2 p = vec2((vUv.x - 0.5) * 4.0, vUv.y * 4.2); float r = length(p); float a = atan(p.x, p.y);
        float fan = smoothstep(0.40, 0.08, abs(a)) * smoothstep(1.0, 0.55, abs(vUv.x * 2.0 - 1.0)) * smoothstep(1.0, 0.6, vUv.y);
        float rays = 0.30 + 0.70 * pow(0.5 + 0.5 * sin(a * 19.0 + uFrame * 0.045), 3.0) * (0.55 + 0.45 * sin(a * 7.0 - uFrame * 0.03 + 1.7));
        float fall = exp(-r / 1.35) * smoothstep(0.0, 0.3, r);
        gl_FragColor = vec4(uColor * fan * rays * fall * uOpacity, 0.0); }` });
  const mesh = tag(new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.2), m), FX, true); mesh.geometry.translate(0, 2.1, 0); return mesh;
}
// Sparks: each one is born at t0, flies with its own velocity, falls a little, shrinks and dies. Fully determined by the frame.
export function makeSparks(n, seed, color, { t0, spread, speed, up, life, ring = 0 }) {
  const r = rng(seed), a0 = new Float32Array(n * 3), v = new Float32Array(n * 3), d = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, sp = speed * (0.4 + r());
    if (ring) { a0[i * 3] = Math.cos(th) * ring * 1.5; a0[i * 3 + 1] = Math.sin(th) * ring * 0.8; a0[i * 3 + 2] = 0.02;          // start on a ring (the card frame)
      v[i * 3] = Math.cos(th) * sp; v[i * 3 + 1] = Math.sin(th) * sp * 0.7 + up; v[i * 3 + 2] = (r() - 0.5) * sp; }
    else { a0[i * 3] = (r() - 0.5) * spread; a0[i * 3 + 1] = r() * 0.2; a0[i * 3 + 2] = (r() - 0.5) * spread;
      v[i * 3] = Math.cos(th) * sp; v[i * 3 + 1] = up * (0.5 + r()); v[i * 3 + 2] = Math.sin(th) * sp; }
    d[i * 3] = t0 + r() * 14; d[i * 3 + 1] = life * (0.6 + 0.8 * r()); d[i * 3 + 2] = 0.03 + r() * 0.035;
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  g.setAttribute('corner', new THREE.BufferAttribute(QUAD_CORNERS, 2)); g.setIndex(QUAD_INDEX);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(a0, 3)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(v, 3));
  g.setAttribute('iD', new THREE.InstancedBufferAttribute(d, 3)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, uColor: { value: color.clone() }, uFrame: { value: 0 } }, ...ADDITIVE, depthTest: false,
    vertexShader: /* glsl */ `attribute vec2 corner; attribute vec3 iP; attribute vec3 iV; attribute vec3 iD; uniform float uFrame; varying vec2 vC; varying float vA;
      void main(){ float t = uFrame - iD.x; if (t < 0.0 || t > iD.y) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float k = t / iD.y; vec3 p = iP + iV * t * (1.0 - 0.35 * k) + vec3(0.0, -0.0016 * t * t, 0.0);            // drag, then a little gravity
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); mv.xy += corner * iD.z * (1.0 - 0.6 * k);
        gl_Position = projectionMatrix * mv; vC = corner; vA = (1.0 - k) * (1.0 - k) * smoothstep(0.0, 1.5, t); }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; varying vec2 vC; varying float vA; void main(){ float r = length(vC); float m = exp(-r * r * 5.0);
        gl_FragColor = vec4(uColor * m * vA * 2.2, 0.0); }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return tag(mesh, FX, true);
}

// A soft round glow that follows something bright (a floating token).
export function makeHalo(color, size) {
  return tag(new THREE.Mesh(new THREE.PlaneGeometry(size, size), softMat(color, 0)), FX, true);
}
