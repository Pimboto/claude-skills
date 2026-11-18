// The skill library. To publish a new skill:
//   1. put its source in skills/<id>/ and run `python tools/pack_skills.py` (writes public/downloads/<id>.zip)
//   2. add an entry here; videos or pictures go in public/media/
// status: 'live' (shown, downloadable) | 'soon' (shown greyed as coming soon) | 'hidden' (not shown yet)
// tile: small picture next to the name; icon: Nucleo icon when there is no tile
// media: { type: 'video' | 'image', src, label, vertical? }  facts: three short [label, value] pairs
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
    blurb:
      'Seamless 3D loops in a paper-toy look. Every object is built in Python and rendered in Blender, and the motion follows the classic animation principles: anticipation, squash and stretch, follow-through.',
    media: [
      { type: 'video', src: 'media/toy-loops-island.mp4', label: 'The island' },
      { type: 'video', src: 'media/toy-loops-campfire.mp4', label: 'The campfire' },
    ],
    facts: [['Loop', '8 s, no seam'], ['Render', '0.7 s / frame'], ['Output', 'GIF · MP4 · web']],
    meta: ['v1', 'Blender + Python'],
  },
  {
    id: 'stage3d-shorts',
    name: 'stage3d-shorts',
    status: 'live',
    kind: 'Video',
    icon: 'Video',
    tile: 'media/tile-stage3d.webp',
    tileBg: 'dark',
    blurb:
      'Vertical 3D shorts on a black stage. A script with a timing for every word goes in, a finished MP4 comes out, checked by numbers before it ships.',
    media: [{ type: 'video', src: 'media/stage3d-just-later.mp4', label: 'Just Later', vertical: true }],
    facts: [['Format', '1080 × 1920'], ['Frame rate', '30 fps'], ['Checks', 'QA on every render']],
    meta: ['v0.1', 'three.js'],
  },
  {
    id: 'hw-shorts',
    name: 'hw-shorts',
    status: 'soon',
    kind: 'Video',
    icon: 'Hardware',
    blurb: 'Hardware shorts (best GPU, best CPU) in a clean ticket look.',
    media: [],
    facts: [],
  },
  {
    id: 'reference-video-analysis',
    name: 'reference-video-analysis',
    status: 'hidden',
    kind: 'Analysis',
    icon: 'Analysis',
    blurb: 'Studies reference videos frame by frame and turns their craft into numbers.',
    media: [],
    facts: [],
  },
];

export const LIVE = SKILLS.filter((s) => s.status === 'live');
export const SOON = SKILLS.filter((s) => s.status === 'soon');
