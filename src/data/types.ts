export type BandStatus = 'pending' | 'approved' | 'rejected';

export interface Band {
  id: string;
  name: string;
  genre: string;
  hometown: string;
  bio: string;
  website?: string;
  instagram?: string;
  spotify?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  /** X (formerly Twitter). */
  x?: string;
  contactName?: string;
  contactEmail?: string;
  /** Picture address (optional). When empty a colour gradient with initials is drawn. */
  imageUrl?: string;
  status: BandStatus;
  inviteCode?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  kind: 'indoor' | 'outdoor';
  /** 21+ only (true) or all ages (false/empty). */
  over21?: boolean;
}

export interface Performance {
  id: string;
  bandId: string;
  venueId: string;
  /** ISO date-time, local festival time (no zone), e.g. 2027-07-29T19:30 */
  start: string;
  end: string;
}

export interface Invite {
  code: string;
  note: string;
  createdAt: string;
  expiresAt?: string;
  maxUses: number;
  uses: number;
  revoked: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
}

export interface AdminSession {
  email: string;
}

export type BandApplication = Omit<Band, 'id' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewNote' | 'inviteCode'>;

export type InviteCheck =
  | { ok: true; invite: Invite }
  | { ok: false; reason: string };

/** Everything the app needs from a backend. Two versions: local (demo) and Supabase (live). */
export interface DataStore {
  readonly mode: 'demo' | 'live';
  // public
  listBands(opts?: { includeAll?: boolean }): Promise<Band[]>;
  getBand(id: string): Promise<Band | undefined>;
  listVenues(): Promise<Venue[]>;
  listPerformances(): Promise<Performance[]>;
  listNews(): Promise<NewsItem[]>;
  checkInvite(code: string): Promise<InviteCheck>;
  applyWithInvite(code: string, app: BandApplication): Promise<Band>;
  // admin auth
  needsSetup(): Promise<boolean>;
  setupAdmin(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<AdminSession>;
  signOut(): Promise<void>;
  currentAdmin(): Promise<AdminSession | null>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  // admin data
  reviewBand(id: string, status: BandStatus, note?: string): Promise<void>;
  saveBand(band: Band): Promise<void>;
  deleteBand(id: string): Promise<void>;
  listInvites(): Promise<Invite[]>;
  createInvite(opts: { note: string; maxUses: number; expiresAt?: string }): Promise<Invite>;
  revokeInvite(code: string): Promise<void>;
  saveVenue(v: Venue): Promise<void>;
  deleteVenue(id: string): Promise<void>;
  savePerformance(p: Performance): Promise<void>;
  deletePerformance(id: string): Promise<void>;
  saveNews(n: NewsItem): Promise<void>;
  deleteNews(id: string): Promise<void>;
  resetDemo?(): Promise<void>;
}
