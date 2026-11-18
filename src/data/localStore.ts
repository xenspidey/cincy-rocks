import type { AdminSession, Band, BandApplication, DataStore, Invite, InviteCheck, NewsItem, Performance, Venue } from './types';
import { seedBands, seedInvites, seedNews, seedPerformances, seedVenues } from './seed';
import { hashPassword, inviteProblem, newId, newInviteCode, normalizeCode } from './util';

// Demo mode: everything is kept in this browser's storage. Good for trying the app
// and for a single admin device; use the Supabase store to share data across devices.

const KEY = 'cincyrocks.db.v1';
const SESSION_KEY = 'cincyrocks.admin.session';

interface AdminUser { email: string; hash: string; salt: string }

interface Db {
  bands: Band[];
  venues: Venue[];
  performances: Performance[];
  news: NewsItem[];
  invites: Invite[];
  admins: AdminUser[];
}

function fresh(): Db {
  return {
    bands: structuredClone(seedBands),
    venues: structuredClone(seedVenues),
    performances: structuredClone(seedPerformances),
    news: structuredClone(seedNews),
    invites: structuredClone(seedInvites),
    admins: [],
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch { /* fall through */ }
  const db = fresh();
  save(db);
  return db;
}

function save(db: Db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function upsert<T>(list: T[], item: T, key: (t: T) => string) {
  const i = list.findIndex((x) => key(x) === key(item));
  if (i >= 0) list[i] = item; else list.push(item);
}

function requireAdmin() {
  if (!sessionStorage.getItem(SESSION_KEY) && !localStorage.getItem(SESSION_KEY)) {
    throw new Error('Please sign in as an admin first.');
  }
}

export class LocalStore implements DataStore {
  readonly mode = 'demo' as const;

  async listBands(opts?: { includeAll?: boolean }) {
    const db = load();
    const list = opts?.includeAll ? db.bands : db.bands.filter((b) => b.status === 'approved');
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  async getBand(id: string) { return load().bands.find((b) => b.id === id); }
  async listVenues() { return load().venues; }
  async listPerformances() { return [...load().performances].sort((a, b) => a.start.localeCompare(b.start)); }
  async listNews() { return [...load().news].sort((a, b) => b.date.localeCompare(a.date)); }

  async checkInvite(code: string): Promise<InviteCheck> {
    const inv = load().invites.find((i) => i.code === normalizeCode(code));
    const problem = inviteProblem(inv);
    return problem ? { ok: false, reason: problem } : { ok: true, invite: inv! };
  }

  async applyWithInvite(code: string, app: BandApplication): Promise<Band> {
    const db = load();
    const inv = db.invites.find((i) => i.code === normalizeCode(code));
    const problem = inviteProblem(inv);
    if (problem) throw new Error(problem);
    inv!.uses += 1;
    const band: Band = { ...app, id: newId('b'), status: 'pending', inviteCode: inv!.code, createdAt: new Date().toISOString() };
    db.bands.push(band);
    save(db);
    return band;
  }

  async needsSetup() { return load().admins.length === 0; }

  async setupAdmin(email: string, password: string) {
    const db = load();
    if (db.admins.length) throw new Error('An admin account already exists.');
    if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
    const { hash, salt } = await hashPassword(password);
    db.admins.push({ email: email.trim().toLowerCase(), hash, salt });
    save(db);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: email.trim().toLowerCase() }));
  }

  async signIn(email: string, password: string): Promise<AdminSession> {
    const user = load().admins.find((a) => a.email === email.trim().toLowerCase());
    if (user) {
      const { hash } = await hashPassword(password, user.salt);
      if (hash === user.hash) {
        const s = { email: user.email };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
        return s;
      }
    }
    throw new Error('Email or password is not right.');
  }

  async signOut() { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); }

  async currentAdmin(): Promise<AdminSession | null> {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    const me = await this.currentAdmin();
    if (!me) throw new Error('Please sign in first.');
    const db = load();
    const user = db.admins.find((a) => a.email === me.email);
    if (!user) throw new Error('Account not found.');
    const { hash } = await hashPassword(oldPassword, user.salt);
    if (hash !== user.hash) throw new Error('Your current password is not right.');
    if (newPassword.length < 8) throw new Error('Use a password of at least 8 characters.');
    Object.assign(user, await hashPassword(newPassword));
    save(db);
  }

  async reviewBand(id: string, status: Band['status'], note?: string) {
    requireAdmin();
    const db = load();
    const b = db.bands.find((x) => x.id === id);
    if (!b) throw new Error('Band not found.');
    b.status = status;
    b.reviewNote = note;
    b.reviewedAt = new Date().toISOString();
    save(db);
  }

  async saveBand(band: Band) { requireAdmin(); const db = load(); upsert(db.bands, band, (b) => b.id); save(db); }
  async deleteBand(id: string) {
    requireAdmin();
    const db = load();
    db.bands = db.bands.filter((b) => b.id !== id);
    db.performances = db.performances.filter((p) => p.bandId !== id);
    save(db);
  }

  async listInvites() { requireAdmin(); return [...load().invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async createInvite(opts: { note: string; maxUses: number; expiresAt?: string }) {
    requireAdmin();
    const db = load();
    let code = newInviteCode();
    while (db.invites.some((i) => i.code === code)) code = newInviteCode();
    const inv: Invite = { code, note: opts.note, maxUses: Math.max(1, opts.maxUses), expiresAt: opts.expiresAt, uses: 0, revoked: false, createdAt: new Date().toISOString() };
    db.invites.push(inv);
    save(db);
    return inv;
  }
  async revokeInvite(code: string) {
    requireAdmin();
    const db = load();
    const inv = db.invites.find((i) => i.code === code);
    if (inv) inv.revoked = true;
    save(db);
  }

  async saveVenue(v: Venue) { requireAdmin(); const db = load(); upsert(db.venues, v, (x) => x.id); save(db); }
  async deleteVenue(id: string) {
    requireAdmin();
    const db = load();
    db.venues = db.venues.filter((v) => v.id !== id);
    db.performances = db.performances.filter((p) => p.venueId !== id);
    save(db);
  }
  async savePerformance(p: Performance) { requireAdmin(); const db = load(); upsert(db.performances, p, (x) => x.id); save(db); }
  async deletePerformance(id: string) { requireAdmin(); const db = load(); db.performances = db.performances.filter((p) => p.id !== id); save(db); }
  async saveNews(n: NewsItem) { requireAdmin(); const db = load(); upsert(db.news, n, (x) => x.id); save(db); }
  async deleteNews(id: string) { requireAdmin(); const db = load(); db.news = db.news.filter((n) => n.id !== id); save(db); }

  async resetDemo() {
    const admins = load().admins;
    const db = fresh();
    db.admins = admins;
    save(db);
  }
}
