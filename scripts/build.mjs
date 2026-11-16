// Builds dist/: one prerendered HTML page with its CSS inlined and a few KB of script, plus
// public/ as it is. Cloudflare serves dist/ as static assets (wrangler.jsonc).
//
//   SITE_URL=https://example.com node scripts/build.mjs
import { build as esbuild } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform as minifyCss } from 'lightningcss';
import { build } from 'vite';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const ssr = path.join(root, '.ssr');
// Empty dist/ but keep the folder, so a running `wrangler dev` keeps serving it.
mkdirSync(dist, { recursive: true });
for (const f of readdirSync(dist)) rmSync(path.join(dist, f), { recursive: true, force: true });
rmSync(ssr, { recursive: true, force: true });

// 1. The page, compiled for Node. StyleX turns every style into atomic classes and writes
//    them to .ssr/assets/stylex.css.
await build({
  root,
  logLevel: 'warn',
  build: { ssr: 'src/render.tsx', outDir: ssr, emptyOutDir: true, minify: false },
});
const stylexCss = path.join(ssr, 'assets/stylex.css');
if (!existsSync(stylexCss)) throw new Error('StyleX wrote no CSS');

// 2. The CSS: the paper and faces first (it declares the layer order), then StyleX's.
const css = minifyCss({
  filename: 'page.css',
  code: Buffer.from(readFileSync(path.join(root, 'src/global.css'), 'utf8') + '\n' + readFileSync(stylexCss, 'utf8')),
  minify: true,
  targets: { safari: 16 << 16, chrome: 111 << 16, firefox: 113 << 16 },
}).code.toString();

// 3. The script.
const js = await esbuild({
  entryPoints: [path.join(root, 'src/client.ts')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['safari16', 'chrome111', 'firefox113'],
  write: false,
});
// Under `pnpm dev`, the page reloads itself after each rebuild (scripts/dev.mjs). Never in a
// real build.
const reload = process.env.IRIS_RELOAD
  ? `;new EventSource('http://127.0.0.1:${process.env.IRIS_RELOAD}/').onmessage=()=>location.reload();`
  : '';
const script = js.outputFiles[0].text.trim() + reload;

// 4. The HTML.
const { render } = await import(pathToFileURL(path.join(ssr, 'render.js')).href);
const html = render({ css, script, origin: (process.env.SITE_URL ?? '').replace(/\/$/, '') });

mkdirSync(dist, { recursive: true });
cpSync(path.join(root, 'public'), dist, { recursive: true });
writeFileSync(path.join(dist, 'index.html'), html);
// With a known address, tell search engines where the one page is.
const origin = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (origin) {
  writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc></url>\n</urlset>\n`,
  );
  writeFileSync(path.join(dist, 'robots.txt'), `${readFileSync(path.join(root, 'public/robots.txt'), 'utf8').trimEnd()}\nSitemap: ${origin}/sitemap.xml\n`);
}
rmSync(ssr, { recursive: true, force: true });

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const { gzipSync } = await import('node:zlib');
console.log(`dist/index.html  ${kb(html.length)}  (gzip ${kb(gzipSync(html).length)})  css ${kb(css.length)}  js ${kb(script.length)}`);
