import { useState, type FormEvent } from 'react';
import { FESTIVAL } from '../../config';
import { store, notifyChange } from '../../data/store';
import { useLoad } from '../../data/hooks';
import type { NewsItem, Performance, Venue } from '../../data/types';
import { newId } from '../../data/util';
import { dayLabel, festivalDays, festivalTime, minutesInto, showDayOf, timeLabel } from '../../data/format';
import { Icon } from '../../components/Art';
import { ErrorNote, Loading } from '../../components/ShowRow';

function useAct() {
  const [err, setErr] = useState('');
  const run = async (fn: () => Promise<unknown>) => {
    try { await fn(); notifyChange(); setErr(''); return true; } catch (e) { setErr((e as Error).message); return false; }
  };
  return { err, run };
}

export function ScheduleAdmin() {
  const { data, error } = useLoad(async () => {
    const [bands, venues, perfs] = await Promise.all([store.listBands({ includeAll: true }), store.listVenues(), store.listPerformances()]);
    return { bands: bands.filter((b) => b.status === 'approved'), venues, perfs };
  });
  const { err, run } = useAct();
  const days = festivalDays();
  const [day, setDay] = useState(days[0]);
  const [form, setForm] = useState({ id: '', bandId: '', venueId: '', start: '19:00', end: '19:45' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.bandId || !form.venueId) return;
    const p: Performance = { id: form.id || newId('p'), bandId: form.bandId, venueId: form.venueId, start: festivalTime(day, form.start), end: festivalTime(day, form.end) };
    if (p.end <= p.start) { alert('The end time must be after the start time. Shows before 6 AM count as the night before.'); return; }
    if (await run(() => store.savePerformance(p))) setForm({ ...form, id: '' });
  };

  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading />;
  // Same day rule as the public schedule: a 1 AM set belongs to the night before.
  const list = data.perfs.filter((p) => showDayOf(p.start) === day).sort((a, b) => minutesInto(day, a.start) - minutesInto(day, b.start));

  return (
    <>
      <div className="chips">{days.map((d) => <button key={d} className={`chip ${d === day ? 'on' : ''}`} onClick={() => setDay(d)}>{dayLabel(d, 'long')}</button>)}</div>
      <form className="card" onSubmit={submit}>
        <h2>{form.id ? 'Change show' : 'Add a show'} · {dayLabel(day, 'long')}</h2>
        <div className="two">
          <label className="field"><span>Band</span>
            <select required value={form.bandId} onChange={(e) => setForm({ ...form, bandId: e.target.value })}>
              <option value="">Choose…</option>{data.bands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Venue</span>
            <select required value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
              <option value="">Choose…</option>{data.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Starts</span><input type="time" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
          <label className="field"><span>Ends</span><input type="time" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
        </div>
        {err && <ErrorNote error={err} />}
        <div className="row-end">
          {form.id && <button type="button" className="btn btn-outline" onClick={() => setForm({ ...form, id: '' })}>Cancel</button>}
          <button className="btn btn-accent">{form.id ? 'Save' : 'Add show'}</button>
        </div>
      </form>
      <section className="card">
        <h2>{list.length} shows</h2>
        <div className="list">
          {list.map((p) => (
            <div key={p.id} className="band-row">
              <div className="show-time"><strong>{timeLabel(p.start)}</strong><span>{timeLabel(p.end)}</span></div>
              <div className="show-main">
                <div className="show-title">{data.bands.find((b) => b.id === p.bandId)?.name ?? 'Unknown band'}</div>
                <div className="show-sub">{data.venues.find((v) => v.id === p.venueId)?.name}</div>
              </div>
              <button className="icon-btn dark" aria-label="Edit show" onClick={() => setForm({ id: p.id, bandId: p.bandId, venueId: p.venueId, start: p.start.slice(11, 16), end: p.end.slice(11, 16) })}><Icon name="pencil" /></button>
              <button className="icon-btn dark" aria-label="Delete show" onClick={() => confirm('Delete this show?') && run(() => store.deletePerformance(p.id))}><Icon name="trash" /></button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const blankVenue = (): Venue => ({ id: '', name: '', address: '', lat: FESTIVAL.mapCenter.lat, lng: FESTIVAL.mapCenter.lng, description: '', kind: 'outdoor' });

export function VenuesAdmin() {
  const { data, error } = useLoad(() => store.listVenues());
  const { err, run } = useAct();
  const [v, setV] = useState<Venue>(blankVenue());
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => store.saveVenue({ ...v, id: v.id || newId('v') }))) setV(blankVenue());
  };
  return (
    <>
      <form className="card" onSubmit={submit}>
        <h2>{v.id ? `Edit ${v.name}` : 'Add a venue'}</h2>
        <label className="field"><span>Name</span><input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
        <label className="field"><span>Address</span><input value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} /></label>
        <div className="two">
          <label className="field"><span>Latitude</span><input type="number" step="any" required value={v.lat} onChange={(e) => setV({ ...v, lat: Number(e.target.value) })} /></label>
          <label className="field"><span>Longitude</span><input type="number" step="any" required value={v.lng} onChange={(e) => setV({ ...v, lng: Number(e.target.value) })} /></label>
        </div>
        <p className="muted small">Tip: in any map app, long-press a spot to see its latitude and longitude.</p>
        <label className="field"><span>Type</span>
          <select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as Venue['kind'] })}><option value="outdoor">Outdoor</option><option value="indoor">Indoor</option></select>
        </label>
        <label className="check"><input type="checkbox" checked={!!v.over21} onChange={(e) => setV({ ...v, over21: e.target.checked })} /> 21+ only (leave off for all ages)</label>
        <label className="field"><span>Description</span><textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
        {err && <ErrorNote error={err} />}
        <div className="row-end">
          {v.id && <button type="button" className="btn btn-outline" onClick={() => setV(blankVenue())}>Cancel</button>}
          <button className="btn btn-accent">{v.id ? 'Save' : 'Add venue'}</button>
        </div>
      </form>
      <section className="card">
        <h2>Venues</h2>
        {error && <ErrorNote error={error} />}
        {!data ? <Loading /> : (
          <div className="list">
            {data.map((x) => (
              <div key={x.id} className="band-row">
                <div className="show-main"><div className="show-title">{x.name}</div><div className="show-sub">{x.address}</div></div>
                <button className="icon-btn dark" aria-label={`Edit ${x.name}`} onClick={() => setV(x)}><Icon name="pencil" /></button>
                <button className="icon-btn dark" aria-label={`Delete ${x.name}`} onClick={() => confirm(`Delete ${x.name} and its shows?`) && run(() => store.deleteVenue(x.id))}><Icon name="trash" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const blankNews = (): NewsItem => ({ id: '', title: '', body: '', date: new Date().toISOString().slice(0, 10) });

export function NewsAdmin() {
  const { data, error } = useLoad(() => store.listNews());
  const { err, run } = useAct();
  const [n, setN] = useState<NewsItem>(blankNews());
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => store.saveNews({ ...n, id: n.id || newId('n') }))) setN(blankNews());
  };
  return (
    <>
      <form className="card" onSubmit={submit}>
        <h2>{n.id ? 'Edit news' : 'Post news'}</h2>
        <label className="field"><span>Title</span><input required value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} /></label>
        <label className="field"><span>Message</span><textarea rows={3} value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} /></label>
        <label className="field"><span>Date</span><input type="date" value={n.date} onChange={(e) => setN({ ...n, date: e.target.value })} /></label>
        {err && <ErrorNote error={err} />}
        <div className="row-end">
          {n.id && <button type="button" className="btn btn-outline" onClick={() => setN(blankNews())}>Cancel</button>}
          <button className="btn btn-accent">{n.id ? 'Save' : 'Post'}</button>
        </div>
      </form>
      <section className="card">
        <h2>Posted</h2>
        {error && <ErrorNote error={error} />}
        {!data ? <Loading /> : (
          <div className="list">
            {data.map((x) => (
              <div key={x.id} className="band-row">
                <div className="show-main"><div className="show-title">{x.title}</div><div className="show-sub">{x.date}</div></div>
                <button className="icon-btn dark" aria-label={`Edit ${x.title}`} onClick={() => setN(x)}><Icon name="pencil" /></button>
                <button className="icon-btn dark" aria-label={`Delete ${x.title}`} onClick={() => confirm('Delete this post?') && run(() => store.deleteNews(x.id))}><Icon name="trash" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
