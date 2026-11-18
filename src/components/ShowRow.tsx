import { Link } from 'react-router-dom';
import type { Band, Performance, Venue } from '../data/types';
import { displayName, genreList, timeLabel } from '../data/format';
import { toggleFavorite, useFavorites } from '../data/hooks';
import { BandArt, Icon } from './Art';

export function FavButton({ perfId, label }: { perfId: string; label: string }) {
  const favs = useFavorites();
  const on = favs.includes(perfId);
  return (
    <button
      className={`fav-btn ${on ? 'on' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(perfId); }}
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from My Fest` : `Add ${label} to My Fest`}
    >
      <Icon name={on ? 'heart-fill' : 'heart'} />
    </button>
  );
}

export function ShowRow({ p, band, venue, show = 'both', conflict }: {
  p: Performance; band?: Band; venue?: Venue; show?: 'both' | 'band' | 'venue'; conflict?: boolean;
}) {
  if (!band) return null;
  return (
    <Link to={`/bands/${band.id}`} className={`show-row ${conflict ? 'conflict' : ''}`}>
      <div className="show-time">
        <strong>{timeLabel(p.start)}</strong>
        <span>{timeLabel(p.end)}</span>
      </div>
      {show !== 'venue' && <BandArt id={band.id} name={band.name} imageUrl={band.imageUrl} size="sm" />}
      <div className="show-main">
        <div className="show-title">{displayName((show === 'venue' ? venue?.name : band.name) ?? '')}</div>
        <div className="show-sub">
          {show === 'band' ? genreList(band.genre).join(', ') : show === 'venue' ? displayName(band.name) : <><Icon name="geo-alt" /> {displayName(venue?.name ?? '')}</>}
        </div>
        {conflict && <div className="show-warn"><Icon name="exclamation-triangle" /> Overlaps another show you picked</div>}
      </div>
      <FavButton perfId={p.id} label={band.name} />
    </Link>
  );
}

export function Loading() {
  return <div className="loading"><span className="spinner" /> Loading…</div>;
}

export function ErrorNote({ error }: { error: string }) {
  return <div className="note note-error"><Icon name="exclamation-circle" /> {error}</div>;
}
