import { useEffect, useRef, useState } from 'react';
import Metal from './Metal.jsx';
import { LIVE, SOON } from '../skills.js';
import { SITE, repoLink } from '../site.js';
import { GitHubIcon, KindIcon, DownloadIcon, CopyIcon, CheckIcon, SparkleIcon } from './Icons.jsx';
import SkillTile from './SkillTile.jsx';
import DownloadModal from './DownloadModal.jsx';
import Logo from './Logo.jsx';
import { cue } from '../fx.js';
import { useLang } from '../i18n.js';
import noSound from '../media/no-sound.vtt?url';
import { introDone } from '../intro.js';

// Videos load when they come near the screen (not during the intro) and pause when they leave it. They are
// silent; the captions say so.
function Media({ item, label }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); v.play().catch(() => {}); } else if (!v.paused) v.pause();
    }, { rootMargin: '300px 0px' });
    let gone = false;
    introDone.then(() => { if (!gone) io.observe(v); });
    return () => { gone = true; io.disconnect(); };
  }, []);
  if (item.type === 'video') {
    return (
      <video ref={ref} src={near ? item.src : undefined} poster={near ? item.poster : undefined} width={item.w} height={item.h}
        autoPlay muted loop playsInline preload="none" aria-label={label}>
        <track kind="captions" src={noSound} srcLang="en" label="No sound" />
      </video>
    );
  }
  return <img src={item.src} alt={label} loading="lazy" />;
}

// A ready prompt: pasted into Claude Code, Claude fetches the skill, puts it in ~/.claude/skills and sets up what it needs
function InstallPrompt({ skill }) {
  const { t, pick } = useLang();
  const [copied, setCopied] = useState(false);
  const pre = useRef(null);
  const text = t('install_prompt', { id: skill.id, name: skill.name, needs: pick(skill.needs), tryIt: pick(skill.firstTry) });
  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      cue('success', { emphasis: 'subtle' });
    } catch {                                   // no clipboard access: select the text so it can be copied by hand
      const r = document.createRange();
      r.selectNodeContents(pre.current);
      const s = window.getSelection();
      s.removeAllRanges(); s.addRange(r);
    }
  };
  return (
    <div className="prompt-card">
      <div className="prompt-head">
        <div>
          <h3><SparkleIcon /> {t('prompt_title')}</h3>
          <p>{t('prompt_sub')}</p>
        </div>
        <button className={`btn btn-blue copy-btn ${copied ? 'is-copied' : ''}`} onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />} <span aria-live="polite">{copied ? t('copied') : t('copy_prompt')}</span>
        </button>
      </div>
      <pre ref={pre} className="prompt-text" data-lenis-prevent>{text}</pre>
    </div>
  );
}

export default function SkillPanel() {
  const { t, pick } = useLang();
  const [active, setActive] = useState(LIVE[0].id);
  const [tab, setTab] = useState('preview');
  const [downloading, setDownloading] = useState(null);
  const skill = LIVE.find((s) => s.id === active);

  return (
    <div className="panel-frame" id="skills">
      <div className="panel">
        <aside className="side">
          <div className="side-head">
            <Logo size={18} />
            <span>{SITE.name}</span>
          </div>
          <nav className="side-nav" aria-label="Library">
            <a className="side-item" href="#top" data-cuelume-navigate data-cuelume-emphasis="subtle"><KindIcon kind="Home" /> {t('home')}</a>
            <a className="side-item" href="#skills" data-cuelume-navigate data-cuelume-emphasis="subtle"><KindIcon kind="Reel" /> {t('nav_showreel')}</a>
            <a className="side-item" href={SITE.github} target="_blank" rel="noreferrer"><KindIcon kind="Book" /> {t('nav_docs')}</a>
            <span className="side-item off" title={t('soon')}><KindIcon kind="Play" /> {t('nav_tutorials')} <span className="soon">{t('soon')}</span></span>
          </nav>
          <div className="side-label">{t('skills_label')}</div>
          <nav className="side-nav" aria-label="Skills">
            {LIVE.map((s) => (
              <button
                key={s.id}
                className={`side-item ${s.id === active ? 'on' : ''}`}
                data-cuelume-select
                onClick={() => { setActive(s.id); setTab('preview'); }}
              >
                <SkillTile skill={s} size={20} /> <span className="side-name">{s.name}</span>
                {s.isNew && <span className="dot" aria-label={t('new')} />}
              </button>
            ))}
            {SOON.map((s) => (
              <span key={s.id} className="side-item off" title={t('soon')}>
                <KindIcon kind={s.icon} /> <span className="side-name">{s.name}</span> <span className="soon">{t('soon')}</span>
              </span>
            ))}
          </nav>
        </aside>

        <section className="main">
          <div className="crumbs">
            <span>{t('skills_label')}</span> <span className="sep">/</span> <span className="cur">{skill.name}</span>
            <span className="pill">{t(`kind_${skill.kind}`)}</span>
          </div>

          <div className="skill-head">
            <div className="skill-id">
              <SkillTile skill={skill} size={56} />
              <div>
                <h2>{skill.name}</h2>
                <div className="meta">
                  <span>{t('by')}</span>
                  {(skill.meta || []).map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
            <div className="skill-actions">
              <a className="btn btn-dark" href={repoLink(skill.id)} target="_blank" rel="noreferrer" data-cuelume-tap data-cuelume-emphasis="subtle">
                <GitHubIcon /> {t('source')}
              </a>
              <Metal preset="silver" variant="button" theme="dark" strength={0.9}>
                <button className="metal-pill small" onClick={() => setDownloading(skill)} data-cuelume-open>
                  <DownloadIcon /> {t('download_skill')}
                </button>
              </Metal>
            </div>
          </div>

          <p className="blurb">{pick(skill.blurb)}</p>

          <div className="tabs" role="tablist">
            {[['preview', t('tab_preview')], ['install', t('tab_install')]].map(([k, label]) => (
              <button key={k} role="tab" data-cuelume-select aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>

          <div className="facts">
            {skill.facts.map(([k, v], i) => (
              <div className="fact" key={i}>
                <span className="fact-k">{pick(k)}</span>
                <span className="fact-v">{pick(v)}</span>
              </div>
            ))}
          </div>

          {tab === 'preview' ? (
            <div className={`media-grid n${skill.media.length}`}>
              {skill.media.map((m) => (
                <figure className={`media ${m.vertical ? 'is-vertical' : ''}`} key={m.src}>
                  <Media item={m} label={pick(m.label)} />
                  <figcaption>{pick(m.label)}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="install-wrap">
              {skill.needs && <InstallPrompt skill={skill} />}
              <div className="install">
                <p className="install-label">{t('by_hand')}</p>
                <ol>
                  {t('install', skill.name).map((parts, i) => (
                    <li key={i}>{parts.map((p, j) => (j % 2 === 1 ? <code key={j}>{p}</code> : <span key={j}>{p}</span>))}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>
      </div>
      {downloading && <DownloadModal skill={downloading} onClose={() => { cue('close'); setDownloading(null); }} />}
    </div>
  );
}
