import { Link } from 'react-router-dom';
import { FESTIVAL } from '../config';
import { store } from '../data/store';
import { useLoad } from '../data/hooks';
import { dateRangeLabel, dayLabel, nowIso, showDayOf } from '../data/format';
import { Icon } from '../components/Art';
import { Loading, ShowRow } from '../components/ShowRow';

function countdown() {
  const start = new Date(FESTIVAL.startDate + 'T12:00:00').getTime();
  const end = new Date(FESTIVAL.endDate + 'T23:59:59').getTime();
  const now = Date.now();
  if (now > end) return 'See you next year!';
  if (now >= start) return 'Happening now';
  const days = Math.ceil((start - now) / 86400000);
  return `${days} day${days === 1 ? '' : 's'} to go`;
}

export default function Home() {
  const { data } = useLoad(async () => {
    const [bands, venues, perfs, news] = await Promise.all([store.listBands(), store.listVenues(), store.listPerformances(), store.listNews()]);
    return { bands, venues, perfs, news };
  });

  const now = nowIso();
  const upcoming = data ? data.perfs.filter((p) => p.end >= now).slice(0, 5) : [];
  const nextDay = upcoming[0] ? showDayOf(upcoming[0].start) : undefined;

  return (
    <>
      <section className="hero">
        <div className="hero-lights" aria-hidden="true">
          <span className="beam b1" /><span className="beam b2" /><span className="beam b3" /><span className="beam b4" />
          <span className="crowd" />
        </div>
        <div className="hero-body">
          <p className="hero-kicker">{FESTIVAL.edition} · {FESTIVAL.town}</p>
          <h1 className="hero-title">{FESTIVAL.name}</h1>
          <p className="hero-dates">{dateRangeLabel()}</p>
          <p className="hero-tag">{FESTIVAL.tagline}</p>
          <span className="pill"><Icon name="clock" /> {countdown()}</span>
          <div className="hero-actions">
            <Link to="/schedule" className="btn btn-light"><Icon name="calendar3" /> Schedule</Link>
            <Link to="/bands" className="btn btn-ghost"><Icon name="music-note-beamed" /> Lineup</Link>
          </div>
        </div>
      </section>

      <div className="page">
        <div className="stat-row">
          <Link to="/bands" className="stat"><strong>{data?.bands.length ?? '–'}</strong><span>Bands</span></Link>
          <Link to="/venues" className="stat"><strong>{data?.venues.length ?? '–'}</strong><span>Venues</span></Link>
          <Link to="/schedule" className="stat"><strong>{data?.perfs.length ?? '–'}</strong><span>Shows</span></Link>
        </div>

        <section className="card">
          <div className="card-head">
            <h2>{nextDay ? `Up next · ${dayLabel(nextDay, 'long')}` : 'Up next'}</h2>
            <Link to="/schedule" className="link">Full schedule <Icon name="chevron-right" /></Link>
          </div>
          {!data ? <Loading /> : upcoming.length === 0 ? <p className="muted">No more shows this year.</p> : (
            <div className="list">
              {upcoming.map((p) => (
                <ShowRow key={p.id} p={p} band={data.bands.find((b) => b.id === p.bandId)} venue={data.venues.find((v) => v.id === p.venueId)} />
              ))}
            </div>
          )}
        </section>

        <div className="tile-grid">
          <Link to="/favorites" className="tile tile-a"><Icon name="heart-fill" /><strong>My Fest</strong><span>Your picks, in order</span></Link>
          <Link to="/venues" className="tile tile-b"><Icon name="map" /><strong>Venue Map</strong><span>Find every stage</span></Link>
          <Link to="/info" className="tile tile-c"><Icon name="megaphone-fill" /><strong>News & Info</strong><span>Shuttles, tips, updates</span></Link>
          <Link to="/join" className="tile tile-d"><Icon name="ticket-perforated-fill" /><strong>Band Sign-Up</strong><span>Got an invite code?</span></Link>
        </div>

        {data && data.news.length > 0 && (
          <section className="card">
            <div className="card-head">
              <h2>Latest news</h2>
              <Link to="/info" className="link">All news <Icon name="chevron-right" /></Link>
            </div>
            <article className="news">
              <h3>{data.news[0].title}</h3>
              <p>{data.news[0].body}</p>
            </article>
          </section>
        )}
      </div>
    </>
  );
}
