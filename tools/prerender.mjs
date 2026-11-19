// After `vite build` (the browser code) and `vite build --ssr src/entry-server.jsx` (the same app for Node), write
// the page already rendered: dist/index.html in English and dist/index.es.html in Spanish. Visitors see the page
// before any script runs, search engines read the text, and server.mjs serves the language the visitor reads.
// Also: the first-visit intro layer, and preloads for the sky picture and the main font (their names carry hashes).
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR = path.join(ROOT, 'dist-ssr');
const SITE = 'https://skills.pimbo.dev/';

const { render, renderIntro } = await import(pathToFileURL(path.join(SSR, 'entry-server.js')).href);
const assets = readdirSync(path.join(DIST, 'assets'));
const asset = (re) => {
  const f = assets.find((a) => re.test(a));
  if (!f) throw new Error(`prerender: no asset matches ${re}`);
  return `/assets/${f}`;
};

const preloads = [
  `<link rel="preload" as="image" type="image/avif" fetchpriority="high" media="(max-width: 980px)" href="${asset(/^hero-sky-phone-[\w-]{8}\.avif$/)}" />`,
  `<link rel="preload" as="image" type="image/avif" fetchpriority="high" media="(min-width: 981px)" href="${asset(/^hero-sky-[\w-]{8}\.avif$/)}" />`,
  `<link rel="preload" as="font" type="font/woff2" crossorigin href="${asset(/^mona-sans-latin-wght-normal-[\w-]+\.woff2$/)}" />`,
].join('\n    ');

const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
// React adds an image preload for every picture it renders; the pictures are right there in the HTML, and the
// preloads would compete with the sky (the largest paint) and are not part of what the browser code hydrates
const noPreloads = (html) => html.replace(/<link rel="preload" as="image"[^>]*\/>/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page(lang) {
  const { app: rendered, head } = render(lang);
  const app = noPreloads(rendered);
  const intro = noPreloads(renderIntro(lang));
  const [title, description] = head.map(esc);
  let html = template
    .replace('</head>', `    ${preloads}\n  </head>`)
    .replace("'__INTRO_IMG__'", `'${asset(/^claude-[\w-]{8}\.webp$/)}'`)
    .replace(/<div id="root">[\s\S]*?<\/noscript>\s*<\/div>/, () => `${intro}\n    <div id="root" data-prerendered="1">${app}</div>`);
  if (!html.includes('data-prerendered')) throw new Error('prerender: #root not found in dist/index.html');
  if (lang === 'es') {
    const url = `${SITE}?lang=es`;
    html = html
      .replace('<html lang="en">', '<html lang="es">')
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*"/, `$1${description}"`)
      .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
      .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${title}"`)
      .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${description}"`)
      .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${description}"`)
      .replace(`<link rel="canonical" href="${SITE}" />`, `<link rel="canonical" href="${url}" />`)
      .replace(`<meta property="og:url" content="${SITE}" />`, `<meta property="og:url" content="${url}" />`)
      .replace('<meta property="og:locale" content="en_US" />', '<meta property="og:locale" content="es_CO" />')
      .replace('<meta property="og:locale:alternate" content="es_CO" />', '<meta property="og:locale:alternate" content="en_US" />');
  }
  return html;
}

writeFileSync(path.join(DIST, 'index.html'), page('en'));
writeFileSync(path.join(DIST, 'index.es.html'), page('es'));
rmSync(SSR, { recursive: true, force: true });
console.log('prerendered dist/index.html (en) and dist/index.es.html (es)');
