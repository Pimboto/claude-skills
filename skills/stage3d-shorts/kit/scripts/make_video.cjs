// One command from plan to finished video: checks, build, render, encode, quality control.
//   node scripts/make_video.cjs <plan> [--gpu] [--workers=4] [--no-qa]
// Prints one line per step; the full output of each step goes to out/<plan>/logs/. Exit code 1 if a step fails.
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const KIT = path.join(__dirname, '..'), args = process.argv.slice(2), plan = args.find((a) => !a.startsWith('--'));
if (!plan) { console.error('usage: node scripts/make_video.cjs <plan> [--gpu] [--workers=4] [--no-qa]'); process.exit(2); }
const flags = args.filter((a) => a.startsWith('--')), logs = path.join(KIT, 'out', plan, 'logs'); fs.mkdirSync(logs, { recursive: true });
const node = (script, ...rest) => [process.execPath, [path.join(__dirname, script), ...rest]];
function step(name, [cmd, argv], { optional = false } = {}) {
  const t0 = Date.now(), r = spawnSync(cmd, argv, { cwd: KIT, encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '') + (r.error ? String(r.error.message) : '');
  fs.writeFileSync(path.join(logs, `${name}.log`), text);
  const ok = !r.error && r.status === 0, last = text.trim().split(/\r?\n/).filter((l) => l.trim()).slice(ok ? -1 : -6).join('\n    ');
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(7)} ${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s  ${last}`);
  if (!ok && !optional) { console.log(`stopped. Full output: out/${plan}/logs/${name}.log`); process.exit(1); }
  return ok;
}
step('build', node('build.cjs', plan));
step('render', node('render.cjs', plan, 'clip', ...flags.filter((f) => f === '--gpu' || f.startsWith('--workers='))));
step('encode', node('encode.cjs', plan));
if (flags.includes('--no-qa')) { console.log('quality control skipped (--no-qa): this video is NOT checked'); process.exit(0); }
// the quality control needs Python with numpy and opencv
const py = ['python', 'python3', 'py'].find((p) => { const r = spawnSync(p, ['-c', 'import numpy, cv2'], { encoding: 'utf8' }); return !r.error && r.status === 0; });
if (!py) { console.log('FAIL qa      Python with numpy and opencv was not found (pip install numpy opencv-python): this video is NOT checked'); process.exit(1); }
const passed = step('qa', [py, [path.join(__dirname, 'qa.py'), plan]], { optional: true });
console.log(passed ? `done: out/${plan}/${plan}.mp4` : `the video was made but did NOT pass quality control: read out/${plan}/logs/qa.log before using it`);
process.exit(passed ? 0 : 1);
