import { useState } from 'react';
import { MetalFx } from 'metal-fx';
import { LIVE, SOON } from '../skills.js';
import { SITE, repoLink } from '../site.js';
import { GitHubIcon, KindIcon, DownloadIcon } from './Icons.jsx';
import SkillTile from './SkillTile.jsx';
import DownloadModal from './DownloadModal.jsx';
import Logo from './Logo.jsx';
import { cue } from '../fx.js';
import { useLang } from '../i18n.js';

function Media({ item, label }) {
  if (item.type === 'video') {
    return <video src={item.src} autoPlay muted loop playsInline preload="metadata" aria-label={label} />;
  }
  return <img src={item.src} alt={label} loading="lazy" />;
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
              <MetalFx preset="silver" variant="button" theme="dark" strength={0.9}>
                <button className="metal-pill small" onClick={() => setDownloading(skill)} data-cuelume-open>
                  <DownloadIcon /> {t('download_skill')}
                </button>
              </MetalFx>
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
            <div className="install">
              <ol>
                {t('install', skill.name).map((parts, i) => (
                  <li key={i}>{parts.map((p, j) => (j % 2 === 1 ? <code key={j}>{p}</code> : <span key={j}>{p}</span>))}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
      {downloading && <DownloadModal skill={downloading} onClose={() => { cue('close'); setDownloading(null); }} />}
    </div>
  );
}
