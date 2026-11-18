import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminSession, Band, BandApplication, DataStore, Invite, InviteCheck, NewsItem, Performance, Venue } from './types';
import { newId, newInviteCode, normalizeCode } from './util';

// Live mode: data is stored in your own Supabase project (a hosted Postgres database
// with sign-in). Create the tables with supabase/schema.sql. Admin accounts use
// Supabase email + password sign-in; only people listed in the admins table can
// approve bands or make invites (enforced by the database, not just the app).

type Row = Record<string, unknown>;

const bandFromRow = (r: Row): Band => ({
  id: r.id as string,
  name: r.name as string,
  genre: (r.genre as string) ?? '',
  hometown: (r.hometown as string) ?? '',
  bio: (r.bio as string) ?? '',
  website: (r.website as string) ?? undefined,
  instagram: (r.instagram as string) ?? undefined,
  spotify: (r.spotify as string) ?? undefined,
  youtube: (r.youtube as string) ?? undefined,
  facebook: (r.facebook as string) ?? undefined,
  tiktok: (r.tiktok as string) ?? undefined,
  x: (r.x as string) ?? undefined,
  contactName: (r.contact_name as string) ?? undefined,
  contactEmail: (r.contact_email as string) ?? undefined,
  imageUrl: (r.image_url as string) ?? undefined,
  status: r.status as Band['status'],
  inviteCode: (r.invite_code as string) ?? undefined,
  createdAt: r.created_at as string,
  reviewedAt: (r.reviewed_at as string) ?? undefined,
  reviewNote: (r.review_note as string) ?? undefined,
});

const bandToRow = (b: Band | BandApplication): Row => ({
  name: b.name, genre: b.genre, hometown: b.hometown, bio: b.bio,
  website: b.website || null, instagram: b.instagram || null, spotify: b.spotify || null, youtube: b.youtube || null,
  facebook: b.facebook || null, tiktok: b.tiktok || null, x: b.x || null,
  contact_name: b.contactName || null, contact_email: b.contactEmail || null, image_url: b.imageUrl || null,
});

const inviteFromRow = (r: Row): Invite => ({
  code: r.code as string, note: (r.note as string) ?? '', createdAt: r.created_at as string,
  expiresAt: (r.expires_at as string) ?? undefined, maxUses: r.max_uses as number, uses: r.uses as number, revoked: r.revoked as boolean,
});

const perfFromRow = (r: Row): Performance => ({
  id: r.id as string, bandId: r.band_id as string, venueId: r.venue_id as string,
  start: (r.starts_at as string).slice(0, 16), end: (r.ends_at as string).slice(0, 16),
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export class SupabaseStore implements DataStore {
  readonly mode = 'live' as const;
  private sb: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey);
  }

  async listBands(opts?: { includeAll?: boolean }) {
    let q = this.sb.from('bands').select('*').order('name');
    if (!opts?.includeAll) q = q.eq('status', 'approved');
    return (check(await q) as Row[]).map(bandFromRow);
  }
  async getBand(id: string) {
    const rows = check(await this.sb.from('bands').select('*').eq('id', id).limit(1)) as Row[];
    return rows[0] ? bandFromRow(rows[0]) : undefined;
  }
  async listVenues() {
    return (check(await this.sb.from('venues').select('*').order('name')) as Row[]).map((r) => ({
      id: r.id, name: r.name, address: r.address ?? '', lat: r.lat, lng: r.lng, description: r.description ?? '', kind: r.kind ?? 'outdoor', over21: !!r.over_21,
    }) as Venue);
  }
  async listPerformances() {
    return (check(await this.sb.from('performances').select('*').order('starts_at')) as Row[]).map(perfFromRow);
  }
  async listNews() {
    return check(await this.sb.from('news').select('*').order('date', { ascending: false })) as NewsItem[];
  }

  async checkInvite(code: string): Promise<InviteCheck> {
    const reason = check(await this.sb.rpc('check_invite', { p_code: normalizeCode(code) })) as string | null;
    if (reason) return { ok: false, reason };
    return { ok: true, invite: { code: normalizeCode(code), note: '', createdAt: '', maxUses: 0, uses: 0, revoked: false } };
  }
  async applyWithInvite(code: string, app: BandApplication) {
    const row = check(await this.sb.rpc('apply_with_invite', { p_code: normalizeCode(code), p_band: bandToRow(app) })) as Row;
    return bandFromRow(row);
  }

  async needsSetup() {
    return !(check(await this.sb.rpc('has_admins')) as boolean);
  }
  async setupAdmin(email: string, password: string) {
    const { error } = await this.sb.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    const signed = await this.sb.auth.signInWithPassword({ email, password });
    if (signed.error) throw new Error(signed.error.message + ' (if email confirmation is on, confirm the email first, then sign in)');
    check(await this.sb.rpc('claim_first_admin'));
  }
  async signIn(email: string, password: string): Promise<AdminSession> {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email or password is not right.');
    const isAdmin = check(await this.sb.rpc('is_admin')) as boolean;
    if (!isAdmin) {
      await this.sb.auth.signOut();
      throw new Error('This account is not an admin.');
    }
    return { email: data.user.email ?? email };
  }
  async signOut() { await this.sb.auth.signOut(); }
  async currentAdmin() {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) return null;
    const isAdmin = check(await this.sb.rpc('is_admin')) as boolean;
    return isAdmin ? { email: data.session.user.email ?? '' } : null;
  }
  async changePassword(_old: string, newPassword: string) {
    const { error } = await this.sb.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async reviewBand(id: string, status: Band['status'], note?: string) {
    check(await this.sb.from('bands').update({ status, review_note: note ?? null, reviewed_at: new Date().toISOString() }).eq('id', id));
  }
  async saveBand(b: Band) {
    check(await this.sb.from('bands').upsert({ id: b.id, status: b.status, ...bandToRow(b) }));
  }
  async deleteBand(id: string) { check(await this.sb.from('bands').delete().eq('id', id)); }

  async listInvites() {
    return (check(await this.sb.from('invites').select('*').order('created_at', { ascending: false })) as Row[]).map(inviteFromRow);
  }
  async createInvite(opts: { note: string; maxUses: number; expiresAt?: string }) {
    const row = { code: newInviteCode(), note: opts.note, max_uses: Math.max(1, opts.maxUses), expires_at: opts.expiresAt ?? null };
    const data = check(await this.sb.from('invites').insert(row).select().single()) as Row;
    return inviteFromRow(data);
  }
  async revokeInvite(code: string) { check(await this.sb.from('invites').update({ revoked: true }).eq('code', code)); }

  async saveVenue(v: Venue) {
    const { over21, ...rest } = v;
    check(await this.sb.from('venues').upsert({ ...rest, over_21: !!over21, id: v.id || newId('v') }));
  }
  async deleteVenue(id: string) { check(await this.sb.from('venues').delete().eq('id', id)); }
  async savePerformance(p: Performance) {
    check(await this.sb.from('performances').upsert({ id: p.id, band_id: p.bandId, venue_id: p.venueId, starts_at: p.start, ends_at: p.end }));
  }
  async deletePerformance(id: string) { check(await this.sb.from('performances').delete().eq('id', id)); }
  async saveNews(n: NewsItem) { check(await this.sb.from('news').upsert(n)); }
  async deleteNews(id: string) { check(await this.sb.from('news').delete().eq('id', id)); }
}
