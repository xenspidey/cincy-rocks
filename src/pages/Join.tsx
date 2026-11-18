import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { store, notifyChange } from '../data/store';
import { normalizeCode } from '../data/util';
import type { BandApplication } from '../data/types';
import { Icon } from '../components/Art';
import { QrScanner, canScan, codeFromScan } from '../components/Qr';

type Step = 'code' | 'form' | 'done';

const empty: BandApplication = { name: '', genre: '', hometown: '', bio: '', website: '', instagram: '', facebook: '', tiktok: '', x: '', spotify: '', youtube: '', contactName: '', contactEmail: '' };

export default function Join() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [step, setStep] = useState<Step>('code');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState<BandApplication>(empty);

  const verify = useCallback(async (c: string) => {
    setErr(''); setBusy(true);
    try {
      const res = await store.checkInvite(c);
      if (res.ok) { setCode(normalizeCode(c)); setStep('form'); } else setErr(res.reason);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }, []);

  // Opening an invite link (from a QR code) checks the code straight away.
  useEffect(() => { const c = params.get('code'); if (c) verify(c); }, [params, verify]);

  const onScan = useCallback((text: string) => { setScanning(false); const c = codeFromScan(text); setCode(c); verify(c); }, [verify]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.contactEmail?.trim()) { setErr('Band name and contact email are required.'); return; }
    setBusy(true);
    try {
      await store.applyWithInvite(code, form);
      notifyChange();
      setStep('done');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const field = (k: keyof BandApplication, label: string, opts: { type?: string; placeholder?: string; required?: boolean } = {}) => (
    <label className="field">
      <span>{label}{opts.required && <em> *</em>}</span>
      <input type={opts.type ?? 'text'} value={(form[k] as string) ?? ''} placeholder={opts.placeholder}
        required={opts.required} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="page narrow">
      <h1 className="page-title">Band Sign-Up</h1>

      {step === 'code' && (
        <section className="card">
          <div className="steps"><span className="on">1 Invite</span><span>2 Your band</span><span>3 Review</span></div>
          <p>Bands join the lineup by invitation. Enter the code the festival team gave you, or scan the invite QR code.</p>
          <form onSubmit={(e) => { e.preventDefault(); verify(code); }} className="code-form">
            <input className="code-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" aria-label="Invite code" autoCapitalize="characters" autoComplete="off" />
            <button className="btn btn-accent" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Continue'}</button>
          </form>
          {canScan && !scanning && <button className="btn btn-outline" onClick={() => setScanning(true)}><Icon name="qr-code-scan" /> Scan QR code</button>}
          {!canScan && <p className="muted small"><Icon name="camera" /> Tip: point your phone's camera at the invite QR code to open this page with the code filled in.</p>}
          {scanning && <QrScanner onCode={onScan} onClose={() => setScanning(false)} />}
          {err && <p className="note note-error"><Icon name="exclamation-circle" /> {err}</p>}
        </section>
      )}

      {step === 'form' && (
        <form className="card" onSubmit={submit}>
          <div className="steps"><span className="done">1 Invite</span><span className="on">2 Your band</span><span>3 Review</span></div>
          <p className="note note-ok"><Icon name="check-circle-fill" /> Invite <strong>{code}</strong> accepted. Tell us about your band.</p>
          {field('name', 'Band name', { required: true })}
          <div className="two">
            {field('genre', 'Genres', { placeholder: 'e.g. Indie Folk, Americana' })}
            {field('hometown', 'Hometown', { placeholder: 'City, State' })}
          </div>
          <label className="field">
            <span>Short bio</span>
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Who you are and what you sound like (2-3 sentences)" />
          </label>
          {field('imageUrl', 'Band photo link (optional)', { type: 'url', placeholder: 'https://…' })}
          <div className="two">
            {field('website', 'Website', { placeholder: 'yourband.com' })}
            {field('instagram', 'Instagram', { placeholder: 'handle or link' })}
            {field('facebook', 'Facebook', { placeholder: 'handle or link' })}
            {field('tiktok', 'TikTok', { placeholder: '@handle or link' })}
            {field('x', 'X', { placeholder: 'handle or link' })}
            {field('spotify', 'Spotify', { placeholder: 'link' })}
            {field('youtube', 'YouTube', { placeholder: '@channel or link' })}
          </div>
          <h3>Contact (only the festival team sees this)</h3>
          <div className="two">
            {field('contactName', 'Your name')}
            {field('contactEmail', 'Email', { type: 'email', required: true })}
          </div>
          {err && <p className="note note-error"><Icon name="exclamation-circle" /> {err}</p>}
          <div className="row-between">
            <button type="button" className="btn btn-outline" onClick={() => setStep('code')}>Back</button>
            <button className="btn btn-accent" disabled={busy}>{busy ? 'Sending…' : 'Send for approval'}</button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <section className="card empty-card">
          <div className="steps"><span className="done">1 Invite</span><span className="done">2 Your band</span><span className="on">3 Review</span></div>
          <Icon name="hourglass-split" className="big-icon" />
          <h2>Thanks, {form.name}!</h2>
          <p>Your band is waiting for approval. Once the festival team approves it, you'll appear in the lineup.</p>
          <Link to="/" className="btn btn-accent">Back to home</Link>
        </section>
      )}
    </div>
  );
}
