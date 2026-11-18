import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { onChange } from './store';

/** Load something from the store, reloading when data changes. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => onChange(reload), [reload]);
  useEffect(() => {
    let live = true;
    fn().then((d) => { if (live) { setData(d); setError(null); } }).catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return { data, error, reload, loading: data === undefined && !error };
}

// Favourites ("My Fest") are personal, so they always stay on this device.
const FAV_KEY = 'cincyrocks.favorites';
const favListeners = new Set<() => void>();
let favCache: string[] = readFavs();
function readFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
export function toggleFavorite(perfId: string) {
  favCache = favCache.includes(perfId) ? favCache.filter((x) => x !== perfId) : [...favCache, perfId];
  localStorage.setItem(FAV_KEY, JSON.stringify(favCache));
  favListeners.forEach((l) => l());
}
export function useFavorites(): string[] {
  return useSyncExternalStore(
    (l) => { favListeners.add(l); return () => { favListeners.delete(l); }; },
    () => favCache,
  );
}

// Followed bands
const FOLLOW_KEY = 'cincyrocks.following';
const followListeners = new Set<() => void>();
let followCache: string[] = (() => { try { return JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]'); } catch { return []; } })();
export function toggleFollow(bandId: string) {
  followCache = followCache.includes(bandId) ? followCache.filter((x) => x !== bandId) : [...followCache, bandId];
  localStorage.setItem(FOLLOW_KEY, JSON.stringify(followCache));
  followListeners.forEach((l) => l());
}
export function useFollowing(): string[] {
  return useSyncExternalStore(
    (l) => { followListeners.add(l); return () => { followListeners.delete(l); }; },
    () => followCache,
  );
}
