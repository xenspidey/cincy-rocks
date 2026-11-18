// Builds the installable Android app (android/app/build/outputs/apk/debug/app-debug.apk).
// Needs Java 21 (JAVA_HOME) and the Android SDK (ANDROID_HOME, or android/local.properties).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const win = process.platform === 'win32';
const gradlew = join('android', win ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradlew)) { console.error('android/ is missing: run "npx cap add android" first.'); process.exit(1); }
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
// Full path: some Windows setups don't run programs from the current folder by name.
if (win) run('cmd.exe', ['/d', '/c', resolve(gradlew), 'assembleDebug', '--console=plain'], 'android');
else run('./gradlew', ['assembleDebug', '--console=plain'], 'android');
console.log('\nDone: android/app/build/outputs/apk/debug/app-debug.apk');
