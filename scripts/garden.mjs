// Films the cover's garden storyboard (src/Garden.tsx): a picture of the cover at set times
// after the page paints, then one under Reduce Motion, into /tmp/iris-garden.
//   node scripts/garden.mjs [url] [width]
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:8788/';
const width = Number(process.argv[3] ?? 1440);
const dir = '/tmp/iris-garden';
mkdirSync(dir, { recursive: true });
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });

const times = [0, 400, 900, 1500, 2300, 3000, 3800, 5000, 7000, 10000];
const shoot = async (page, name) => {
  const box = await page.locator('[data-garden]').boundingBox();
  const pad = 120;
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    clip: { x: Math.max(0, box.x - pad * 2), y: Math.max(0, box.y - pad), width: Math.min(width, box.width + pad * 3), height: box.height + pad * 1.5 },
  });
};

{
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  // Hold every animation at 0 until the pictures are in, then let the clock run from there.
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('[data-garden] img')].map((i) => i.decode().catch(() => {})));
    for (const a of document.getAnimations()) a.currentTime = 0;
  });
  let last = 0;
  for (const t of times) {
    await page.waitForTimeout(t - last);
    last = t;
    await shoot(page, `${width}-${String(t).padStart(5, '0')}`);
  }
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await shoot(page, `${width}-still`);
  await page.close();
}
await browser.close();
console.log(`frames in ${dir}`);
