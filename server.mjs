// Pimbo Studio server: serves the built site (dist/) and stores emails from the download and tutorials forms.
// Node built-ins only. Emails go to $DATA_DIR/subscribers.jsonl (one JSON object per line); mount DATA_DIR as a volume.
//   node server.mjs            PORT=3000 DATA_DIR=./data by default
// Routes: POST /api/subscribe {email, topic}  ·  GET /api/health  ·  everything else: static files from dist/
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || './data';
const LIST = path.join(DATA_DIR, 'subscribers.jsonl');
mkdirSync(DATA_DIR, { recursive: true });

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.zip': 'application/zip', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const TOPIC_RE = /^[a-z0-9-]{1,40}$/;

// at most 8 sign-ups per address per 10 minutes (memory only; enough for a small site)
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function subscribe(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return json(res, 429, { error: 'Too many tries, wait a few minutes.' });
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2048) return json(res, 413, { error: 'Too large.' });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Bad request.' }); }
  const email = String(body.email || '').trim().toLowerCase();
  const topic = String(body.topic || 'general').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json(res, 400, { error: 'That email does not look right.' });
  if (!TOPIC_RE.test(topic)) return json(res, 400, { error: 'Bad request.' });
  await appendFile(LIST, JSON.stringify({ email, topic, at: new Date().toISOString() }) + '\n');
  return json(res, 200, { ok: true });
}

function serveFile(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) file = path.join(ROOT, 'index.html');          // single page: unknown paths get the app
  const ext = path.extname(file).toLowerCase();
  const size = statSync(file).size;
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  };
  if (ext === '.zip') headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
  // videos need byte ranges for Safari
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range && ext === '.mp4') {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const p = new URL(req.url, 'http://x').pathname;
    if (p === '/api/subscribe' && req.method === 'POST') return await subscribe(req, res);
    if (p === '/api/health') return json(res, 200, { ok: true });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    return serveFile(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, 500, { error: 'Server error.' });
  }
}).listen(PORT, () => console.log(`Pimbo Studio on :${PORT}, emails -> ${LIST}`));
