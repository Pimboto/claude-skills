import { useState } from 'react';
import { MetalFx } from 'metal-fx';
import { SITE } from '../site.js';
import { LIVE, SOON } from '../skills.js';
import { GitHubIcon, Arrow } from './Icons.jsx';
import { subscribe } from './DownloadModal.jsx';
import Logo from './Logo.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function NotifyForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [msg, setMsg] = useState('');
  const send = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('error'); setMsg('That email does not look right.'); return; }
    setState('sending');
    try { await subscribe(email.trim(), 'tutorials'); setState('done'); }
    catch (err) { setState('error'); setMsg(err.message); }
  };
  if (state === 'done') return <p className="notify-done">You are on the list. We will write when the first tutorial is out.</p>;
  return (
    <form className="notify" onSubmit={send} noValidate>
      <input type="email" autoComplete="email" placeholder="you@email.com" value={email} aria-label="Email"
        onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} />
      <MetalFx preset="chromatic" variant="button" theme="dark">
        <button className="metal-pill" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Notify me'}</button>
      </MetalFx>
      {state === 'error' && <p className="err" role="alert">{msg}</p>}
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <section className="cta-band" id="tutorials">
        <div className="cta-art" style={{ backgroundImage: 'url(media/footer-director.webp)' }} aria-hidden="true" />
        <div className="wrap cta-grid">
          <div className="cta-copy">
            <p className="eyebrow"><span className="soon big">Coming soon</span> Tutorials</p>
            <h2>Learn to make these with Claude.</h2>
            <p className="lede">
              Step-by-step tutorials for every skill are on the way: from the first prompt to the finished loop.
              Leave your email and we will tell you when the first one is out.
            </p>
            <NotifyForm />
          </div>
        </div>
      </section>

      <div className="wrap foot-grid">
        <div className="foot-brand">
          <a className="brand" href="#top"><Logo size={26} /> {SITE.name}</a>
          <p>Skills for Claude Code that make videos, animations and pictures. Made with Claude Code, rendered in Blender.</p>
          <a className="btn btn-dark" href={SITE.github} target="_blank" rel="noreferrer"><GitHubIcon /> Star on GitHub</a>
        </div>
        <nav className="foot-col" aria-label="Skills">
          <h4>Skills</h4>
          {LIVE.map((s) => <a key={s.id} href="#skills">{s.name}</a>)}
          {SOON.map((s) => <span key={s.id} className="muted">{s.name} <span className="soon">Soon</span></span>)}
        </nav>
        <nav className="foot-col" aria-label="Studio">
          <h4>Studio</h4>
          <a href="#skills">Showreel</a>
          <a href="#tutorials">Tutorials <span className="soon">Soon</span></a>
          <a href={SITE.github} target="_blank" rel="noreferrer">Docs</a>
        </nav>
        <nav className="foot-col" aria-label="Pimbo">
          <h4>Pimbo</h4>
          <a href={SITE.portfolio} target="_blank" rel="noreferrer">pimbo.dev <Arrow /></a>
          <a href={SITE.profile} target="_blank" rel="noreferrer">GitHub <Arrow /></a>
          <a href={SITE.github} target="_blank" rel="noreferrer">Source of this site <Arrow /></a>
        </nav>
      </div>

      <div className="wrap foot-bottom">
        <span>© {new Date().getFullYear()} Pimbo</span>
        <span>Claude and its mascot belong to Anthropic. This is a fan project, not affiliated with Anthropic.</span>
      </div>
      <div className="wordmark" aria-hidden="true">{SITE.name}</div>
    </footer>
  );
}
