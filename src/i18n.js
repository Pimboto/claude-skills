// English and Spanish. The language is the visitor's choice (remembered), else the browser's language.
// useLang() gives { lang, t, setLang, pick }: t(key, ...args) for UI text, pick({en, es}) for skill content.
import { useSyncExternalStore } from 'react';
import flagEn from './media/flag-en.svg';
import flagEs from './media/flag-es.svg';

export const LANGS = [
  { id: 'en', label: 'EN', name: 'English', flag: flagEn },
  { id: 'es', label: 'ES', name: 'Español', flag: flagEs },
];

const DICT = {
  en: {
    new: 'New',
    banner_long: 'toy-loops is out: paper 3D animations of Claude, made in Blender.',
    banner_short: 'toy-loops is out',
    banner_btn: 'Watch it',
    nav_skills: 'Skills', nav_showreel: 'Showreel', nav_tutorials: 'Tutorials', nav_docs: 'Docs', soon: 'Soon',
    open_source: 'Open source', get_skills: 'Get the skills',
    sound_on: 'Sound on', sound_off: 'Sound off', sound_turn_on: 'Turn sound on', sound_turn_off: 'Turn sound off',
    language: 'Language',
    eyebrow: 'Skills for Claude Code · free on GitHub',
    h1: 'Skills that turn Claude into a studio.',
    lede: 'Videos, animations and pictures, each made by a skill you can install. Watch what it makes, then download it.',
    browse: 'Browse skills', view_github: 'View on GitHub',
    stats: (out, way) => [out, ' skills out', way, ' on the way', '8 s', ' seamless loops'],
    home: 'Home', skills_label: 'Skills', by: 'by Pimbo', source: 'Source', download_skill: 'Download skill',
    tab_preview: 'Preview', tab_install: 'Install',
    kind_Animation: 'Animation', kind_Video: 'Video', kind_Analysis: 'Analysis',
    install: (n) => [
      ['Download ', n, '.zip (the button above) or take the source from GitHub.'],
      ['In the Claude app, upload the .zip in your skills settings, or for Claude Code unzip it into ', '~/.claude/skills/', '.'],
      ['Ask Claude for what you want; the skill tells it how.'],
    ],
    prompt_title: 'Install it with Claude', copy_prompt: 'Copy prompt', copied: 'Copied', by_hand: 'Or by hand',
    prompt_sub: 'Copy this prompt and paste it into Claude Code. Claude installs the skill and what it needs, asking you first.',
    install_prompt: ({ id, name, needs, tryIt }) => `Install the Claude Code skill "${name}" on this computer for me.

1. Get the folder skills/${id} from https://github.com/Pimboto/claude-skills (a shallow, sparse git clone of only that folder is enough).
2. Put it in my personal skills folder: ~/.claude/skills/${id} (on Windows: %USERPROFILE%\\.claude\\skills\\${id}). If that folder already exists, ask me before replacing it.
3. Read its SKILL.md. It needs ${needs}. Check what I already have, tell me what is missing, and install it only after I say yes.
4. When it is ready, tell me in two lines what the skill does and whether I need to restart Claude Code, and give me a first prompt to try, like: "${tryIt}"

Do not change anything else on my computer.`,
    dl_title: (n) => `Download ${n}`,
    dl_text: 'Leave your email and the download starts. We will only write when there is a new skill or tutorial.',
    email_ph: 'you@email.com', download: 'Download', sending: 'Sending…',
    done_title: 'Your download started', done_text: 'Thanks! If it did not start,', close: 'Close',
    email_bad: 'That email does not look right.', err_many: 'Too many tries. Wait a few minutes.',
    err_generic: 'Something went wrong. Try again.',
    cta_soon: 'Coming soon', cta_tag: 'Tutorials', cta_h2: 'Learn to make these with Claude.',
    cta_lede: 'Step-by-step tutorials for every skill are on the way: from the first prompt to the finished loop. Leave your email and we will tell you when the first one is out.',
    notify: 'Notify me', notify_done: 'You are on the list. We will write when the first tutorial is out.',
    foot_text: 'Skills for Claude Code that make videos, animations and pictures. Made with Claude Code, rendered in Blender.',
    star: 'Star on GitHub', col_skills: 'Skills', col_studio: 'Studio', col_pimbo: 'Pimbo', site_source: 'Source of this site',
    fan: 'Claude and its mascot belong to Anthropic. This is a fan project, not affiliated with Anthropic.',
  },
  es: {
    new: 'Nuevo',
    banner_long: 'Salió toy-loops: animaciones 3D de papel con Claude, hechas en Blender.',
    banner_short: 'Salió toy-loops',
    banner_btn: 'Míralo',
    nav_skills: 'Skills', nav_showreel: 'Showreel', nav_tutorials: 'Tutoriales', nav_docs: 'Docs', soon: 'Pronto',
    open_source: 'Código abierto', get_skills: 'Consigue las skills',
    sound_on: 'Sonido activado', sound_off: 'Sonido apagado', sound_turn_on: 'Activar sonido', sound_turn_off: 'Apagar sonido',
    language: 'Idioma',
    eyebrow: 'Skills para Claude Code · gratis en GitHub',
    h1: 'Skills que convierten a Claude en un estudio.',
    lede: 'Videos, animaciones e imágenes, cada uno hecho por una skill que puedes instalar. Mira lo que hace y descárgala.',
    browse: 'Ver las skills', view_github: 'Ver en GitHub',
    stats: (out, way) => [out, ' skills listas', way, ' en camino', '8 s', ' en bucle perfecto'],
    home: 'Inicio', skills_label: 'Skills', by: 'por Pimbo', source: 'Código', download_skill: 'Descargar skill',
    tab_preview: 'Vista previa', tab_install: 'Instalar',
    kind_Animation: 'Animación', kind_Video: 'Video', kind_Analysis: 'Análisis',
    install: (n) => [
      ['Descarga ', n, '.zip (el botón de arriba) o toma el código en GitHub.'],
      ['En la app de Claude, sube el .zip en la configuración de skills; en Claude Code, descomprímelo en ', '~/.claude/skills/', '.'],
      ['Pídele a Claude lo que quieres; la skill le dice cómo.'],
    ],
    prompt_title: 'Instálala con Claude', copy_prompt: 'Copiar prompt', copied: 'Copiado', by_hand: 'O a mano',
    prompt_sub: 'Copia este prompt y pégalo en Claude Code. Claude instala la skill y lo que necesita, preguntándote antes.',
    install_prompt: ({ id, name, needs, tryIt }) => `Instálame la skill de Claude Code "${name}" en este computador.

1. Trae la carpeta skills/${id} de https://github.com/Pimboto/claude-skills (basta con un git clone superficial y sparse de solo esa carpeta).
2. Ponla en mi carpeta personal de skills: ~/.claude/skills/${id} (en Windows: %USERPROFILE%\\.claude\\skills\\${id}). Si esa carpeta ya existe, pregúntame antes de reemplazarla.
3. Lee su SKILL.md. Necesita ${needs}. Revisa qué tengo ya, dime qué me falta e instálalo solo cuando te diga que sí.
4. Cuando esté lista, dime en dos líneas qué hace la skill y si debo reiniciar Claude Code, y dame un primer prompt para probarla, como: "${tryIt}"

No cambies nada más en mi computador.`,
    dl_title: (n) => `Descargar ${n}`,
    dl_text: 'Deja tu correo y la descarga empieza. Solo te escribiremos cuando haya una skill o un tutorial nuevo.',
    email_ph: 'tu@correo.com', download: 'Descargar', sending: 'Enviando…',
    done_title: 'Tu descarga empezó', done_text: '¡Gracias! Si no empezó,', close: 'Cerrar',
    email_bad: 'Ese correo no parece válido.', err_many: 'Demasiados intentos. Espera unos minutos.',
    err_generic: 'Algo salió mal. Intenta de nuevo.',
    cta_soon: 'Muy pronto', cta_tag: 'Tutoriales', cta_h2: 'Aprende a hacer esto con Claude.',
    cta_lede: 'Vienen tutoriales paso a paso para cada skill: del primer prompt al bucle terminado. Deja tu correo y te avisamos cuando salga el primero.',
    notify: 'Avísame', notify_done: 'Quedaste en la lista. Te escribimos cuando salga el primer tutorial.',
    foot_text: 'Skills para Claude Code que hacen videos, animaciones e imágenes. Hechas con Claude Code, renderizadas en Blender.',
    star: 'Dale una estrella en GitHub', col_skills: 'Skills', col_studio: 'Estudio', col_pimbo: 'Pimbo', site_source: 'Código de este sitio',
    fan: 'Claude y su mascota son de Anthropic. Este es un proyecto de fan, sin relación con Anthropic.',
  },
};

const KEY = 'ps_lang';
const isBrowser = typeof window !== 'undefined';
// the language the page's HTML was rendered in (the server picks it the same way, with a cookie in place of
// localStorage); hydration starts from it, then switches if the visitor's choice differs
let htmlLang = isBrowser && document.documentElement.lang === 'es' ? 'es' : 'en';
export const setRenderLang = (l) => { htmlLang = l; };
const saveCookie = (l) => { document.cookie = `${KEY}=${l}; path=/; max-age=31536000; samesite=lax`; };

function initial() {
  const q = new URLSearchParams(location.search).get('lang');    // ?lang=es links (hreflang, sharing)
  if (q === 'en' || q === 'es') return q;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch { /* private mode */ }
  return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

let lang = isBrowser ? initial() : 'en';
if (isBrowser) saveCookie(lang);
const subs = new Set();

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  saveCookie(next);
  applyHead();
  subs.forEach((f) => f());
}

// the tab title and description follow the language
export const HEAD = {
  en: ['Pimbo Studio · Claude Code skills for video, animation and 3D',
    'Free Claude Code skills that make videos, 3D animations and pictures: seamless Blender loops, vertical 3D shorts and more. Watch what each skill makes, then download it.'],
  es: ['Pimbo Studio · Skills de Claude Code para video, animación y 3D',
    'Skills gratis para Claude Code que hacen videos, animaciones 3D e imágenes: bucles perfectos en Blender, shorts verticales en 3D y más. Mira lo que hace cada skill y descárgala.'],
};
function applyHead() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = HEAD[lang][0];
  document.querySelector('meta[name="description"]')?.setAttribute('content', HEAD[lang][1]);
}
applyHead();

const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
const tIn = (l) => (key, ...args) => {
  const v = DICT[l][key] ?? DICT.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
};
const pickIn = (l) => (v) => (v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'es' in v) ? v[l] ?? v.en : v);
const BOUND = { en: { t: tIn('en'), pick: pickIn('en') }, es: { t: tIn('es'), pick: pickIn('es') } };

export function useLang() {
  const current = useSyncExternalStore(subscribe, () => lang, () => htmlLang);
  return { lang: current, ...BOUND[current], setLang };
}
