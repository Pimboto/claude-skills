import { useState } from 'react';
import { MetalFx } from 'metal-fx';
import { SITE } from '../site.js';
import { LIVE, SOON } from '../skills.js';
import { GitHubIcon, Arrow } from './Icons.jsx';
import { subscribe, EMAIL_RE } from './DownloadModal.jsx';
import Logo from './Logo.jsx';
import { cue } from '../fx.js';
import { useLang } from '../i18n.js';

function NotifyForm() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const send = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('error'); setMsg('email_bad'); cue('error', { emphasis: 'subtle' }); return; }
    setState('sending');
    try { await subscribe(email.trim(), 'tutorials'); setState('done'); cue('success', { emphasis: 'subtle' }); }
    catch (err) { setState('error'); setMsg(err.message); cue('error'); }
  };
  if (state === 'done') return <p className="notify-done">{t('notify_done')}</p>;
  return (
    <form className="notify" onSubmit={send} noValidate>
      <input type="email" autoComplete="email" placeholder={t('email_ph')} value={email} aria-label="Email" data-cuelume-type
        onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} />
      <MetalFx preset="chromatic" variant="button" theme="dark">
        <button className="metal-pill" type="submit" disabled={state === 'sending'}>{state === 'sending' ? t('sending') : t('notify')}</button>
      </MetalFx>
      {state === 'error' && <p className="err" role="alert">{t(msg)}</p>}
    </form>
  );
}

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <section className="cta-band" id="tutorials">
        <div className="cta-art" style={{ backgroundImage: 'url(media/footer-director.webp)' }} aria-hidden="true" />
        <div className="wrap cta-grid">
          <div className="cta-copy">
            <p className="eyebrow"><span className="soon big">{t('cta_soon')}</span> {t('cta_tag')}</p>
            <h2>{t('cta_h2')}</h2>
            <p className="lede">{t('cta_lede')}</p>
            <NotifyForm />
          </div>
        </div>
      </section>

      <div className="wrap foot-grid">
        <div className="foot-brand">
          <a className="brand" href="#top"><Logo size={26} /> {SITE.name}</a>
          <p>{t('foot_text')}</p>
          <a className="btn btn-dark" href={SITE.github} target="_blank" rel="noreferrer"><GitHubIcon /> {t('star')}</a>
        </div>
        <nav className="foot-col" aria-label={t('col_skills')}>
          <h4>{t('col_skills')}</h4>
          {LIVE.map((s) => <a key={s.id} href="#skills">{s.name}</a>)}
          {SOON.map((s) => <span key={s.id} className="muted">{s.name} <span className="soon">{t('soon')}</span></span>)}
        </nav>
        <nav className="foot-col" aria-label={t('col_studio')}>
          <h4>{t('col_studio')}</h4>
          <a href="#skills">{t('nav_showreel')}</a>
          <a href="#tutorials">{t('nav_tutorials')} <span className="soon">{t('soon')}</span></a>
          <a href={SITE.github} target="_blank" rel="noreferrer">{t('nav_docs')}</a>
        </nav>
        <nav className="foot-col" aria-label={t('col_pimbo')}>
          <h4>{t('col_pimbo')}</h4>
          <a href={SITE.portfolio} target="_blank" rel="noreferrer">pimbo.dev <Arrow /></a>
          <a href={SITE.profile} target="_blank" rel="noreferrer">GitHub <Arrow /></a>
          <a href={SITE.github} target="_blank" rel="noreferrer">{t('site_source')} <Arrow /></a>
        </nav>
      </div>

      <div className="wrap foot-bottom">
        <span>© {new Date().getFullYear()} Pimbo</span>
        <span>{t('fan')}</span>
      </div>
      <div className="wordmark" aria-hidden="true">{SITE.name}</div>
    </footer>
  );
}
