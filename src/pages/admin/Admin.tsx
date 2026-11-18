import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { store, notifyChange } from '../../data/store';
import type { AdminSession } from '../../data/types';
import { useLoad } from '../../data/hooks';
import { Icon } from '../../components/Art';
import { Loading } from '../../components/ShowRow';
import { Approvals, BandsAdmin } from './BandsAdmin';
import { Invites } from './Invites';
import { ScheduleAdmin, VenuesAdmin, NewsAdmin } from './ContentAdmin';

function Gate({ onIn }: { onIn: (s: AdminSession) => void }) {
  const setup = useLoad(() => store.needsSetup());
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const first = setup.data === true;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    if (first && pw !== pw2) { setErr('The two passwords don’t match.'); return; }
    setBusy(true);
    try {
      if (first) { await store.setupAdmin(email, pw); onIn({ email }); }
      else onIn(await store.signIn(email, pw));
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  };

  if (setup.loading) return <Loading />;
  return (
    <form className="card login" onSubmit={submit}>
      <Icon name="shield-lock-fill" className="big-icon" />
      <h2>{first ? 'Create the admin account' : 'Admin sign-in'}</h2>
      <p className="muted">{first ? 'No admin exists yet. The first account made here becomes the festival admin.' : 'For the festival team: approve bands, make invites and edit the schedule.'}</p>
      <label className="field"><span>Email</span><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="field"><span>Password</span><input type="password" required minLength={8} autoComplete={first ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      {first && <label className="field"><span>Repeat password</span><input type="password" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>}
      {err && <p className="note note-error"><Icon name="exclamation-circle" /> {err}</p>}
      <button className="btn btn-accent btn-block" disabled={busy}>{busy ? 'Please wait…' : first ? 'Create account' : 'Sign in'}</button>
      {store.mode === 'demo' && <p className="muted small"><Icon name="info-circle" /> Demo mode: the admin account and all changes live in this browser only. See the README to go live.</p>}
    </form>
  );
}

function Account({ me, onOut }: { me: AdminSession; onOut: () => void }) {
  const [oldPw, setOld] = useState('');
  const [newPw, setNew] = useState('');
  const [msg, setMsg] = useState('');
  const change = async (e: FormEvent) => {
    e.preventDefault();
    try { await store.changePassword(oldPw, newPw); setMsg('Password changed.'); setOld(''); setNew(''); } catch (ex) { setMsg((ex as Error).message); }
  };
  return (
    <>
      <section className="card">
        <h2>Signed in</h2>
        <p><Icon name="person-circle" /> {me.email}</p>
        <p className="muted small">Data: {store.mode === 'live' ? 'Live (shared on every device)' : 'Demo (this browser only)'}</p>
        <button className="btn btn-outline" onClick={onOut}><Icon name="box-arrow-right" /> Sign out</button>
      </section>
      <form className="card" onSubmit={change}>
        <h2>Change password</h2>
        {store.mode === 'demo' && <label className="field"><span>Current password</span><input type="password" value={oldPw} onChange={(e) => setOld(e.target.value)} required /></label>}
        <label className="field"><span>New password</span><input type="password" minLength={8} value={newPw} onChange={(e) => setNew(e.target.value)} required /></label>
        {msg && <p className="note">{msg}</p>}
        <button className="btn btn-accent">Save password</button>
      </form>
      {store.resetDemo && (
        <section className="card">
          <h2>Demo data</h2>
          <p className="muted">Put the sample bands, venues and schedule back. Your admin account stays.</p>
          <button className="btn btn-outline" onClick={async () => { if (confirm('Reset all demo data?')) { await store.resetDemo!(); notifyChange(); } }}>Reset demo data</button>
        </section>
      )}
    </>
  );
}

const TABS = [
  ['approvals', 'Approvals', 'inbox'],
  ['invites', 'Invites', 'qr-code'],
  ['bands', 'Bands', 'music-note-list'],
  ['schedule', 'Schedule', 'calendar-week'],
  ['venues', 'Venues', 'geo'],
  ['news', 'News', 'megaphone'],
  ['account', 'Account', 'person-gear'],
] as const;

export default function Admin() {
  const [me, setMe] = useState<AdminSession | null | undefined>(undefined);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'approvals';
  const pending = useLoad(async () => (me ? (await store.listBands({ includeAll: true })).filter((b) => b.status === 'pending').length : 0), [me]);

  useEffect(() => { store.currentAdmin().then(setMe).catch(() => setMe(null)); }, []);

  if (me === undefined) return <div className="page"><Loading /></div>;
  if (!me) return <div className="page narrow"><h1 className="page-title">Admin</h1><Gate onIn={setMe} /></div>;

  return (
    <div className="page wide">
      <h1 className="page-title">Admin</h1>
      <div className="admin-tabs" role="tablist">
        {TABS.map(([id, label, icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`chip ${tab === id ? 'on' : ''}`} onClick={() => setParams({ tab: id }, { replace: true })}>
            <Icon name={icon} /> {label}
            {id === 'approvals' && !!pending.data && <span className="badge">{pending.data}</span>}
          </button>
        ))}
      </div>
      {tab === 'approvals' && <Approvals />}
      {tab === 'invites' && <Invites />}
      {tab === 'bands' && <BandsAdmin />}
      {tab === 'schedule' && <ScheduleAdmin />}
      {tab === 'venues' && <VenuesAdmin />}
      {tab === 'news' && <NewsAdmin />}
      {tab === 'account' && <Account me={me} onOut={async () => { await store.signOut(); setMe(null); }} />}
    </div>
  );
}
