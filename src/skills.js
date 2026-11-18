// The skill library. To publish a new skill:
//   1. put its source in skills/<id>/ and run `python tools/pack_skills.py` (writes public/downloads/<id>.zip)
//   2. add an entry here; videos or pictures go in public/media/
// status: 'live' (shown, downloadable) | 'soon' (shown greyed as coming soon) | 'hidden' (not shown yet)
// tile: small picture next to the name; icon: Nucleo icon when there is no tile
// Text fields can be a plain string or { en, es }.
// media: { type: 'video' | 'image', src, label, vertical? }  facts: three [label, value] pairs
// needs / firstTry: go into the install prompt people copy into Claude Code (what to set up, a first request)
export const SKILLS = [
  {
    id: 'toy-loops',
    name: 'toy-loops',
    status: 'live',
    kind: 'Animation',
    icon: 'Animation',
    tile: 'media/claude-tile.webp',
    tileBg: 'sky',
    isNew: true,
    blurb: {
      en: 'Seamless 3D loops in a paper-toy look. Every object is built in Python and rendered in Blender, and the motion follows the classic animation principles: anticipation, squash and stretch, follow-through.',
      es: 'Bucles 3D perfectos con look de juguete de papel. Cada objeto se arma en Python y se renderiza en Blender, y el movimiento sigue los principios clásicos de animación: anticipación, estirar y aplastar, acción complementaria.',
    },
    media: [
      { type: 'video', src: 'media/toy-loops-island.mp4', label: { en: 'The island', es: 'La isla' } },
      { type: 'video', src: 'media/toy-loops-campfire.mp4', label: { en: 'The campfire', es: 'La fogata' } },
    ],
    facts: [
      [{ en: 'Loop', es: 'Bucle' }, { en: '8 s, no seam', es: '8 s, sin corte' }],
      [{ en: 'Render', es: 'Render' }, { en: '0.7 s / frame', es: '0,7 s / cuadro' }],
      [{ en: 'Output', es: 'Salida' }, 'GIF · MP4 · web'],
    ],
    meta: ['v1', 'Blender + Python'],
    needs: {
      en: 'Blender 5.2 (with `blender` on the PATH, or its path in a BLENDER variable), ffmpeg on the PATH, and Python 3 with numpy and Pillow',
      es: 'Blender 5.2 (con `blender` en el PATH, o su ruta en una variable BLENDER), ffmpeg en el PATH y Python 3 con numpy y Pillow',
    },
    firstTry: { en: 'Make an 8-second loop of Claude waving on a little paper island.', es: 'Haz un loop de 8 segundos de Claude saludando en una islita de papel.' },
  },
  {
    id: 'stage3d-shorts',
    name: 'stage3d-shorts',
    status: 'live',
    kind: 'Video',
    icon: 'Video',
    tile: 'media/tile-stage3d.webp',
    tileBg: 'dark',
    blurb: {
      en: 'Vertical 3D shorts on a black stage. A script with a timing for every word goes in, a finished MP4 comes out, checked by numbers before it ships.',
      es: 'Shorts verticales en 3D sobre un escenario negro. Entra un guion con el tiempo de cada palabra y sale un MP4 terminado, revisado con números antes de publicarse.',
    },
    media: [{ type: 'video', src: 'media/stage3d-just-later.mp4', label: 'Just Later', vertical: true }],
    facts: [
      [{ en: 'Format', es: 'Formato' }, '1080 × 1920'],
      [{ en: 'Frame rate', es: 'Cuadros' }, '30 fps'],
      [{ en: 'Checks', es: 'Control' }, { en: 'QA on every render', es: 'QA en cada render' }],
    ],
    meta: ['v0.1', 'three.js'],
    needs: {
      en: 'Node.js (then `npm install` inside its kit folder), Chrome or Edge, ffmpeg on the PATH, and Python 3 with numpy, opencv-python and scipy',
      es: 'Node.js (y luego `npm install` dentro de su carpeta kit), Chrome o Edge, ffmpeg en el PATH y Python 3 con numpy, opencv-python y scipy',
    },
    firstTry: { en: 'Make a 5-second test short in the black-stage look.', es: 'Haz un short de prueba de 5 segundos con el look de escenario negro.' },
  },
  {
    id: 'hw-shorts',
    name: 'hw-shorts',
    status: 'soon',
    kind: 'Video',
    icon: 'Hardware',
    blurb: { en: 'Hardware shorts (best GPU, best CPU) in a clean ticket look.', es: 'Shorts de hardware (mejor GPU, mejor CPU) con un look limpio de tiquete.' },
    media: [],
    facts: [],
  },
  {
    id: 'reference-video-analysis',
    name: 'reference-video-analysis',
    status: 'hidden',
    kind: 'Analysis',
    icon: 'Analysis',
    blurb: { en: 'Studies reference videos frame by frame and turns their craft into numbers.', es: 'Estudia videos de referencia cuadro por cuadro y convierte su oficio en números.' },
    media: [],
    facts: [],
  },
];

export const LIVE = SKILLS.filter((s) => s.status === 'live');
export const SOON = SKILLS.filter((s) => s.status === 'soon');
