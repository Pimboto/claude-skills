// KIT / post. The passes that turn the 3D scene into the final picture: mirror floor, two glows, composite,
// whip blur, vignette, sRGB and dither.
import * as THREE from 'three';
import { W, H, S, BG, renderer, scene, world, camera, U, tagged, SOLID, LINE, FX } from './core.js';

// ---------------------------------------------------------------------------------------------------------------------
// 7. Post: mirror floor, two glows, vignette, whip blur (stage.md section 5)
// ---------------------------------------------------------------------------------------------------------------------
export const rt = (w, h, depth = false) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat,
  minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: depth });
export const hw = W / 2, hh = H / 2;
export const tMain = rt(W, H, true), tRefl = rt(W, H, true), tReflA = rt(W, H), tReflB = rt(W, H), tComp = rt(W, H);
export const tGl = rt(hw, hh, true), tGs = rt(hw, hh, true);                           // glow sources at half size
export const lvl = (d) => [Math.round(W / d), Math.round(H / d)];
export const tL = { a1: rt(hw, hh), a2: rt(hw, hh), q: rt(...lvl(4)), b1: rt(...lvl(4)), b2: rt(...lvl(4)), e: rt(...lvl(8)), s: rt(...lvl(16)), c1: rt(...lvl(16)), c2: rt(...lvl(16)) };
export const tS = { a1: rt(hw, hh), a2: rt(hw, hh), q: rt(...lvl(4)), b1: rt(...lvl(4)), b2: rt(...lvl(4)) };

export const fsScene = new THREE.Scene(), fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
export const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); fsQuad.frustumCulled = false; fsScene.add(fsQuad);
export const FS_VS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
export const fsMat = (fragmentShader, uniforms) => new THREE.ShaderMaterial({ vertexShader: FS_VS, fragmentShader, uniforms, depthTest: false, depthWrite: false });
export const copyMat = fsMat(/* glsl */ `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }`, { tSrc: { value: null } });
export const makeBlurMat = (R) => fsMat(/* glsl */ `uniform sampler2D tSrc; uniform vec2 uStep; uniform float uSigma; varying vec2 vUv;
  void main(){ vec4 acc = vec4(0.0); float wsum = 0.0;
    for (int i = -${R}; i <= ${R}; i++) { float x = float(i); float w = exp(-x * x / (2.0 * uSigma * uSigma)); acc += texture2D(tSrc, vUv + uStep * x) * w; wsum += w; }
    gl_FragColor = acc / wsum; }`, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() }, uSigma: { value: 1 } });
export const blurWide = makeBlurMat(12), blurSmall = makeBlurMat(7);
export const compMat = fsMat(/* glsl */ `
  uniform sampler2D tMain, tRefl, tLa, tLb, tLc, tSa, tSb; uniform vec3 uBg; uniform vec3 uKL; uniform vec2 uKS; uniform float uExposure; varying vec2 vUv;
  void main(){
    vec4 m = texture2D(tMain, vUv);
    vec3 c = uBg + m.rgb + texture2D(tRefl, vUv).rgb * (1.0 - clamp(m.a, 0.0, 1.0));     // solids hide the reflection behind them
    c += uKL.x * texture2D(tLa, vUv).rgb + uKL.y * texture2D(tLb, vUv).rgb + uKL.z * texture2D(tLc, vUv).rgb;   // glow of lines
    c += uKS.x * texture2D(tSa, vUv).rgb + uKS.y * texture2D(tSb, vUv).rgb;                                     // glow of solid shapes
    gl_FragColor = vec4(c * uExposure, 1.0); }`,
  { tMain: { value: tMain.texture }, tRefl: { value: tReflB.texture }, tLa: { value: tL.a2.texture }, tLb: { value: tL.b2.texture }, tLc: { value: tL.c2.texture },
    tSa: { value: tS.a2.texture }, tSb: { value: tS.b2.texture }, uBg: { value: BG },
    uKL: { value: new THREE.Vector3(0.150, 0.049, 0.064) },      // measured weights for thin lines (sigma 2.8 / 9 / 40 px at 720p)
    uKS: { value: new THREE.Vector2(0.265, 0.048) },             // measured weights for solid shapes (sigma 3 / 9.6 px at 720p)
    uExposure: { value: 1 } });
export const finalMat = fsMat(/* glsl */ `
  uniform sampler2D tSrc; uniform vec2 uVel; uniform vec2 uRes; varying vec2 vUv;
  vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  void main(){
    vec3 c = vec3(0.0); vec2 streak = uVel * 0.35 / uRes;                                 // shutter 0.35 frame (guess)
    if (length(uVel) < 1.5) c = texture2D(tSrc, vUv).rgb;
    else { for (int i = 0; i < 32; i++) { float k = float(i) / 31.0 - 0.5; c += texture2D(tSrc, vUv + streak * k).rgb; } c /= 32.0; }
    float r = length((vUv - 0.5) * vec2(720.0, 1280.0));
    c *= 1.0 - 0.48 * smoothstep(512.0, 736.0, r);                                        // measured vignette: 0.52 in the corners
    c = toSRGB(clamp(c, 0.0, 1.0));                                                       // cores clip at white, as in the reference
    float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0); }`,                                   // dither so the dark vignette does not band
  { tSrc: { value: tComp.texture }, uVel: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2(W, H) } });

export function fsPass(mat, target) { fsQuad.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); }
export function blur(src, tmp, dst, sigma, blurMat = blurWide) {
  blurMat.uniforms.uSigma.value = sigma;
  blurMat.uniforms.tSrc.value = src.texture; blurMat.uniforms.uStep.value.set(1 / src.width, 0); fsPass(blurMat, tmp);
  blurMat.uniforms.tSrc.value = tmp.texture; blurMat.uniforms.uStep.value.set(0, 1 / src.height); fsPass(blurMat, dst);
}
export function down(src, dst) { copyMat.uniforms.tSrc.value = src.texture; fsPass(copyMat, dst); }

// Draw the world into a target. classes = which object classes are visible; mirror = draw it upside down under the floor.
export function drawWorld(target, { classes, mirror, glow, black = false, clearColor = true }) {
  for (const o of tagged) o.userData.keep = o.visible;
  for (const o of tagged) o.visible = o.userData.keep && classes.includes(o.userData.cls) && !(mirror && o.userData.noMirror) && !(o.userData.on === false);
  U.uMirror.value = mirror ? 1 : 0; U.uGlowPass.value = glow ? 1 : 0; U.uBlack.value = black ? 1 : 0;
  U.uRes.value.set(target.width, target.height); U.uMinPx.value = 3.0 * S * target.width / W;
  world.scale.y = mirror ? -1 : 1; world.updateMatrixWorld(true);
  renderer.setRenderTarget(target);
  if (clearColor) { renderer.setClearColor(0x000000, 0); renderer.clear(true, true, false); } else renderer.clear(false, true, false);
  renderer.render(scene, camera);
  for (const o of tagged) o.visible = o.userData.keep;
  world.scale.y = 1; world.updateMatrixWorld(true);
}

// Draws the current state of the world to the #gl canvas. exposure and vel come from the camera (whip-pan).
export function renderPasses(exposure, vel) {
  // 1. the floor reflection, softened a little (measured: sigma about 1.75 px at 720p)
  drawWorld(tRefl, { classes: [SOLID, LINE], mirror: true, glow: false });
  blur(tRefl, tReflA, tReflB, 1.75 * S, blurSmall);
  // 2. the scene itself
  drawWorld(tMain, { classes: [SOLID, LINE, FX], mirror: false, glow: false });
  // 3. glow source of the lines (solids drawn black so they hide the lines behind them), then of the solids
  drawWorld(tGl, { classes: [LINE], mirror: true, glow: true });
  U.uBlack.value = 1; drawWorld(tGl, { classes: [SOLID, LINE], mirror: false, glow: true, black: true, clearColor: false });
  drawWorld(tGs, { classes: [SOLID], mirror: true, glow: true });
  drawWorld(tGs, { classes: [SOLID], mirror: false, glow: true, clearColor: false });
  // 4. blur chains. Sigmas are given at 720p; each level works on a smaller copy.
  blur(tGl, tL.a1, tL.a2, 2.8 * S / 2); down(tGl, tL.q); blur(tL.q, tL.b1, tL.b2, 9.0 * S / 4);
  down(tL.q, tL.e); down(tL.e, tL.s); blur(tL.s, tL.c1, tL.c2, 40.0 * S / 16);
  blur(tGs, tS.a1, tS.a2, 3.0 * S / 2); down(tGs, tS.q); blur(tS.q, tS.b1, tS.b2, 9.6 * S / 4);
  // 5. composite, then whip blur + vignette + sRGB to the screen
  // 5. composite, then whip blur + vignette + sRGB to the screen
  compMat.uniforms.uExposure.value = exposure; fsPass(compMat, tComp);
  finalMat.uniforms.uVel.value.copy(vel); fsPass(finalMat, null);
  renderer.getContext().finish();
}
