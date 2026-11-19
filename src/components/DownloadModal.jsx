import { useEffect, useRef, useState } from 'react';
import Metal from './Metal.jsx';
import { downloadLink } from '../site.js';
import { DownloadIcon } from './Icons.jsx';
import SkillTile from './SkillTile.jsx';
import { cue, lockScroll } from '../fx.js';
import { useLang } from '../i18n.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const remembered = () => { try { return localStorage.getItem('ps_email') || ''; } catch { return ''; } };
export const remember = (e) => { try { localStorage.setItem('ps_email', e); } catch { /* private mode */ } };

// Sends the email to the site's own server (POST api/subscribe). No confirmation mail.
// Throws an Error whose message is a dictionary key (email_bad, err_many, err_generic).
export async function subscribe(email, topic) {
  let r;
  try {
    r = await fetch('api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, topic }) });
  } catch {
    throw new Error('err_generic');
  }
  if (r.ok) return;
  throw new Error(r.status === 400 ? 'email_bad' : r.status === 429 ? 'err_many' : 'err_generic');
}

export default function DownloadModal({ skill, onClose }) {
  const { t } = useLang();
  const [known] = useState(remembered);            // an email given before (a download or the tutorials list): not asked again
  const [email, setEmail] = useState(known);
  const [state, setState] = useState(known ? 'done' : 'idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const input = useRef(null);
  const started = useRef(false);

  const startDownload = () => {
    const a = document.createElement('a');
    a.href = downloadLink(skill.id);
    a.download = `${skill.id}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  useEffect(() => {
    if (!known || started.current) return;
    started.current = true;
    startDownload();
    cue('success');
    subscribe(known, skill.id).catch(() => {});   // still noted: which skill this person took
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { lockScroll(true); return () => lockScroll(false); }, []);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!EMAIL_RE.test(v)) { setError('email_bad'); setState('error'); cue('error', { emphasis: 'subtle' }); return; }
    setState('sending'); setError('');
    try {
      await subscribe(v, skill.id);
      remember(v);
      setState('done');
      cue('success');
      startDownload();
    } catch (err) {
      setError(err.message); setState('error'); cue('error');
    }
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dl-title" data-lenis-prevent>
        <button className="modal-x" onClick={onClose} aria-label={t('close')}>×</button>
        <SkillTile skill={skill} size={52} />
        {state === 'done' ? (
          <>
            <h3 id="dl-title">{t('done_title')}</h3>
            <p>{t('done_text')} <a className="link" href={downloadLink(skill.id)} download>{skill.name}.zip</a>.</p>
            <button className="btn btn-dark" onClick={onClose}>{t('close')}</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 id="dl-title">{t('dl_title', skill.name)}</h3>
            <p>{t('dl_text')}</p>
            <div className="field">
              <input
                ref={input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('email_ph')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
                aria-label="Email"
                aria-invalid={state === 'error'}
              />
              <Metal preset="chromatic" variant="button" theme="dark">
                <button className="metal-pill" type="submit" disabled={state === 'sending'}>
                  <DownloadIcon /> {state === 'sending' ? t('sending') : t('download')}
                </button>
              </Metal>
            </div>
            {state === 'error' && <p className="err" role="alert">{t(error)}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
