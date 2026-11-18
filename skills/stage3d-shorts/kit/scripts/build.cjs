// Checks a plan and the kit, then bundles them into one file the page can load.
//   node scripts/build.cjs <plan>                -> dist/<plan>/bundle.js, index.html, preview.html
//   node scripts/build.cjs <plan> --check-only   -> only the checks
// Exit code 1 if a check fails; nothing is built in that case.
const fs = require('fs'), path = require('path');
const KIT = path.join(__dirname, '..');
const plan = process.argv[2], checkOnly = process.argv.includes('--check-only');
if (!plan || plan.startsWith('--')) { console.error('usage: node scripts/build.cjs <plan> [--check-only]'); process.exit(2); }
const planDir = path.join(KIT, 'plans', plan), planFile = path.join(planDir, 'plan.js');
if (!fs.existsSync(planFile)) { console.error(`no plan at ${planFile}`); process.exit(2); }
const rel = (f) => path.relative(KIT, f).replace(/\\/g, '/');
const problems = [];

// Check 1 (kit and plan): a trailing // comment that swallows the statements after it on the same line.
// It happened twice: an object was built but never added to the scene, and nothing failed.
function swallowedStatements(file) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/(?<![:'"`])\/\/(.*)$/); if (!m) return;
    if (/;/.test(m[1]) && /(\.add\(|\.push\(|\.position\.(set|copy)\(|\.rotation\.[xyz]\s*=|\.scale\.\w+\(|\bpop\(|\blevel\(|\bpulse\(|\bflare\()[^;]*;/.test(m[1]))
      problems.push(`${rel(file)}:${i + 1}: a statement is inside a comment -> ${line.trim().slice(0, 110)}`);
  });
}
// Check 2 (plan only): the plan may place and move things, but it may not reach into the look.
function planStaysOutOfTheLook(file) {
  const src = fs.readFileSync(file, 'utf8'), code = src.replace(/\/\/.*$/gm, '');
  for (const m of code.matchAll(/import\s+[^;]*?from\s+['"]([^'"]+)['"]/g)) {
    const from = m[1];
    if (!(from === '../../src/api.js' || (/^\.\/[\w.-]+\.(json|svg|png)$/).test(from))) problems.push(`${rel(file)}: imports "${from}"; a plan may import only ../../src/api.js and its own .json, .svg and .png files`);
  }
  const banned = [[/\bTHREE\b/, 'THREE (build things with the kit functions)'], [/\buniforms\b/, 'uniforms (use level, flare or dim)'], [/\.material\b/, '.material (use level, flare or dim)'],
    [/ShaderMaterial|MeshBasicMaterial/, 'a material'], [/new\s+Color\b/, 'a colour value (use colour names)'], [/['"`]#[0-9a-fA-F]{3,8}['"`]/, 'a hex colour (use colour names)'],
    [/Math\.random/, 'Math.random (use rng(seed))'], [/\bDate\b|\bperformance\b/, 'the clock'], [/requestAnimationFrame|setTimeout|setInterval/, 'a timer'],
    [/\bdocument\b|\bwindow\b|\bfetch\b/, 'the page (document, window, fetch)']];
  code.split(/\r?\n/).forEach((line, i) => { for (const [re, what] of banned) if (re.test(line)) problems.push(`${rel(file)}:${i + 1}: uses ${what}`); });
  if (!/export\s+default\s+definePlan\(/.test(code)) problems.push(`${rel(file)}: must end with "export default definePlan({...})"`);
}
for (const f of fs.readdirSync(path.join(KIT, 'src')).filter((n) => n.endsWith('.js'))) swallowedStatements(path.join(KIT, 'src', f));
swallowedStatements(planFile); planStaysOutOfTheLook(planFile);
if (problems.length) { for (const p of problems) console.error('CHECK FAILED  ' + p); process.exit(1); }
console.log(`checks ok (${plan})`);
if (checkOnly) process.exit(0);

const outDir = path.join(KIT, 'dist', plan); fs.mkdirSync(outDir, { recursive: true });
require('esbuild').buildSync({ entryPoints: [path.join(KIT, 'src', 'entry.js')], bundle: true, format: 'iife', loader: { '.otf': 'dataurl', '.svg': 'dataurl', '.png': 'dataurl' },
  alias: { '@plan': planFile }, outfile: path.join(outDir, 'bundle.js'), logLevel: 'error' });
const canvases = '<canvas id="gl" width="1080" height="1920" style="display:none"></canvas>\n<canvas id="out" width="1080" height="1920"></canvas>';
// index.html: what the render script loads. gl = the 3D render; out = the same frame with the caption on top.
fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>stage3d ${plan}</title>\n<style>html,body{margin:0;background:#000}canvas{display:block}</style>\n</head>\n<body>\n${canvases}\n<script src="bundle.js"></script>\n</body>\n</html>\n`);
// preview.html: open it in a browser to scrub and play the video with its audio. Not used for rendering.
fs.writeFileSync(path.join(outDir, 'preview.html'), `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>stage3d ${plan} - preview</title>
<style>
html,body{margin:0;background:#111;color:#ddd;font:14px system-ui,sans-serif;height:100%}
#wrap{display:flex;flex-direction:column;align-items:center;height:100%}
#out{height:calc(100vh - 64px);width:auto;display:block}
#bar{display:flex;gap:12px;align-items:center;width:min(900px,96vw);height:64px}
#bar input{flex:1}
button{background:#333;color:#eee;border:0;border-radius:6px;padding:8px 14px;font:inherit;cursor:pointer}
</style>
</head>
<body>
<div id="wrap">
${canvases}
<div id="bar"><button id="play">Play</button><input id="seek" type="range" min="0" value="0" step="1"><span id="num">0</span></div>
</div>
<audio id="snd" src="../../plans/${plan}/audio.wav" preload="auto"></audio>
<script src="bundle.js"></script>
<script>
window.READY.then(() => {
  const seek = document.getElementById('seek'), num = document.getElementById('num'), play = document.getElementById('play'), snd = document.getElementById('snd');
  seek.max = window.FRAMES - 1; let timer = null;
  const show = (f) => { window.drawFrame(f); seek.value = f; num.textContent = f + ' / ' + (window.FRAMES - 1); };
  const stop = () => { clearInterval(timer); timer = null; snd.pause(); play.textContent = 'Play'; };
  seek.addEventListener('input', () => { stop(); show(Number(seek.value)); });
  play.addEventListener('click', () => {
    if (timer) return stop();
    let f = Number(seek.value) >= window.FRAMES - 1 ? 0 : Number(seek.value); const t0 = performance.now() - f / 30 * 1000;
    snd.currentTime = f / 30; snd.play().catch(() => {}); play.textContent = 'Pause';
    timer = setInterval(() => { f = Math.floor((performance.now() - t0) / 1000 * 30); if (f >= window.FRAMES) return stop(); show(f); }, 1000 / 60);
  });
  show(0);
});
</script>
</body>
</html>
`);
console.log(`built dist/${plan}/bundle.js (${Math.round(fs.statSync(path.join(outDir, 'bundle.js')).size / 1024)} KB)`);
