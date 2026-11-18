// Opens the built page in a headless browser and saves frames as PNG.
//   node scripts/render.cjs <plan> clip [first last]   -> out/<plan>/frames/f_0000.png ... (last is not included; default: the whole video)
//   node scripts/render.cjs <plan> stills 0,60,110     -> out/<plan>/stills/still_0060.png ...
// Options:
//   --gpu          let the browser use the graphics card (without it the page is drawn in software, which is slow
//                  but works on a machine with no graphics card)
//   --workers=4    how many pages draw frames at the same time (default 1)
//   --keep         with "clip first last": leave the frames that are already there and only replace the range. Only
//                  after a change that you have checked does not touch any other frame (render a still of a frame
//                  outside the range and compare it with the frame on disk: in software they must be identical)
//   STAGE3D_BROWSER=path   use this Chromium/Chrome executable. Without it the installed Google Chrome is used,
//                          and Microsoft Edge if Chrome is not there. Nothing is downloaded.
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const KIT = path.join(__dirname, '..');
const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), pos = args.filter((a) => !a.startsWith('--'));
const [plan, mode, a, b] = pos;
if (!plan || !['clip', 'stills'].includes(mode)) { console.error('usage: node scripts/render.cjs <plan> clip [first last] | stills 0,60,110  [--gpu] [--workers=N]'); process.exit(2); }
const GPU = flags.includes('--gpu'), WORKERS = Math.max(1, Number((flags.find((f) => f.startsWith('--workers=')) || '--workers=1').split('=')[1]));
const ROOT = path.join(KIT, 'dist', plan), OUT = path.join(KIT, 'out', plan);
if (!fs.existsSync(path.join(ROOT, 'bundle.js'))) { console.error(`dist/${plan}/bundle.js not found: run "node scripts/build.cjs ${plan}" first`); process.exit(2); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const BROWSER_ARGS = GPU ? ['--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])]
                         : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
async function launch() {
  if (process.env.STAGE3D_BROWSER) return chromium.launch({ headless: true, args: BROWSER_ARGS, executablePath: process.env.STAGE3D_BROWSER });
  let last;
  for (const channel of ['chrome', 'msedge']) { try { return await chromium.launch({ headless: true, args: BROWSER_ARGS, channel }); } catch (e) { last = e; } }
  throw last;
}
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await launch(); const url = `http://127.0.0.1:${server.address().port}/index.html`;
  let said = false, failed = null;
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('console', (m) => { if (m.text().startsWith('[stage3d]') && !said) { said = true; console.log(m.text()); } });
    page.on('pageerror', (e) => { failed = failed || e.message; });
    await page.goto(url); await page.evaluate(() => window.READY);
    return page;
  };
  const first = await open().catch((e) => { failed = failed || e.message; return null; });
  if (!first || failed) { console.error('PAGE ERROR  ' + failed); await browser.close(); server.close(); process.exit(1); }
  const info = await first.evaluate(() => window.PLAN_INFO);
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'plan_info.json'), JSON.stringify(info, null, 1));
  const stills = mode === 'stills';
  const list = stills ? a.split(',').map(Number) : Array.from({ length: Number(b ?? info.frames) - Number(a ?? 0) }, (_, i) => Number(a ?? 0) + i);
  const dir = path.join(OUT, stills ? 'stills' : 'frames');
  if (!stills && !flags.includes('--keep')) fs.rmSync(dir, { recursive: true, force: true });           // never mix frames of two renders, unless asked to
  fs.mkdirSync(dir, { recursive: true });
  const fileOf = (f) => path.join(dir, `${stills ? 'still' : 'f'}_${String(f).padStart(4, '0')}.png`);
  const t0 = Date.now(); let next = 0;
  // Each worker is one page with its own copy of the engine. A worker takes the next frame nobody has taken yet.
  const work = async (page) => {
    while (next < list.length && !failed) {
      const f = list[next++];
      const png = await page.evaluate((n) => window.renderFrame(n), f);
      fs.writeFileSync(fileOf(f), Buffer.from(png.split(',')[1], 'base64'));
    }
    await page.close();
  };
  const pages = [first, ...(await Promise.all(Array.from({ length: Math.min(WORKERS, list.length) - 1 }, open)))];
  await Promise.all(pages.map(work));
  await browser.close(); server.close();
  if (failed) { console.error('PAGE ERROR  ' + failed); process.exit(1); }
  console.log(`${list.length} ${stills ? 'still(s)' : 'frames'} in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${pages.length} worker(s), ${GPU ? 'graphics card' : 'software'} -> out/${plan}/${stills ? 'stills' : 'frames'}`);
})().catch((e) => { console.error('RENDER FAILED  ' + e.message); process.exit(1); });
