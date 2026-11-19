// Gives every page its own folder in dist/ so the site works as plain static files
// (each address has an index.html), and adds 404.html for detail pages like /bands/b1.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const index = join(dist, 'index.html');
if (!existsSync(index)) throw new Error('dist/index.html is missing; run vite build first');
for (const route of ['bands', 'schedule', 'venues', 'favorites', 'info', 'join', 'help', 'admin']) {
  mkdirSync(join(dist, route), { recursive: true });
  copyFileSync(index, join(dist, route, 'index.html'));
}
copyFileSync(index, join(dist, '404.html'));
console.log('postbuild: page folders written');
