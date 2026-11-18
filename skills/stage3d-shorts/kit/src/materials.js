// KIT / materials. Flat materials (solid shapes, text planes, soft sprites, translucent faces) and text textures.
import * as THREE from 'three';
import { U, tag, LINE, PAL } from './core.js';
import { FONT } from './fonts.js';

// ---------------------------------------------------------------------------------------------------------------------
// 3. Flat materials: solid shapes, text planes, soft sprites
// ---------------------------------------------------------------------------------------------------------------------
export const FLAT_VS = /* glsl */ `
  uniform float uMirror; uniform float uFadeLen; varying vec2 vUv; varying float vFade; varying float vWy; varying vec2 vWxz;
  void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWy = abs(wp.y); vWxz = wp.xz;
    vFade = mix(1.0, 0.035 + 0.5 * exp(-abs(wp.y) / uFadeLen), uMirror);
    gl_Position = projectionMatrix * viewMatrix * wp; }`;
export const ADDITIVE = { transparent: true, depthTest: true, depthWrite: false, blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };

// Opaque flat colour. Writes alpha 1 so the reflection behind it is hidden in the composite.
export function solidMat(pal) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: pal.core.clone() }, uGlowC: { value: pal.glow.clone() }, uGain: { value: 1 }, uTopLight: { value: 0 } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform vec3 uGlowC; uniform float uGain; uniform float uGlowPass; uniform float uBlack; uniform float uTopLight;
      varying float vFade; varying float vWy;
      void main(){ float lit = mix(1.0, mix(0.80, 1.0, smoothstep(0.0, 1.45, vWy)), uTopLight);      // lit from above: feet a little darker
        vec3 c = mix(uColor, uGlowC, uGlowPass) * uGain * lit * vFade * (1.0 - uBlack); gl_FragColor = vec4(c, 1.0); }`,
  });
}
// Text or any white-on-black texture, added as light of one colour.
export function textMat(tex, pal) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: tex }, uColor: { value: pal.core.clone() }, uGlowC: { value: pal.glow.clone() }, uOpacity: { value: 1 } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE,
    fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform vec3 uColor; uniform vec3 uGlowC; uniform float uOpacity; uniform float uGlowPass;
      varying vec2 vUv; varying float vFade;
      void main(){ float m = texture2D(uMap, vUv).r; if (m < 0.003) discard;
        gl_FragColor = vec4(mix(uColor, uGlowC, uGlowPass) * m * uOpacity * vFade, 0.0); }`,
  });
}
// Soft round gradient (contact pool under a figure) or a haze column. kind 0 = round, 1 = haze.
export function softMat(color, kind) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: color.clone() }, uOpacity: { value: 1 }, uKind: { value: kind } },
    vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; uniform float uKind; varying vec2 vUv;
      void main(){ vec2 p = (vUv - 0.5) * 2.0; float m;
        if (uKind < 0.5) { float r = length(p); m = exp(-r * r * 3.2) * smoothstep(1.0, 0.55, r); }
        else { m = exp(-p.x * p.x * 4.5) * pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.06, vUv.y); }   // brightest just above the floor
        gl_FragColor = vec4(uColor * m * uOpacity, 0.0); }`,
  });
}

// Text drawn on a 2D canvas, used as a texture. Returns {mesh, set(text)}; height = world height of the text box.
export function makeText(text, pal, { height, weight = 700, spacing = 0, px = 160, maxChars = null }) {
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  const font = `${weight} ${px}px "${FONT}"`;
  ctx.font = font; ctx.letterSpacing = `${spacing * px}px`;
  const ref = maxChars || text;
  cv.width = Math.ceil(ctx.measureText(ref).width + px * 0.3); cv.height = Math.ceil(px * 1.3);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  const draw = (t) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = font; ctx.letterSpacing = `${spacing * px}px`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(t, cv.width / 2 + spacing * px / 2, cv.height * 0.53); tex.needsUpdate = true; };
  draw(text);
  const wH = height * 1.3, wW = wH * cv.width / cv.height;
  const mesh = tag(new THREE.Mesh(new THREE.PlaneGeometry(wW, wH), textMat(tex, pal)), LINE);
  return { mesh, set: draw, width: wW };
}

// A picture (an SVG or PNG the plan imports) drawn as light of one colour: white parts shine, black parts are empty.
// Use black-and-white art: only its brightness is used. The file loads a moment after the scene is built, so the
// promise goes into pendingAssets and entry.js waits for all of them before the first frame is drawn.
export const pendingAssets = [];
export function makePicture(url, w, h, pal = PAL.white, px = 2048) {
  const cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w);
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  const img = new Image();
  pendingAssets.push(new Promise((done, fail) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      // The picture is in display values and the scene works in linear light: convert, or its greys come out too bright.
      const d = ctx.getImageData(0, 0, cv.width, cv.height), lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) { const c = i / 255; lut[i] = Math.round(255 * (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))); }
      for (let i = 0; i < d.data.length; i += 4) { d.data[i] = lut[d.data[i]]; d.data[i + 1] = lut[d.data[i + 1]]; d.data[i + 2] = lut[d.data[i + 2]]; }
      ctx.putImageData(d, 0, 0); tex.needsUpdate = true; done();
    };
    img.onerror = () => fail(new Error('picture: the image could not be loaded'));
  }));
  img.src = url;
  return tag(new THREE.Mesh(new THREE.PlaneGeometry(w, h), textMat(tex, pal)), LINE);
}

// Additive translucent face (gives a wire prop some volume, like the reference's trust cube).
export function fillMat(color) {
  return new THREE.ShaderMaterial({ uniforms: { ...U, uColor: { value: color.clone() }, uOpacity: { value: 1 } }, vertexShader: FLAT_VS, side: THREE.DoubleSide, ...ADDITIVE,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; varying float vFade; void main(){ gl_FragColor = vec4(uColor * uOpacity * vFade, 0.0); }` });
}
