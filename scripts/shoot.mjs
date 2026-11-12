// Screenshots of the built page in headless Chromium, for looking at it.
//   node scripts/shoot.mjs <url> <out-dir> [width ...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { readdirSync } from 'node:fs';

const [url = 'http://localhost:8788/', out = '/tmp/iris-shots', ...ws] = process.argv.slice(2);
const widths = ws.length ? ws.map(Number) : [1440, 390];
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const executablePath = path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath });
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push('failed ' + r.url()));
  await page.goto(url, { waitUntil: 'networkidle' });
  // Load lazy pictures before the full-page shot.
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    for (const img of imgs) img.loading = 'eager';
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
  });
  await page.screenshot({ path: path.join(out, `full-${width}.png`), fullPage: true });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(width, 'height', h, errors.length ? errors : 'no errors');
  await page.close();
}
await browser.close();
