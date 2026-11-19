import rig from '../claude-rig.json';
import claudeFull from '../media/claude.webp';

// The first-visit intro: Claude close up on the blurred sky, winking ^_< (the CSS runs it from the first paint,
// before any script), then src/intro.js pulls the camera back to the page. It is written into the page's HTML at
// build time (tools/prerender.mjs), outside the React app, and only shows when the head script sets html.intro-on.
const WINK = 'right';
const pts = (shape) => shape.map((p) => p.join(',')).join(' ');

export default function Intro() {
  const [w, h] = rig.image;
  return (
    <div id="intro" className="intro" aria-hidden="true">
      <div className="intro-sky" />
      <div className="intro-claude">
        <div className="intro-body">
          <img src={claudeFull} alt="" width={w} height={h} />
          <svg viewBox={`0 0 ${w} ${h}`}>
            {rig.eyes.map((e) => (
              <g key={e.side} transform={`matrix(${e.ax[0]} ${e.ax[1]} ${e.ay[0]} ${e.ay[1]} ${e.c[0]} ${e.c[1]})`} fill={rig.ink}>
                <polygon className={e.side === WINK ? 'eye-open winks' : 'eye-open'} points={pts(rig.shapes_mm.sq[e.side])} />
                {e.side === WINK && <polygon className="eye-wink" points={pts(rig.shapes_mm.squeeze[e.side])} />}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
