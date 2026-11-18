import { useState } from 'react';
import { store, notifyChange } from '../../data/store';
import { useLoad } from '../../data/hooks';
import type { Band, BandStatus } from '../../data/types';
import { newId } from '../../data/util';
import { BandArt, Icon } from '../../components/Art';
import { ErrorNote, Loading } from '../../components/ShowRow';

async function act(fn: () => Promise<unknown>, setErr: (s: string) => void) {
  try { await fn(); notifyChange(); setErr(''); } catch (e) { setErr((e as Error).message); }
}

function StatusTag({ s }: { s: BandStatus }) {
  return <span className={`tag tag-${s}`}>{s === 'pending' ? 'Waiting' : s === 'approved' ? 'Approved' : 'Declined'}</span>;
}

export function Approvals() {
  const { data, error } = useLoad(() => store.listBands({ includeAll: true }));
  const [err, setErr] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const pending = (data ?? []).filter((b) => b.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <>
      {(error || err) && <ErrorNote error={error || err} />}
      {!data ? <Loading /> : pending.length === 0 ? (
        <div className="card empty-card"><Icon name="check2-all" className="big-icon" /><h2>All caught up</h2><p>No bands are waiting for approval. Make an invite to bring new bands in.</p></div>
      ) : pending.map((b) => (
        <section key={b.id} className="card review">
          <div className="review-head">
            <BandArt id={b.id} name={b.name} imageUrl={b.imageUrl} size="md" />
            <div>
              <h2>{b.name}</h2>
              <p className="band-meta">{b.genre || '—'} · {b.hometown || '—'}</p>
              <p className="muted small">Applied {new Date(b.createdAt).toLocaleString()} with invite <code>{b.inviteCode}</code></p>
            </div>
          </div>
          <p className="bio">{b.bio || <em>No bio given.</em>}</p>
          <dl className="facts">
            <dt>Contact</dt><dd>{b.contactName || '—'} {b.contactEmail && <a href={`mailto:${b.contactEmail}`}>{b.contactEmail}</a>}</dd>
            {b.website && <><dt>Website</dt><dd><a href={b.website} target="_blank" rel="noreferrer">{b.website}</a></dd></>}
            {b.instagram && <><dt>Instagram</dt><dd><a href={b.instagram} target="_blank" rel="noreferrer">{b.instagram}</a></dd></>}
            {b.spotify && <><dt>Spotify</dt><dd><a href={b.spotify} target="_blank" rel="noreferrer">{b.spotify}</a></dd></>}
            {b.youtube && <><dt>YouTube</dt><dd><a href={b.youtube} target="_blank" rel="noreferrer">{b.youtube}</a></dd></>}
          </dl>
          <label className="field"><span>Note (optional, kept with the decision)</span>
            <input value={notes[b.id] ?? ''} onChange={(e) => setNotes({ ...notes, [b.id]: e.target.value })} />
          </label>
          <div className="row-end">
            <button className="btn btn-outline danger" onClick={() => act(() => store.reviewBand(b.id, 'rejected', notes[b.id]), setErr)}><Icon name="x-circle" /> Decline</button>
            <button className="btn btn-accent" onClick={() => act(() => store.reviewBand(b.id, 'approved', notes[b.id]), setErr)}><Icon name="check-circle" /> Approve</button>
          </div>
        </section>
      ))}
    </>
  );
}

const blank = (): Band => ({ id: newId('b'), name: '', genre: '', hometown: '', bio: '', status: 'approved', createdAt: new Date().toISOString() });

function BandEditor({ band, onDone }: { band: Band; onDone: () => void }) {
  const [b, setB] = useState(band);
  const [err, setErr] = useState('');
  const f = (k: keyof Band, label: string, type = 'text') => (
    <label className="field"><span>{label}</span><input type={type} value={(b[k] as string) ?? ''} onChange={(e) => setB({ ...b, [k]: e.target.value })} /></label>
  );
  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); if (!b.name.trim()) { setErr('Name is required.'); return; } act(() => store.saveBand(b), setErr).then(onDone); }}>
      <h2>{band.name ? `Edit ${band.name}` : 'Add a band'}</h2>
      {f('name', 'Name')}
      <div className="two">{f('genre', 'Genres')}{f('hometown', 'Hometown')}</div>
      <label className="field"><span>Bio</span><textarea rows={3} value={b.bio} onChange={(e) => setB({ ...b, bio: e.target.value })} /></label>
      {f('imageUrl', 'Photo link', 'url')}
      <p className="muted small">Genres: separate several with commas. Social: a full link or just the handle.</p>
      <div className="two">{f('website', 'Website')}{f('instagram', 'Instagram')}{f('facebook', 'Facebook')}{f('tiktok', 'TikTok')}{f('x', 'X')}{f('spotify', 'Spotify')}{f('youtube', 'YouTube')}</div>
      <div className="two">{f('contactName', 'Contact name')}{f('contactEmail', 'Contact email', 'email')}</div>
      <label className="field"><span>Status</span>
        <select value={b.status} onChange={(e) => setB({ ...b, status: e.target.value as BandStatus })}>
          <option value="approved">Approved (shown in lineup)</option><option value="pending">Waiting</option><option value="rejected">Declined</option>
        </select>
      </label>
      {err && <ErrorNote error={err} />}
      <div className="row-end"><button type="button" className="btn btn-outline" onClick={onDone}>Cancel</button><button className="btn btn-accent">Save</button></div>
    </form>
  );
}

export function BandsAdmin() {
  const { data, error } = useLoad(() => store.listBands({ includeAll: true }));
  const [editing, setEditing] = useState<Band | null>(null);
  const [filter, setFilter] = useState<'all' | BandStatus>('all');
  const [err, setErr] = useState('');
  if (editing) return <BandEditor band={editing} onDone={() => setEditing(null)} />;
  const list = (data ?? []).filter((b) => filter === 'all' || b.status === filter);
  return (
    <section className="card">
      <div className="card-head">
        <h2>All bands ({list.length})</h2>
        <button className="btn btn-accent btn-sm" onClick={() => setEditing(blank())}><Icon name="plus-lg" /> Add band</button>
      </div>
      <div className="chips">
        {(['all', 'approved', 'pending', 'rejected'] as const).map((s) => (
          <button key={s} className={`chip chip-dark ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s === 'pending' ? 'Waiting' : s === 'approved' ? 'Approved' : 'Declined'}</button>
        ))}
      </div>
      {(error || err) && <ErrorNote error={error || err} />}
      {!data ? <Loading /> : (
        <div className="list">
          {list.map((b) => (
            <div key={b.id} className="band-row">
              <BandArt id={b.id} name={b.name} imageUrl={b.imageUrl} size="sm" />
              <div className="show-main"><div className="show-title">{b.name}</div><div className="show-sub">{b.genre} · {b.hometown}</div></div>
              <StatusTag s={b.status} />
              <button className="icon-btn dark" onClick={() => setEditing(b)} aria-label={`Edit ${b.name}`}><Icon name="pencil" /></button>
              <button className="icon-btn dark" onClick={() => confirm(`Delete ${b.name} and their shows?`) && act(() => store.deleteBand(b.id), setErr)} aria-label={`Delete ${b.name}`}><Icon name="trash" /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
