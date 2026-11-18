const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I mix-ups

/** A random invite code like K7QM-2XPA, from the browser's secure random source. */
export function newInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export function normalizeCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return code.trim().toUpperCase();
}

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** PBKDF2-SHA256 password hash, so passwords are never stored as plain text. */
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ?? toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = new Uint8Array(salt.match(/../g)!.map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 150000 }, key, 256);
  return { hash: toHex(bits), salt };
}

export function inviteProblem(inv: { revoked: boolean; expiresAt?: string; uses: number; maxUses: number } | undefined): string | null {
  if (!inv) return 'That invite code was not found. Check the letters and try again.';
  if (inv.revoked) return 'This invite has been turned off by the festival team.';
  if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) return 'This invite has expired. Ask the festival team for a new one.';
  if (inv.uses >= inv.maxUses) return 'This invite has already been used the maximum number of times.';
  return null;
}
