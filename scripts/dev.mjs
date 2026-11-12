// Builds the page, serves it the way Cloudflare will (wrangler dev), and rebuilds whenever
// something in src/ or public/ changes; the open page then reloads itself.
//   node scripts/dev.mjs [port]
//
// Live reload rather than hot module replacement: the page is HTML rendered once at build
// time, with no React in the browser, so there's no running component to swap. A dev build
// carries a few bytes of script that listen on port+1 and reload when a rebuild finishes.
import { spawn, execFileSync } from 'node:child_process';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = process.argv[2] ?? '8788';
const reloadPort = String(Number(port) + 1);
const tabs = new Set();
createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
  res.write(': open\n\n');
  tabs.add(res);
  req.on('close', () => tabs.delete(res));
}).listen(Number(reloadPort), '127.0.0.1');
const build = () => {
  try {
    execFileSync('node', [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit', env: { ...process.env, IRIS_RELOAD: reloadPort } });
    // Give wrangler a moment to see the new files, then reload every open tab.
    setTimeout(() => tabs.forEach((res) => res.write('data: reload\n\n')), 250);
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
