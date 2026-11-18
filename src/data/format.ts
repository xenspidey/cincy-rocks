import { FESTIVAL } from '../config';

export function festivalDays(): string[] {
  const out: string[] = [];
  const d = new Date(FESTIVAL.startDate + 'T12:00:00');
  const end = new Date(FESTIVAL.endDate + 'T12:00:00');
  while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}

export function dayLabel(day: string, style: 'short' | 'long' = 'short') {
  const d = new Date(day + 'T12:00:00');
  return d.toLocaleDateString('en-US', style === 'short' ? { weekday: 'short' } : { weekday: 'long', month: 'long', day: 'numeric' });
}

export function dayNum(day: string) { return new Date(day + 'T12:00:00').getDate(); }

export function timeLabel(iso: string) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function dateRangeLabel() {
  const s = new Date(FESTIVAL.startDate + 'T12:00:00');
  const e = new Date(FESTIVAL.endDate + 'T12:00:00');
  const sm = s.toLocaleDateString('en-US', { month: 'long' });
  const em = e.toLocaleDateString('en-US', { month: 'long' });
  return sm === em ? `${sm} ${s.getDate()}–${e.getDate()}` : `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}

export function initials(name: string) {
  return name.replace(/^the\s+/i, '').split(/\s+|&/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** A stable pair of stage-light colours for a band's placeholder art. */
export function bandHues(id: string): [number, number] {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = 180 + (h % 120); // cyan → purple → magenta
  return [a, (a + 50) % 360];
}

export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return a.start < b.end && b.start < a.end;
}

// ---- Schedule and display rules ----

/** A festival "day" runs until 6:00 the next morning, so a 1 AM set belongs to the night before. */
export const DAY_ROLLOVER_HOUR = 6;
/** "Starting soon" means starting within this many minutes. */
export const STARTING_SOON_MINUTES = 60;
/** Band and venue names longer than this are cut short in lists. */
export const DISPLAY_NAME_MAX = 40;

function localIso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Now, as a local festival time string. `?now=2027-07-30T21:15` in the address overrides it for testing. */
export function nowIso(): string {
  const o = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('now') : null;
  return o && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(o) ? o.slice(0, 16) : localIso(new Date());
}

function prevDay(day: string) {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** The festival day a moment belongs to (before 6 AM counts as the previous day). */
export function showDayOf(iso: string): string {
  const day = iso.slice(0, 10);
  return Number(iso.slice(11, 13)) < DAY_ROLLOVER_HOUR ? prevDay(day) : day;
}

/** Minutes since midnight of the festival day `day` (a 1 AM set the night before gives 1500). */
export function minutesInto(day: string, iso: string): number {
  const ms = new Date(iso.slice(0, 16) + ':00').getTime() - new Date(day + 'T00:00:00').getTime();
  return Math.round(ms / 60000);
}

/** Today's festival day index (0-based), or 0 when today isn't a festival day. */
export function todaysDayIndex(): number {
  const i = festivalDays().indexOf(showDayOf(nowIso()));
  return i < 0 ? 0 : i;
}

export function displayName(name: string) {
  return name.length > DISPLAY_NAME_MAX ? name.slice(0, DISPLAY_NAME_MAX) : name;
}

/** A band can have several genres, stored comma-separated and shown joined with ", ". */
export function genreList(genre: string | undefined): string[] {
  return (genre ?? '').split(',').map((g) => g.trim()).filter(Boolean);
}

const SOCIAL_PREFIX: Record<string, string> = {
  youtube: 'https://www.youtube.com/',
  x: 'https://x.com/',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  spotify: 'https://open.spotify.com/',
  tiktok: 'https://www.tiktok.com/',
};

/** Social links may be saved as a full address or just a handle; handles get the site's address in front. */
export function socialUrl(kind: keyof typeof SOCIAL_PREFIX | 'website', value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === 'website') return 'https://' + v.replace(/^\/+/, '');
  const handle = v.replace(/^\/+/, '');
  return SOCIAL_PREFIX[kind] + (kind === 'tiktok' && !handle.startsWith('@') ? '@' + handle : handle);
}
