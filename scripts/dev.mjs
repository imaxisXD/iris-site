// Builds the page, serves it the way Cloudflare will (wrangler dev), and rebuilds whenever
// something in src/ or public/ changes. Reload the browser to see it.
//   node scripts/dev.mjs [port]
import { spawn, execFileSync } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = process.argv[2] ?? '8788';
const build = () => {
  try {
    execFileSync('node', [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit' });
  } catch {
    console.error('build failed; fix it and save again');
  }
};
build();
spawn('npx', ['wrangler', 'dev', '--port', port, '--ip', '127.0.0.1'], { cwd: root, stdio: 'inherit' });
let timer;
for (const dir of ['src', 'public']) {
  watch(path.join(root, dir), { recursive: true }, (_, file) => {
    if (file?.endsWith('assets.json') && dir === 'src') return;
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
}
