import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { store } from '../data/store';
import { toggleFollow, useFollowing, useLoad } from '../data/hooks';
import { dayLabel, displayName, genreList, showDayOf, socialUrl } from '../data/format';
import { BandArt, Icon } from '../components/Art';
import { ErrorNote, Loading, ShowRow } from '../components/ShowRow';
import { ShareBandButton } from '../components/ShareCard';

export function BandList() {
  const { data, error } = useLoad(() => store.listBands());
  const following = useFollowing();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [onlyFollowing, setOnlyFollowing] = useState(false);

  // Every genre any band lists; a band matches when it has at least one picked genre.
  const genres = useMemo(() => Array.from(new Set((data ?? []).flatMap((b) => genreList(b.genre)))).sort(), [data]);
  const toggleGenre = (g: string) => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));
  const list = (data ?? []).filter((b) =>
    (picked.length === 0 || genreList(b.genre).some((g) => picked.includes(g))) &&
    (!onlyFollowing || following.includes(b.id)) &&
    (b.name + ' ' + b.hometown + ' ' + b.genre).toLowerCase().includes(q.toLowerCase()),
  );

  // Group by first letter (ignoring "The").
  const groups = new Map<string, typeof list>();
  for (const b of list) {
    const letter = b.name.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '#';
    groups.set(letter, [...(groups.get(letter) ?? []), b]);
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page">
      <h1 className="page-title">Bands</h1>
      <div className="search">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bands, towns, styles" aria-label="Search bands" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search"><Icon name="x-circle-fill" /></button>}
      </div>
      <div className="chips" role="tablist">
        <button className={`chip ${onlyFollowing ? 'on' : ''}`} onClick={() => setOnlyFollowing((v) => !v)}>
          <Icon name="star-fill" /> Following
        </button>
        <button className={`chip ${picked.length === 0 ? 'on' : ''}`} onClick={() => setPicked([])}>
          {picked.length ? `Genres (${picked.length}) · clear` : 'All genres'}
        </button>
        {genres.map((g) => (
          <button key={g} className={`chip ${picked.includes(g) ? 'on' : ''}`} aria-pressed={picked.includes(g)} onClick={() => toggleGenre(g)}>{g}</button>
        ))}
      </div>
      {error && <ErrorNote error={error} />}
      {!data ? <Loading /> : list.length === 0 ? <p className="empty">No bands match that search.</p> : sorted.map(([letter, bands]) => (
        <section key={letter} className="card letter-group">
          <h2 className="letter">{letter}</h2>
          <div className="list">
            {bands.map((b) => (
              <Link key={b.id} to={`/bands/${b.id}`} className="band-row">
                <BandArt id={b.id} name={b.name} imageUrl={b.imageUrl} size="sm" />
                <div className="show-main">
                  <div className="show-title">{displayName(b.name)} {following.includes(b.id) && <Icon name="star-fill" className="star" />}</div>
                  <div className="show-sub">{genreList(b.genre).join(', ')} · {b.hometown}</div>
                </div>
                <Icon name="chevron-right" className="chev" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BandDetail() {
  const { id = '' } = useParams();
  const following = useFollowing();
  const { data, error } = useLoad(async () => {
    const [band, perfs, venues] = await Promise.all([store.getBand(id), store.listPerformances(), store.listVenues()]);
    return { band, perfs: perfs.filter((p) => p.bandId === id).sort((a, b) => a.start.localeCompare(b.start)), venues };
  }, [id]);

  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Loading /></div>;
  const { band, perfs, venues } = data;
  if (!band || band.status !== 'approved') {
    return <div className="page"><div className="card"><h1>Band not found</h1><p>This band isn't in the lineup.</p><Link to="/bands" className="btn">See all bands</Link></div></div>;
  }
  const isFollowing = following.includes(band.id);
  const links = ([
    ['globe', 'Website', socialUrl('website', band.website)], ['instagram', 'Instagram', socialUrl('instagram', band.instagram)],
    ['facebook', 'Facebook', socialUrl('facebook', band.facebook)], ['tiktok', 'TikTok', socialUrl('tiktok', band.tiktok)],
    ['twitter-x', 'X', socialUrl('x', band.x)], ['spotify', 'Spotify', socialUrl('spotify', band.spotify)],
    ['youtube', 'YouTube', socialUrl('youtube', band.youtube)],
  ] as [string, string, string | undefined][]).filter(([, , url]) => url) as [string, string, string][];

  return (
    <div className="page band-page">
      <section className="band-hero">
        <BandArt id={band.id} name={band.name} imageUrl={band.imageUrl} size="lg" />
        <div>
          <h1>{band.name}</h1>
          <p className="band-meta"><Icon name="music-note" /> {genreList(band.genre).join(', ')} &nbsp; <Icon name="house" /> {band.hometown}</p>
          <div className="hero-buttons">
            <button className={`btn ${isFollowing ? 'btn-light' : 'btn-accent'}`} onClick={() => toggleFollow(band.id)} aria-pressed={isFollowing}>
              <Icon name={isFollowing ? 'star-fill' : 'star'} /> {isFollowing ? 'Following' : 'Follow'}
            </button>
            <ShareBandButton band={band} perfs={perfs} venues={venues} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Shows</h2>
        {perfs.length === 0 ? <p className="muted">Show times coming soon.</p> : (
          <div className="list">
            {perfs.map((p) => (
              <div key={p.id}>
                <div className="day-label">{dayLabel(showDayOf(p.start), 'long')}</div>
                <ShowRow p={p} band={band} venue={venues.find((v) => v.id === p.venueId)} show="venue" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>About</h2>
        <p className="bio">{band.bio}</p>
        {links.length > 0 && (
          <div className="link-row">
            {links.map(([icon, label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="btn btn-outline"><Icon name={icon} /> {label}</a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
