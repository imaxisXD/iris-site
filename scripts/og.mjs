// The card a shared link shows (public/og.jpg), drawn from the running page so it matches the cover:
// the headline and promise on the sky, and the cover's own panel, tilted, among the sun, butterflies
// and flower.
//   node scripts/og.mjs [url]     (with `npm run dev` running)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const url = process.argv[2] ?? 'http://127.0.0.1:8788/';
const root = path.join(import.meta.dirname, '..');
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
const W = 1200, H = 630;

const open = async (scale) => {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  if (errors.length) throw new Error(errors.join('\n'));
  return page;
};

// The cover's panel on nothing, at 3x, with the butterflies that sit on its words.
const cut = await open(3);
await cut.addStyleTag({ content: 'html, body { background: none !important } html::before, html::after, body::before, body::after { display: none !important }' });
const box = await cut.evaluate(() => {
  const replace = [...document.querySelectorAll('header span')].find((s) => s.textContent.trim().startsWith('Replace'));
  if (!replace) throw new Error('no panel on the cover');
  let n = replace;
  while (getComputedStyle(n).backgroundColor !== 'rgb(255, 252, 249)') n = n.parentElement;
  const b = n.getBoundingClientRect();
  for (let a = n.parentElement; a; a = a.parentElement) a.style.setProperty('background', 'none', 'important');
  [...document.body.children].forEach((c) => { if (!c.contains(n)) c.style.visibility = 'hidden'; });
  const plate = document.querySelector('header > div');
  plate.querySelectorAll(':scope > span, :scope > div:not([data-garden]):not(:has([data-garden]))').forEach((x) => (x.style.visibility = 'hidden'));
  // Garden layers take no pointer, so they're found by where they are: keep what sits on the
  // panel, hide the rest (the sun, the flower by its corner, butterflies in the sky).
  document.querySelector('[data-garden]').querySelectorAll('*').forEach((e) => {
    if (e.contains(n) || n.contains(e)) return;
    const q = e.getBoundingClientRect();
    if (!q.width || q.width > 400) return;
    const cx = q.x + q.width / 2, cy = q.y + q.height / 2;
    if (!(cx > b.left && cx < b.right && cy > b.top && cy < b.bottom)) e.style.visibility = 'hidden';
  });
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});
const m = 24;
const panelPng = await cut.screenshot({ omitBackground: true, clip: { x: box.x - m, y: box.y - m, width: box.w + 2 * m, height: Math.min(box.h + 2 * m, H - (box.y - m)) } });
await cut.close();

// The card over the page, built from the page's own parts.
const page = await open(2);
await page.evaluate(({ panel, W, H }) => {
  const INK = 'rgb(42 26 22)';
  const el = (html) => { const t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstElementChild; };
  const put = (node, css) => { node.style.cssText += ';position:absolute;' + css; c.append(node); return node; };
  const img = (src, css) => put(el(`<img src="${src}">`), css);
  const header = document.querySelector('header');

  document.documentElement.style.overflow = 'hidden';
  const c = document.createElement('div');
  c.style.cssText = `position:fixed;inset:0;width:${W}px;height:${H}px;z-index:2147483647;overflow:hidden;isolation:isolate;` +
    'background:url(/tex/screen.png) 0 0 / 96px 96px, url(/tex/streaks.png) 0 0 / 128px 128px rgb(120 162 220)';
  document.body.append(c);

  put(el('<span>TO<br>NE</span>'), 'left:-6px;top:44px;font-family:Londrina Solid;font-weight:900;font-size:330px;line-height:0.78;color:rgb(150 184 230)');
  const mark = header.querySelector('a[aria-label="Iris, home"]').cloneNode(true);
  mark.querySelector('[role=img]').style.fontSize = '50px';
  put(mark, 'left:60px;top:44px');
  const h1 = header.querySelector('h1');
  const title = h1.cloneNode(true);
  title.style.margin = '0';
  put(title, 'left:60px;top:132px;font-size:62px;width:760px;line-height:1.04');
  put(el(`<p>Grammar and tone in every app on your Mac.</p>`), `left:62px;top:300px;margin:0;font-family:Martian Mono;font-size:19px;color:${INK}`);
  put(h1.parentElement.querySelectorAll('p')[1].cloneNode(true), 'left:62px;top:348px;margin:0');
  const keys = [...header.querySelectorAll('span')].find((s) => s.textContent.trim() === 'in any text box').parentElement.cloneNode(true);
  put(keys, 'left:62px;top:424px;transform:scale(1.12);transform-origin:left top');

  for (const part of ['rays', 'face', 'glints']) img(`/sprite/sun-${part}.png`, 'right:52px;top:26px;width:170px');
  img(panel, 'left:586px;top:350px;width:570px;transform:rotate(-2.5deg)');
  const fly = (kind, css) => { for (const part of ['wings', 'body']) img(`/sprite/${kind}-${part}.png`, css); };
  fly('monarch', 'left:790px;top:176px;width:96px;transform:rotate(-14deg)');
  fly('rose', 'left:960px;top:262px;width:60px;transform:rotate(18deg)');
  fly('white', 'right:250px;top:150px;width:50px;transform:rotate(-8deg)');
  img('/sprite/petal-1.png', 'right:300px;top:120px;width:30px;transform:rotate(30deg)');
  img('/sprite/petal-2.png', 'right:250px;top:260px;width:26px;transform:rotate(-20deg)');
  img('/sprite/petal-3.png', 'left:900px;top:282px;width:22px');
  img('/img/hero-flower-335.webp', 'right:-88px;bottom:-60px;width:220px;transform:rotate(12deg)');
  return Promise.all([...c.querySelectorAll('img')].map((i) => i.decode()));
}, { panel: `data:image/png;base64,${panelPng.toString('base64')}`, W, H });
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

await sharp(shot).resize(W, H).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(root, 'public/og.jpg'));
console.log('og.jpg written');
