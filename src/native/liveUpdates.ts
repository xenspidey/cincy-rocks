// Live updates for the phone apps: new versions of the app's screens arrive from the website
// without going through the App Store or Google Play.
//
// Every website publish also puts a zipped copy of the app and updates/latest.json on the site
// (see .github/workflows/pages.yml). The app reads latest.json when it starts and whenever it
// comes back to the screen, downloads a newer copy in the background, and switches to it the next
// time it is reopened. If a new copy fails to start, the updater rolls back to the last good one.
// Changes to the native shell (new phone permissions or plugins) still need a store release:
// raising MIN_NATIVE_VERSION asks people on older store versions to install the new one.
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { FESTIVAL } from '../config';

/** This copy's version, e.g. 1.0.0-2e7ed3c (set by the build; "dev" on your own computer). */
export const APP_BUILD = (import.meta.env.VITE_APP_BUILD as string | undefined) || 'dev';

interface Manifest {
  /** Missing while live updates are paused (repository variable LIVE_UPDATES = off). */
  version?: string;
  url?: string;
  checksum?: string;
  /** Store versions older than this are asked to install the new store version. */
  minNativeVersion?: string;
}

/** Compares dotted version numbers: "1.10" > "1.9". */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

let storeVersionNeeded = false;
const storeListeners = new Set<() => void>();
/** True when this store version is older than MIN_NATIVE_VERSION. */
export const needsStoreVersion = () => storeVersionNeeded;
export function onStoreVersionNeeded(l: () => void) { storeListeners.add(l); return () => { storeListeners.delete(l); }; }

let checking = false;
let queued: string | undefined;

async function check() {
  if (checking) return;
  checking = true;
  try {
    const base = FESTIVAL.siteUrl.replace(/\/?$/, '/');
    const res = await fetch(`${base}updates/latest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const m = (await res.json()) as Manifest;
    const { native } = await CapacitorUpdater.current();
    if (m.minNativeVersion && compareVersions(native, m.minNativeVersion) < 0) {
      // Newer screens may rely on native parts this store version lacks: don't install them.
      if (!storeVersionNeeded) { storeVersionNeeded = true; storeListeners.forEach((l) => l()); }
      return;
    }
    if (!m.version || !m.url || m.version === APP_BUILD || m.version === queued) return;
    const { bundles } = await CapacitorUpdater.list();
    const known = bundles.find((b) => b.version === m.version);
    if (known?.status === 'error') return; // this version failed to start before: wait for the next one
    const bundle = known ?? (await CapacitorUpdater.download({ version: m.version, url: m.url, checksum: m.checksum }));
    await CapacitorUpdater.next({ id: bundle.id }); // used the next time the app is reopened
    queued = m.version;
  } catch {
    // Offline or the site is unreachable: try again next time the app comes to the screen.
  } finally {
    checking = false;
  }
}

/** Call once at start-up. Does nothing on the website. */
export function startLiveUpdates() {
  if (!Capacitor.isNativePlatform() || !FESTIVAL.siteUrl.startsWith('http')) return;
  // Tells the updater this copy started fine; without it the next launch rolls back.
  CapacitorUpdater.notifyAppReady().catch(() => {});
  check();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
