// KIT / lines. Neon lines: instanced capsules with a width in world units and a minimum width in pixels.
import * as THREE from 'three';
import { U, tag, LINE } from './core.js';

// ---------------------------------------------------------------------------------------------------------------------
// 2. Lines: instanced capsules with a width in world units and a minimum width in pixels (objects.md 5.2)
// ---------------------------------------------------------------------------------------------------------------------
export const LINE_VS = /* glsl */ `
  attribute vec2 corner; attribute vec3 iA; attribute vec3 iB; attribute float iW;
  uniform vec2 uRes; uniform float uMinPx; uniform float uMirror; uniform float uFadeLen; uniform float uFixedW;
  varying vec2 vP; varying vec2 vA; varying vec2 vB; varying float vR; varying float vFade;
  void main(){
    vec4 wa = modelMatrix * vec4(iA, 1.0); vec4 wb = modelMatrix * vec4(iB, 1.0);
    vec4 a = projectionMatrix * viewMatrix * wa; vec4 b = projectionMatrix * viewMatrix * wb;
    if (a.w < 0.05 || b.w < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }   // behind the camera
    vec2 sa = (a.xy / a.w * 0.5 + 0.5) * uRes; vec2 sb = (b.xy / b.w * 0.5 + 0.5) * uRes;
    float ws = mix(length(modelMatrix[0].xyz), 1.0, uFixedW);                            // object scale scales the width
    float k = projectionMatrix[1][1] * 0.5 * uRes.y;
    float pa = max(iW * ws * k / a.w, uMinPx); float pb = max(iW * ws * k / b.w, uMinPx); // world width -> px, clamped
    float t = corner.x * 0.5 + 0.5;
    vec2 d = normalize(sb - sa + 1e-6); vec2 n = vec2(-d.y, d.x);
    float r = mix(pa, pb, t) * 0.5 + 1.5;
    vec2 s = mix(sa, sb, t) + d * corner.x * r + n * corner.y * r;
    vec4 c = mix(a, b, t);
    gl_Position = vec4((s / uRes * 2.0 - 1.0) * c.w, c.z, c.w);
    vP = s; vA = sa; vB = sb; vR = mix(pa, pb, t) * 0.5;
    float h = abs(mix(wa.y, wb.y, t));
    vFade = mix(1.0, 0.035 + 0.5 * exp(-h / uFadeLen), uMirror);                         // measured mirror falloff
  }`;
export const LINE_FS = /* glsl */ `
  uniform vec3 uCore; uniform vec3 uGlowC; uniform float uGain; uniform float uOpacity; uniform float uGlowPass;
  varying vec2 vP; varying vec2 vA; varying vec2 vB; varying float vR; varying float vFade;
  void main(){
    vec2 ab = vB - vA; float h = clamp(dot(vP - vA, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float dist = length(vP - vA - ab * h);
    float core = 1.0 - smoothstep(vR - 0.75, vR + 0.75, dist);
    if (core <= 0.0) discard;
    vec3 col = mix(uCore, uGlowC, uGlowPass) * uGain * uOpacity * vFade * core;          // flat, unlit
    gl_FragColor = vec4(col, 0.0);
  }`;
export const QUAD_CORNERS = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
export const QUAD_INDEX = [0, 1, 2, 0, 2, 3];

export class LineSet {
  constructor(pal, opts = {}) { this.pal = pal; this.segs = []; this.opts = opts; }
  seg(a, b, w) { this.segs.push(a[0], a[1], a[2], b[0], b[1], b[2], w); return this; }
  poly(pts, w, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i], pts[i + 1], w);
    if (closed) this.seg(pts[pts.length - 1], pts[0], w);
    return this;
  }
  // arc in the plane spanned by unit vectors ux, uy around centre c
  arc(c, r, ux, uy, a0, a1, n, w) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, cs = Math.cos(a) * r, sn = Math.sin(a) * r;
      pts.push([c[0] + ux[0] * cs + uy[0] * sn, c[1] + ux[1] * cs + uy[1] * sn, c[2] + ux[2] * cs + uy[2] * sn]); }
    return this.poly(pts, w);
  }
  build() {
    const n = this.segs.length / 7, A = new Float32Array(n * 3), B = new Float32Array(n * 3), Wd = new Float32Array(n);
    for (let i = 0; i < n; i++) { A.set(this.segs.slice(i * 7, i * 7 + 3), i * 3); B.set(this.segs.slice(i * 7 + 3, i * 7 + 6), i * 3); Wd[i] = this.segs[i * 7 + 6]; }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('corner', new THREE.BufferAttribute(QUAD_CORNERS, 2));
    g.setIndex(QUAD_INDEX);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 3));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 3));
    g.setAttribute('iW', new THREE.InstancedBufferAttribute(Wd, 1));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uCore: { value: this.pal.core.clone() }, uGlowC: { value: this.pal.glow.clone() },
        uGain: { value: 1 }, uOpacity: { value: 1 }, uFixedW: { value: this.opts.fixedW ? 1 : 0 } },
      vertexShader: LINE_VS, fragmentShader: LINE_FS, side: THREE.DoubleSide,
      transparent: true, depthTest: true, depthWrite: false,
      // MAX blending: where two lines cross or join, the pixel takes the brighter one. No hot dots at the joints.
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
    return tag(mesh, LINE, !!this.opts.noMirror);
  }
}

// Rounded rectangle outline in the XY plane, centred on the origin
export function roundRect(set, w, h, r, lw, z = 0) {
  const x = w / 2, y = h / 2, X = [1, 0, 0], Y = [0, 1, 0], q = Math.PI / 2;
  set.seg([-x + r, y, z], [x - r, y, z], lw).seg([x, y - r, z], [x, -y + r, z], lw)
     .seg([x - r, -y, z], [-x + r, -y, z], lw).seg([-x, -y + r, z], [-x, y - r, z], lw);
  set.arc([x - r, y - r, z], r, X, Y, 0, q, 8, lw).arc([-x + r, y - r, z], r, X, Y, q, 2 * q, 8, lw)
     .arc([-x + r, -y + r, z], r, X, Y, 2 * q, 3 * q, 8, lw).arc([x - r, -y + r, z], r, X, Y, 3 * q, 4 * q, 8, lw);
  return set;
}
