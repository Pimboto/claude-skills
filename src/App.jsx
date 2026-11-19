import { useEffect, useState } from 'react';
import Metal from './components/Metal.jsx';
import WatchingClaude from './components/WatchingClaude.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import Footer from './components/Footer.jsx';
import Logo from './components/Logo.jsx';
import { GitHubIcon, Arrow, Chevron, SoundIcon } from './components/Icons.jsx';
import { startFx, isSoundOn, setSound, squeezeClaude, releaseClaude, claudeMood, cue } from './fx.js';
import { runIntro } from './intro.js';
import { useLang, LANGS } from './i18n.js';
import { SITE } from './site.js';
import { SKILLS, LIVE } from './skills.js';
import rig from './claude-rig.json';
import claude560 from './media/claude-560.webp';
import claudeFull from './media/claude.webp';

function SoundToggle() {
  const { t } = useLang();
  const [on, setOn] = useState(true);             // the page's HTML is rendered with sound on; the saved choice comes after
  useEffect(() => setOn(isSoundOn()), []);
  return (
    <button className="sound-btn" onClick={() => { setSound(!on); setOn(!on); }} aria-pressed={on}
      aria-label={on ? t('sound_turn_off') : t('sound_turn_on')} title={on ? t('sound_on') : t('sound_off')}>
      <SoundIcon on={on} />
    </button>
  );
}

// English / Spanish, next to the sound button (Nucleo flags)
function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang" role="group" aria-label={t('language')}>
      {LANGS.map((l) => (
        <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} title={l.name}
          onClick={() => { if (lang !== l.id) { setLang(l.id); cue('select'); } }}>
          <img src={l.flag} alt="" width="16" height="16" /> <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { t } = useLang();
  useEffect(() => { const stop = startFx(); runIntro(); return stop; }, []);
  const stats = t('stats', LIVE.length, SKILLS.length - LIVE.length);
  return (
    <>
      <a className="banner" href="#skills" data-cuelume-navigate data-cuelume-emphasis="subtle">
        <span className="banner-bg" aria-hidden="true" />
        <span className="chip-new">{t('new')}</span>
        <span className="long">{t('banner_long')}</span>
        <span className="short">{t('banner_short')}</span>
        <span className="banner-btn">{t('banner_btn')} <Arrow /></span>
      </a>

      <div className="page" id="top">
        <main className="hero">
          <div className="hero-sky" />

          <header className="nav wrap">
            <a className="brand" href="#top"><Logo size={24} /> {SITE.name}</a>
            <nav className="nav-links" aria-label="Main" data-cuelume-emphasis="subtle">
              <a href="#skills" data-cuelume-navigate>{t('nav_skills')} <Chevron /></a>
              <a href="#skills" data-cuelume-navigate>{t('nav_showreel')}</a>
              <a href="#tutorials" data-cuelume-navigate>{t('nav_tutorials')} <span className="soon">{t('soon')}</span></a>
              <a href={SITE.github} target="_blank" rel="noreferrer">{t('nav_docs')}</a>
            </nav>
            <div className="nav-right">
              <LangToggle />
              <SoundToggle />
              <a className="gh" href={SITE.github} target="_blank" rel="noreferrer"><GitHubIcon /> {t('open_source')}</a>
              <a className="btn btn-blue" href="#skills" data-cuelume-navigate>{t('get_skills')}</a>
            </div>
          </header>

          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">{t('eyebrow')}</p>
              <h1>{t('h1')}</h1>
              <p className="lede">{t('lede')}</p>
              <div className="ctas">
                <Metal preset="chromatic" variant="button" theme="dark">
                  <a className="metal-pill" href="#skills" data-cuelume-navigate>{t('browse')}</a>
                </Metal>
                <a className="btn btn-dark" href={SITE.github} target="_blank" rel="noreferrer">
                  <GitHubIcon /> {t('view_github')}
                </a>
              </div>
              <p className="stats">
                <b>{stats[0]}</b>{stats[1]} <i>·</i> <b>{stats[2]}</b>{stats[3]} <i>·</i> <b>{stats[4]}</b>{stats[5]}
              </p>
            </div>
          </div>

          <div className="wrap stage">
            <WatchingClaude className="hero-claude" src={claudeFull} srcSet={`${claude560} 560w, ${claudeFull} 1075w`}
              sizes="(max-width: 980px) min(360px, 80vw), 440px" rig={rig} onPress={squeezeClaude} onRelease={releaseClaude} onMood={claudeMood} />
            <SkillPanel />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
