import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { store } from '../data/store';
import { useFavorites, useLoad } from '../data/hooks';
import { STARTING_SOON_MINUTES, dayLabel, dayNum, festivalDays, minutesInto, nowIso, overlaps, showDayOf, timeLabel, todaysDayIndex } from '../data/format';
import type { Band, Performance, Venue } from '../data/types';
import { Icon } from '../components/Art';
import { ErrorNote, Loading, ShowRow } from '../components/ShowRow';

function useAll() {
  return useLoad(async () => {
    const [bands, venues, perfs] = await Promise.all([store.listBands(), store.listVenues(), store.listPerformances()]);
    const ok = new Set(bands.map((b) => b.id));
    return { bands, venues, perfs: perfs.filter((p) => ok.has(p.bandId)) };
  });
}

function DayTabs({ day, setDay }: { day: string; setDay: (d: string) => void }) {
  return (
    <div className="day-tabs" role="tablist">
      {festivalDays().map((d) => (
        <button key={d} role="tab" aria-selected={d === day} className={`day-tab ${d === day ? 'on' : ''}`} onClick={() => setDay(d)}>
          <span>{dayLabel(d)}</span>
          <strong>{dayNum(d)}</strong>
        </button>
      ))}
    </div>
  );
}

function pickDay() {
  return festivalDays()[todaysDayIndex()];
}

/** On today's tab: what's on now, what starts within the hour, then everything. */
function LiveSections({ day, perfs, bands, venues }: { day: string; perfs: Performance[]; bands: Band[]; venues: Venue[] }) {
  const now = minutesInto(day, nowIso());
  const start = (p: Performance) => minutesInto(day, p.start);
  const end = (p: Performance) => minutesInto(day, p.end);
  const happening = perfs.filter((p) => start(p) <= now && now < end(p));
  const soon = perfs.filter((p) => now < start(p) && start(p) <= now + STARTING_SOON_MINUTES);
  const row = (p: Performance) => <ShowRow key={p.id} p={p} band={bands.find((b) => b.id === p.bandId)} venue={venues.find((v) => v.id === p.venueId)} />;
  return (
    <>
      <section className="card live-group">
        <h2 className="live-head"><span className="live-dot" aria-hidden="true" /> Happening now</h2>
        {happening.length ? <div className="list">{happening.map(row)}</div> : <p className="muted">Nothing is playing right now.</p>}
      </section>
      <section className="card">
        <h2 className="live-head"><Icon name="hourglass-split" /> Starting soon</h2>
        {soon.length ? <div className="list">{soon.map(row)}</div> : <p className="muted">Nothing starts in the next {STARTING_SOON_MINUTES} minutes.</p>}
      </section>
      <h2 className="section-label on-blue">Full schedule</h2>
    </>
  );
}

export function Schedule() {
  const { data, error } = useAll();
  const [params, setParams] = useSearchParams();
  const day = params.get('day') ?? pickDay();
  const view = params.get('view') ?? 'time';
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p, { replace: true }); };

  const todays = (data?.perfs ?? []).filter((p) => showDayOf(p.start) === day).sort((a, b) => minutesInto(day, a.start) - minutesInto(day, b.start));
  const isToday = showDayOf(nowIso()) === day;

  return (
    <div className="page">
      <h1 className="page-title">Schedule</h1>
      <DayTabs day={day} setDay={(d) => set('day', d)} />
      <div className="seg" role="tablist">
        <button className={view === 'time' ? 'on' : ''} onClick={() => set('view', 'time')}><Icon name="clock" /> By time</button>
        <button className={view === 'venue' ? 'on' : ''} onClick={() => set('view', 'venue')}><Icon name="geo-alt" /> By venue</button>
      </div>
      {error && <ErrorNote error={error} />}
      {!data ? <Loading /> : todays.length === 0 ? <p className="empty">The schedule will be posted closer to the festival.</p> : view === 'time' ? (
        <>{isToday && <LiveSections day={day} perfs={todays} bands={data.bands} venues={data.venues} />}
        {groupBy(todays, (p) => p.start).map(([start, perfs]) => (
          <section key={start} className="card time-group">
            <h2 className="time-head">{timeLabel(start)}</h2>
            <div className="list">
              {perfs.map((p) => <ShowRow key={p.id} p={p} band={data.bands.find((b) => b.id === p.bandId)} venue={data.venues.find((v) => v.id === p.venueId)} />)}
            </div>
          </section>
        ))}</>
      ) : (
        data.venues.filter((v) => todays.some((p) => p.venueId === v.id)).map((v) => (
          <section key={v.id} className="card">
            <div className="card-head">
              <h2>{v.name}</h2>
              <Link to={`/venues/${v.id}`} className="link">Venue <Icon name="chevron-right" /></Link>
            </div>
            <div className="list">
              {todays.filter((p) => p.venueId === v.id).map((p) => (
                <ShowRow key={p.id} p={p} band={data.bands.find((b) => b.id === p.bandId)} venue={v} show="band" />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function groupBy<T>(list: T[], key: (t: T) => string): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const x of list) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return [...m.entries()];
}

export function Favorites() {
  const { data, error } = useAll();
  const favs = useFavorites();
  const [shareMsg, setShareMsg] = useState('');
  const mine = (data?.perfs ?? []).filter((p) => favs.includes(p.id));

  const share = async () => {
    if (!data) return;
    const text = mine.map((p) => `${dayLabel(p.start.slice(0, 10))} ${timeLabel(p.start)} – ${data.bands.find((b) => b.id === p.bandId)?.name} @ ${data.venues.find((v) => v.id === p.venueId)?.name}`).join('\n');
    try {
      if (navigator.share) await navigator.share({ title: 'My Fest', text });
      else { await navigator.clipboard.writeText(text); setShareMsg('Copied to clipboard'); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="page">
      <h1 className="page-title">My Fest</h1>
      {error && <ErrorNote error={error} />}
      {!data ? <Loading /> : mine.length === 0 ? (
        <div className="card empty-card">
          <Icon name="heart" className="big-icon" />
          <h2>No shows picked yet</h2>
          <p>Tap the heart next to any show and it lands here, in time order, with clashes flagged.</p>
          <Link to="/schedule" className="btn btn-accent">Browse the schedule</Link>
        </div>
      ) : (
        <>
          <div className="row-between">
            <p className="muted on-blue">{mine.length} show{mine.length === 1 ? '' : 's'} picked</p>
            <button className="btn btn-light btn-sm" onClick={share}><Icon name="share" /> Share</button>
          </div>
          {shareMsg && <p className="note">{shareMsg}</p>}
          {festivalDays().map((d) => {
            const dayList = mine.filter((p) => showDayOf(p.start) === d);
            if (!dayList.length) return null;
            return (
              <section key={d} className="card">
                <h2>{dayLabel(d, 'long')}</h2>
                <div className="list">
                  {dayList.map((p) => (
                    <ShowRow key={p.id} p={p} band={data.bands.find((b) => b.id === p.bandId)} venue={data.venues.find((v) => v.id === p.venueId)}
                      conflict={dayList.some((o) => o.id !== p.id && overlaps(o, p))} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
