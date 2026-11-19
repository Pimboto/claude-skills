import rig from '../claude-rig.json';
import claudeFull from '../media/claude.webp';
import skyBlur from '../media/intro-sky.webp?inline';
import { SoundIcon } from './Icons.jsx';
import { useLang } from '../i18n.js';

// The first-visit intro: Claude close up on a blurred sky looks at you, winks ^_< with two sparkles, then
// src/intro.js pulls the camera back to the page. It is written into the page's HTML at build time
// (tools/prerender.mjs), outside the React app, and only shows when the head script sets html.intro-on.
// Everything that moves is its own layer moved by transform and opacity only, so the GPU does it all:
//   the sky is a 1.7 KB pre-blurred picture inside the HTML (no download, no CSS blur),
//   each eye state is its own picture over the face, and nothing starts before Claude's picture is decoded.
const [W, H] = rig.image;
const WINK = 'right';
const pts = (shape) => shape.map((p) => p.join(',')).join(' ');
const pct = (c) => `${(c[0] / W) * 100}% ${(c[1] / H) * 100}%`;

function Eye({ eye, shape, className }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} style={{ transformOrigin: pct(eye.c) }}>
      <polygon transform={`matrix(${eye.ax[0]} ${eye.ax[1]} ${eye.ay[0]} ${eye.ay[1]} ${eye.c[0]} ${eye.c[1]})`} fill={rig.ink}
        points={pts(rig.shapes_mm[shape][eye.side])} />
    </svg>
  );
}

// A four-point star, the anime wink sparkle
const Spark = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M12 0C12.9 7.4 16.6 11.1 24 12 16.6 12.9 12.9 16.6 12 24 11.1 16.6 7.4 12.9 0 12 7.4 11.1 11.1 7.4 12 0Z" fill="#fff" />
  </svg>
);

// Runs as soon as the intro's HTML is parsed: the show starts when Claude's picture is decoded (at most 2.5 s);
// taps that come before the page's code are counted for src/intro.js
const BOOT = `(function(){var h=document.documentElement;if(!h.classList.contains('intro-on'))return;
var i=document.querySelector('#intro .intro-body img'),d=0,r;window.__introTaps=0;
document.getElementById('intro').addEventListener('pointerdown',function(){window.__introTaps++});window.__introReady=new Promise(function(f){r=f});
function go(){if(d)return;d=1;h.classList.add('intro-ready');r()}
(i.decode?i.decode():Promise.reject()).then(go,function(){i.complete?go():i.addEventListener('load',go)});setTimeout(go,2500)})();`;

export default function Intro() {
  const { t } = useLang();
  const left = rig.eyes.find((e) => e.side !== WINK);
  const right = rig.eyes.find((e) => e.side === WINK);
  return (
    <>
      <div id="intro" className="intro" aria-hidden="true">
        <div className="intro-sky" style={{ backgroundImage: `url(${skyBlur})` }} />
        <div className="intro-claude">
          <div className="intro-pop">
            <div className="intro-body">
              <img src={claudeFull} alt="" width={W} height={H} loading="lazy" decoding="async" />
              <Eye eye={left} shape="sq" className="eye" />
              <Eye eye={right} shape="sq" className="eye eye-open" />
              <Eye eye={right} shape="squeeze" className="eye eye-wink" />
              <Spark className="spark s1" />
              <Spark className="spark s2" />
            </div>
          </div>
        </div>
        {/* sound needs a tap first: say so */}
        <div className="intro-hint"><SoundIcon on /> {t('intro_hint')}</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
    </>
  );
}
