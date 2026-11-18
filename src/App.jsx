import { useEffect, useState } from 'react';
import { MetalFx, MetalBadge } from 'metal-fx';
import WatchingClaude from './components/WatchingClaude.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import Footer from './components/Footer.jsx';
import Logo from './components/Logo.jsx';
import { GitHubIcon, Arrow, Chevron, SoundIcon } from './components/Icons.jsx';
import { startFx, isSoundOn, setSound, squeezeClaude, releaseClaude } from './fx.js';
import { SITE } from './site.js';
import { SKILLS, LIVE } from './skills.js';
import rig from './claude-rig.json';

function SoundToggle() {
  const [on, setOn] = useState(isSoundOn);
  return (
    <button className="sound-btn" onClick={() => { setSound(!on); setOn(!on); }} aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'} title={on ? 'Sound on' : 'Sound off'}>
      <SoundIcon on={on} />
    </button>
  );
}

export default function App() {
  useEffect(() => startFx(), []);
  return (
    <>
      <a className="banner" href="#skills" data-cuelume-navigate data-cuelume-emphasis="subtle" style={{ backgroundImage: 'url(media/hero-sky.webp)' }}>
        <MetalBadge>New</MetalBadge>
        <span className="long">toy-loops is out: paper 3D animations of Claude, made in Blender.</span>
        <span className="short">toy-loops is out</span>
        <span className="banner-btn">Watch it <Arrow /></span>
      </a>

      <div className="page" id="top">
        <section className="hero">
          <div className="hero-sky" style={{ backgroundImage: 'url(media/hero-sky.webp)' }} />

          <header className="nav wrap">
            <a className="brand" href="#top"><Logo size={24} /> {SITE.name}</a>
            <nav className="nav-links" aria-label="Main" data-cuelume-emphasis="subtle">
              <a href="#skills" data-cuelume-navigate>Skills <Chevron /></a>
              <a href="#skills" data-cuelume-navigate>Showreel</a>
              <a href="#tutorials" data-cuelume-navigate>Tutorials <span className="soon">Soon</span></a>
              <a href={SITE.github} target="_blank" rel="noreferrer">Docs</a>
            </nav>
            <div className="nav-right">
              <SoundToggle />
              <a className="gh" href={SITE.github} target="_blank" rel="noreferrer"><GitHubIcon /> Open source</a>
              <a className="btn btn-blue" href="#skills" data-cuelume-navigate>Get the skills</a>
            </div>
          </header>

          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Skills for Claude Code · free on GitHub</p>
              <h1>Skills that turn Claude into a studio.</h1>
              <p className="lede">
                Videos, animations and pictures, each made by a skill you can install. Watch what it makes, then
                download it.
              </p>
              <div className="ctas">
                <MetalFx preset="chromatic" variant="button" theme="dark">
                  <a className="metal-pill" href="#skills" data-cuelume-navigate>Browse skills</a>
                </MetalFx>
                <a className="btn btn-dark" href={SITE.github} target="_blank" rel="noreferrer">
                  <GitHubIcon /> View on GitHub
                </a>
              </div>
              <p className="stats">
                <b>{LIVE.length}</b> skills out <i>·</i> <b>{SKILLS.length - LIVE.length}</b> on the way <i>·</i> <b>8 s</b> seamless loops
              </p>
            </div>
          </div>

          <div className="wrap stage">
            <WatchingClaude className="hero-claude" src="media/claude.webp" rig={rig} onPress={squeezeClaude} onRelease={releaseClaude} />
            <SkillPanel />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
