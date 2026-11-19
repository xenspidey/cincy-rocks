// Takes the screenshots used on the Help page (public/help/*.jpg).
//
//   npm run help:screenshots
//
// Builds the app in demo mode (sample bands, venues and shows), opens each screen at phone
// size in a headless browser and saves the pictures. Run it again after changing how the app
// looks. Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = 'public/help';
// A moment during the festival, so "Happening now" and "Starting soon" have shows in them.
const NOW = '2027-07-30T20:15';

// 1. Demo build: no live database settings, so the sample data is used.
// Invite links in the pictures show the real site address.
const SITE = process.env.VITE_SITE_URL || 'https://cincyrocks.xenspidey.com';
const env = { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_BASE: '/', VITE_SITE_URL: SITE };
execSync('npm run build', { stdio: 'inherit', env });

// 2. Serve dist/ like the real site (unknown addresses fall back to index.html).
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let path = join('dist', decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { if ((await stat(path)).isDirectory()) path = join(path, 'index.html'); } catch { path = 'dist/index.html'; }
  try { res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }); res.end(await readFile(path)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

// 3. Phone-sized screenshots.
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('dialog', (d) => d.accept());
// The clock reads festival time (countdown, dates), the launch animation is skipped, and the
// demo-mode note is hidden since visitors to the live site never see it.
await page.clock.setFixedTime(new Date(NOW + ':00'));
await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('splash')?.remove();
  const style = document.createElement('style');
  style.textContent = '.menu-note { display: none !important; }';
  document.head.append(style);
}));

const go = async (path) => {
  await page.goto(base + path + (path.includes('?') ? '&' : '?') + 'now=' + NOW);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
};
const shot = async (name, opts = {}) => {
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 78, ...opts });
  console.log('saved', `${OUT}/${name}.jpg`);
};
const scrollTo = (selector) => page.locator(selector).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70));

await go('/'); await shot('home');
await page.click('.menu-btn'); await page.waitForTimeout(200); await shot('menu');

await go('/bands'); await shot('bands');
await page.locator('.band-row').first().click(); await page.waitForSelector('.band-hero'); await page.waitForTimeout(300); await shot('band');

await go('/schedule?day=2027-07-30'); await shot('schedule');
// Pick three shows for My Fest: two at the same time (to show the clash warning) and one later.
const groups = page.locator('.time-group');
await groups.nth(0).locator('.fav-btn').nth(0).click();
await groups.nth(0).locator('.fav-btn').nth(1).click();
await groups.nth(2).locator('.fav-btn').nth(0).click();
await go('/favorites'); await shot('myfest');

await go('/venues'); await page.waitForTimeout(4000); await shot('map');
await go('/info'); await shot('info');

await go('/join'); await shot('join-code');
await go('/join?code=DEMO-2027'); await page.waitForSelector('text=Tell us about your band'); await shot('join-form');

// Festival team: create the demo admin account, then the admin screens.
await go('/admin');
await page.fill('input[type=email]', 'team@example.com');
await page.locator('input[type=password]').nth(0).fill('demo-password');
await page.locator('input[type=password]').nth(1).fill('demo-password');
await page.click('button:has-text("Create account")');
await page.waitForSelector('.admin-tabs'); await page.waitForTimeout(400); await shot('admin-approvals');

await go('/admin?tab=invites');
await page.fill('input[placeholder^="e.g. Saturday"]', 'Saturday open-call bands');
await page.click('button:has-text("Create invite")'); await page.waitForSelector('.invite-card'); await page.waitForTimeout(400);
await shot('admin-invite');

await go('/admin?tab=schedule'); await shot('admin-schedule');
await go('/admin?tab=venues'); await shot('admin-venues');
await go('/admin?tab=news'); await shot('admin-news');

await browser.close();
server.close();
