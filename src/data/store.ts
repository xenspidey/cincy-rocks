import type { DataStore } from './types';
import { LocalStore } from './localStore';
import { SupabaseStore } from './supabaseStore';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Live (shared) when Supabase settings are present, otherwise demo (this browser only). */
export const store: DataStore = url && key ? new SupabaseStore(url, key) : new LocalStore();

type Listener = () => void;
const listeners = new Set<Listener>();
/** Tell open screens that data changed so they reload. */
export function notifyChange() { listeners.forEach((l) => l()); }
export function onChange(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
