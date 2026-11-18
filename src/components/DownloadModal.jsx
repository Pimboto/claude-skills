import { useEffect, useRef, useState } from 'react';
import { MetalFx } from 'metal-fx';
import { downloadLink } from '../site.js';
import { DownloadIcon } from './Icons.jsx';
import SkillTile from './SkillTile.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const remembered = () => { try { return localStorage.getItem('ps_email') || ''; } catch { return ''; } };
const remember = (e) => { try { localStorage.setItem('ps_email', e); } catch { /* private mode */ } };

// Sends the email to the site's own server (POST api/subscribe), then starts the download. No confirmation mail.
export async function subscribe(email, topic) {
  const r = await fetch('api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, topic }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Something went wrong');
}

export default function DownloadModal({ skill, onClose }) {
  const [email, setEmail] = useState(remembered);
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const input = useRef(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!EMAIL_RE.test(v)) { setError('That email does not look right.'); setState('error'); return; }
    setState('sending'); setError('');
    try {
      await subscribe(v, skill.id);
      remember(v);
      setState('done');
      const a = document.createElement('a');
      a.href = downloadLink(skill.id);
      a.download = `${skill.id}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      setError(err.message); setState('error');
    }
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dl-title">
        <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        <SkillTile skill={skill} size={52} />
        {state === 'done' ? (
          <>
            <h3 id="dl-title">Your download started</h3>
            <p>Thanks! If it did not start, <a className="link" href={downloadLink(skill.id)} download>download {skill.name}.zip</a>.</p>
            <button className="btn btn-dark" onClick={onClose}>Close</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 id="dl-title">Download {skill.name}</h3>
            <p>Leave your email and the download starts. We will only write when there is a new skill or tutorial.</p>
            <div className="field">
              <input
                ref={input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
                aria-label="Email"
                aria-invalid={state === 'error'}
              />
              <MetalFx preset="chromatic" variant="button" theme="dark">
                <button className="metal-pill" type="submit" disabled={state === 'sending'}>
                  <DownloadIcon /> {state === 'sending' ? 'Sending…' : 'Download'}
                </button>
              </MetalFx>
            </div>
            {state === 'error' && <p className="err" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
