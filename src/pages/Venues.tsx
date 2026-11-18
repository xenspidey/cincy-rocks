import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import '@maplibre/maplibre-gl-leaflet';
import { FESTIVAL } from '../config';
import { store } from '../data/store';
import { useLoad } from '../data/hooks';
import { dayLabel, displayName, showDayOf } from '../data/format';
import type { Venue } from '../data/types';
import { Icon } from '../components/Art';
import { ErrorNote, Loading, ShowRow } from '../components/ShowRow';

// MapLibre draws the map in a background worker. Once bundled it can't find that file
// by itself, so point it at the copy Vite publishes with the site.
setWorkerUrl(maplibreWorkerUrl);

// Credit line OpenFreeMap asks for, shown in the map's corner.
const MAP_CREDIT = '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> '
  + '<a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">&copy; OpenMapTiles</a> '
  + 'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

function pin(n: number, active = false) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin ${active ? 'active' : ''}"><span>${n}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

function VenueMap({ venues, focus, height = 320 }: { venues: Venue[]; focus?: string; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  useEffect(() => {
    if (!el.current) return;
    const f = venues.find((v) => v.id === focus);
    const map = L.map(el.current, { scrollWheelZoom: false, maxZoom: 19 }).setView(f ? [f.lat, f.lng] : [FESTIVAL.mapCenter.lat, FESTIVAL.mapCenter.lng], f ? 17 : FESTIVAL.mapZoom);
    // OpenFreeMap vector tiles, drawn by MapLibre underneath Leaflet's pins.
    L.maplibreGL({ style: FESTIVAL.mapStyle, attributionControl: { customAttribution: MAP_CREDIT } }).addTo(map);
    venues.forEach((v, i) => {
      L.marker([v.lat, v.lng], { icon: pin(i + 1, v.id === focus), title: v.name })
        .addTo(map)
        .bindTooltip(v.name)
        .on('click', () => nav(`/venues/${v.id}`));
    });
    if (!f && venues.length > 1) map.fitBounds(L.latLngBounds(venues.map((v) => [v.lat, v.lng])), { padding: [30, 30], animate: false });
    addLocateButton(map);
    // Stop any zoom animation first: Leaflet errors if one finishes after the map is gone.
    return () => { map.stop(); map.remove(); };
  }, [venues, focus, nav]);
  return <div ref={el} className="map" style={{ height }} role="region" aria-label="Venue map" />;
}

/** "Show my location" button: the phone apps ask for location permission the first time. */
function addLocateButton(map: L.Map) {
  if (!('geolocation' in navigator)) return;
  let me: L.CircleMarker | undefined;
  const Locate = L.Control.extend({
    onAdd() {
      const btn = L.DomUtil.create('button', 'map-locate');
      btn.type = 'button';
      btn.title = 'Show my location';
      btn.setAttribute('aria-label', 'Show my location');
      btn.innerHTML = '<i class="bi bi-crosshair"></i>';
      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, 'click', () => {
        btn.classList.add('busy');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btn.classList.remove('busy');
            const at: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
            me?.remove();
            me = L.circleMarker(at, { radius: 8, color: '#fff', weight: 3, fillColor: '#0090d8', fillOpacity: 1 })
              .addTo(map)
              .bindTooltip('You are here');
            map.setView(at, Math.max(map.getZoom(), 16));
          },
          () => { btn.classList.remove('busy'); btn.title = 'Location is off or not allowed'; btn.classList.add('denied'); },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      });
      return btn;
    },
  });
  new Locate({ position: 'topright' }).addTo(map);
}

function directions(v: Venue) {
  return `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
}

function AgeBadge({ v }: { v: Venue }) {
  return v.over21 ? <span className="age-badge">21+</span> : <span className="age-badge all">All ages</span>;
}

type AgeFilter = 'any' | 'all-ages' | '21';

export function Venues() {
  const { data: all, error } = useLoad(() => store.listVenues());
  const [age, setAge] = useState<AgeFilter>('any');
  const data = useMemo(() => all?.filter((v) => age === 'any' || (age === '21' ? !!v.over21 : !v.over21)), [all, age]);
  return (
    <div className="page">
      <h1 className="page-title">Venue Map</h1>
      {error && <ErrorNote error={error} />}
      {!data ? <Loading /> : (
        <>
          <div className="card map-card"><VenueMap venues={data} /></div>
          <div className="chips" role="group" aria-label="Filter venues by age">
            {([['any', 'All venues'], ['all-ages', 'All ages'], ['21', '21+ only']] as [AgeFilter, string][]).map(([k, label]) => (
              <button key={k} className={`chip ${age === k ? 'on' : ''}`} aria-pressed={age === k} onClick={() => setAge(k)}>{label}</button>
            ))}
          </div>
          <section className="card">
            <h2>{age === 'any' ? 'All venues' : age === '21' ? '21+ venues' : 'All-ages venues'}</h2>
            {data.length === 0 && <p className="muted">No venues match this filter.</p>}
            <div className="list">
              {data.map((v, i) => (
                <Link key={v.id} to={`/venues/${v.id}`} className="band-row">
                  <span className="venue-num">{i + 1}</span>
                  <div className="show-main">
                    <div className="show-title">{displayName(v.name)} <AgeBadge v={v} /></div>
                    <div className="show-sub"><Icon name={v.kind === 'indoor' ? 'building' : 'tree'} /> {v.kind === 'indoor' ? 'Indoor' : 'Outdoor'} · {v.address}</div>
                  </div>
                  <Icon name="chevron-right" className="chev" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function VenueDetail() {
  const { id = '' } = useParams();
  const { data, error } = useLoad(async () => {
    const [venues, perfs, bands] = await Promise.all([store.listVenues(), store.listPerformances(), store.listBands()]);
    return { venues, perfs: perfs.filter((p) => p.venueId === id), bands };
  }, [id]);
  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!data) return <div className="page"><Loading /></div>;
  const v = data.venues.find((x) => x.id === id);
  if (!v) return <div className="page"><div className="card"><h1>Venue not found</h1><Link to="/venues" className="btn">All venues</Link></div></div>;
  const days = [...new Set(data.perfs.map((p) => showDayOf(p.start)))].sort();

  return (
    <div className="page">
      <h1 className="page-title">{v.name}</h1>
      <div className="card map-card"><VenueMap venues={data.venues} focus={v.id} height={240} /></div>
      <section className="card">
        <p className="band-meta"><Icon name="geo-alt" /> {v.address} · {v.kind === 'indoor' ? 'Indoor' : 'Outdoor'} <AgeBadge v={v} /></p>
        <p>{v.description}</p>
        <a className="btn btn-accent" href={directions(v)} target="_blank" rel="noreferrer"><Icon name="sign-turn-right" /> Directions</a>
      </section>
      {days.map((d) => (
        <section key={d} className="card">
          <h2>{dayLabel(d, 'long')}</h2>
          <div className="list">
            {data.perfs.filter((p) => showDayOf(p.start) === d).sort((a, b) => a.start.localeCompare(b.start)).map((p) => (
              <ShowRow key={p.id} p={p} band={data.bands.find((b) => b.id === p.bandId)} venue={v} show="band" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
