// Prints the page's backdrops the way a riso prints a zine: big flat areas of one ink, a fine
// square screen that only breaks up where a shape's edge softens, type knocked out to the
// paper, and two inks to a sheet. Iris's own subjects (its flower, its sun, the page's ghost
// words), in the app's inks (DesignSystem.swift's `Riso`). Calm on purpose: the panel on top
// is what people should look at, so the print stays flat and still under it.
//
// The screen is Iris's RisoArt: a 4×4 Bayer threshold with a little jitter, each dot square.
//
//   node scripts/art.mjs            → public/art/*.avif|webp and /tmp/iris-art/*.png
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const OUT = path.join(root, 'public/art');
const TMP = '/tmp/iris-art';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const INK = {
  ink: [42, 26, 22],
  espresso: [100, 56, 46],
  pink: [240, 134, 176],
  platePink: [236, 110, 176],
  sky: [120, 162, 220],
  tan: [196, 157, 122],
  sunflower: [255, 190, 40],
  orange: [255, 116, 60],
  crema: [226, 200, 185],
  paper: [255, 252, 249],
};

function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// ── Tones: full-size grey rasters, 0 (no ink) … 1 (solid) ────────────────────────────
async function toTone(buf, w, h, blur = 0) {
  let img = sharp(buf).resize(w, h, { fit: 'fill' }).flatten({ background: '#000' }).greyscale();
  if (blur) img = img.blur(blur);
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const t = new Float32Array(w * h);
  for (let i = 0; i < t.length; i++) t[i] = data[i] / 255;
  return t;
}
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#000"/>${body}</svg>`);
const svgTone = (w, h, body, blur = 0) => toTone(svg(w, h, body), w, h, blur);
const max = (...ts) => ts[0].map((_, i) => Math.max(...ts.map((t) => t[i])));
const minus = (a, b) => a.map((v, i) => Math.max(0, v - b[i]));
const full = (w, h, v = 1) => new Float32Array(w * h).fill(v);

/** Grey masks placed on a black sheet: `items` are { gray: {data,w,h}, x, y, width, deg }. */
async function placed(w, h, items, blur = 0) {
  const layers = [];
  for (const it of items) {
    const hh = Math.round(it.gray.h * (it.width / it.gray.w));
    let g = sharp(Buffer.from(it.gray.data), { raw: { width: it.gray.w, height: it.gray.h, channels: 1 } }).resize(Math.round(it.width), hh, { kernel: 'lanczos3' });
    if (it.deg) g = g.rotate(it.deg, { background: '#000' });
    const png = await g.png().toBuffer();
    const m = await sharp(png).metadata();
    // Clip to the sheet: composite refuses overlays that run off it.
    const left = Math.round(it.x), top = Math.round(it.y);
    const cx = Math.max(0, -left), cy = Math.max(0, -top);
    const cw = Math.min(m.width - cx, w - Math.max(0, left)), ch = Math.min(m.height - cy, h - Math.max(0, top));
    if (cw <= 0 || ch <= 0) continue;
    layers.push({ input: await sharp(png).extract({ left: cx, top: cy, width: cw, height: ch }).png().toBuffer(), left: Math.max(0, left), top: Math.max(0, top), blend: 'lighten' });
  }
  const base = await sharp({ create: { width: w, height: h, channels: 3, background: '#000' } }).composite(layers).png().toBuffer();
  return toTone(base, w, h, blur);
}

// Type set in the site's own faces by headless Chromium: white on black.
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
const fontUrl = (f) => `url(data:font/woff2;base64,${readFileSync(path.join(root, 'public/fonts', f)).toString('base64')})`;
async function typeTone(w, h, html) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<style>@font-face{font-family:Chunky;src:${fontUrl('londrina.woff2')};font-weight:900}@font-face{font-family:Mono;src:${fontUrl('martian.woff2')};font-weight:300 600;font-stretch:75% 87.5%}html,body{margin:0;background:#000;color:#fff;width:${w}px;height:${h}px;overflow:hidden;position:relative}</style>${html}`);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return toTone(png, w, h, 0.6);
}

// ── The printer ─────────────────────────────────────────────────────────────────────
/** Lays one plate on the sheet: each `dot`×`dot` cell takes ink where its tone beats the
 *  Bayer threshold. Solid stays solid; only soft edges break into the screen. */
function lay(sheet, w, h, tone, color, { dot = 3, seed = 1, jitter = 0.06 } = {}) {
  const r = rng(seed);
  const k = color.map((c) => c / 255);
  for (let gy = 0; gy * dot < h; gy++)
    for (let gx = 0; gx * dot < w; gx++) {
      const cx = Math.min(w - 1, gx * dot + (dot >> 1)), cy = Math.min(h - 1, gy * dot + (dot >> 1));
      const v = tone[cy * w + cx];
      if (v <= 0.01) continue;
      if (v + (r() - 0.5) * jitter < BAYER[((gy & 3) << 2) | (gx & 3)]) continue;
      for (let y = gy * dot; y < Math.min(h, gy * dot + dot); y++)
        for (let x = gx * dot; x < Math.min(w, gx * dot + dot); x++) {
          const i = (y * w + x) * 3;
          sheet[i] *= k[0]; sheet[i + 1] *= k[1]; sheet[i + 2] *= k[2];
        }
    }
}
async function print(name, w, h, plates, sizes, { keep } = {}) {
  const sheet = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) sheet.set(INK.paper, i * 3);
  for (const p of plates) lay(sheet, w, h, p.tone, p.color, p);
  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0; i < rgb.length; i++) rgb[i] = Math.round(sheet[i]);
  const grain = await sharp(path.join(root, 'public/tex/paper.png')).resize(96).png().toBuffer();
  const png = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).composite([{ input: grain, tile: true, blend: 'multiply' }]).png().toBuffer();
  writeFileSync(path.join(TMP, `${name}.png`), png);
  if (keep) return png;
  for (const s of sizes) {
    const img = sharp(png).resize(s);
    await img.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${name}-${s}.avif`));
    await img.clone().webp({ quality: 80 }).toFile(path.join(OUT, `${name}-${s}.webp`));
  }
  return png;
}

// ── Iris's drawings, read into plates ─────────────────────────────────────────────────
// The flower from the app's README banner: its pink, its pen line, and its whole shape (so
// the plate under it is knocked out and the flower prints on paper).
const renders = process.env.IRIS_RENDERS ?? '/tmp/iris-renders';
const FW = 380, FH = 480;
const fb = await sharp(path.join(renders, 'readme/readme-hero-light.png')).extract({ left: 1860, top: 340, width: FW, height: FH }).raw().toBuffer({ resolveWithObject: true });
const flower = { pink: new Uint8Array(FW * FH), ink: new Uint8Array(FW * FH), shape: new Uint8Array(FW * FH) };
for (let i = 0; i < FW * FH; i++) {
  const ch = fb.info.channels, R = fb.data[i * ch], G = fb.data[i * ch + 1], B = fb.data[i * ch + 2];
  const lum = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
  const off = Math.max(Math.abs(R - 120), Math.abs(G - 162), Math.abs(B - 220));
  const isInk = lum < 0.36;
  flower.shape[i] = off > 46 ? 255 : 0;
  flower.ink[i] = isInk ? 255 : 0;
  flower.pink[i] = off > 46 && !isInk && R - G > 40 ? 255 : 0;
}
// The banner's sky has paper specks in it; keep only the flower's big connected parts.
{
  const seen = new Int32Array(FW * FH).fill(-1), sizes = [];
  for (let i = 0; i < FW * FH; i++) {
    if (!flower.shape[i] || seen[i] >= 0) continue;
    const id = sizes.length, stack = [i];
    let n = 0;
    seen[i] = id;
    while (stack.length) {
      const p = stack.pop(), x = p % FW, y = (p - x) / FW;
      n++;
      for (const q of [x > 0 && p - 1, x < FW - 1 && p + 1, y > 0 && p - FW, y < FH - 1 && p + FW])
        if (q !== false && flower.shape[q] && seen[q] < 0) { seen[q] = id; stack.push(q); }
    }
    sizes.push(n);
  }
  for (let i = 0; i < FW * FH; i++) if (flower.shape[i] && sizes[seen[i]] < 400) flower.shape[i] = flower.ink[i] = flower.pink[i] = 0;
  for (let i = 0; i < FW * FH; i++) if (!flower.shape[i]) flower.ink[i] = flower.pink[i] = 0;
}
const fl = (k) => ({ data: flower[k], w: FW, h: FH });

// The cover's sprites (scripts/sprites.mjs), one mask per ink.
async function spriteMask(file, ink) {
  const { data, info } = await sharp(path.join(root, 'public/sprite', file + '.png')).raw().toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(info.width * info.height);
  for (let i = 0; i < m.length; i++) {
    const a = data[i * 4 + 3], c = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    m[i] = a > 128 && (!ink || Math.abs(c[0] - ink[0]) + Math.abs(c[1] - ink[1]) + Math.abs(c[2] - ink[2]) < 24) ? 255 : 0;
  }
  return { data: m, w: info.width, h: info.height };
}
const sun = {
  face: await spriteMask('sun-face', INK.sunflower),
  line: await spriteMask('sun-face', INK.espresso),
  rays: await spriteMask('sun-rays'),
  shape: await spriteMask('sun-face'),
};
const fly = { wings: await spriteMask('monarch-wings', INK.orange), line: await spriteMask('monarch-wings', INK.espresso), body: await spriteMask('monarch-body'), shape: await spriteMask('monarch-wings') };

// ── 1. Tan: behind section 03's panel ────────────────────────────────────────────────
// The sheet in one ink, the way a zine gives a page to one ink: tan, beside the pink and sky. Iris's flower stands
// huge out of it in pink, and the tones run up the edge in paper. The panel lies on the left.
{
  const w = 2200, h = 1000;
  const at = { x: 1330, y: 60, width: 730 };
  const shape = await placed(w, h, [{ gray: fl('shape'), ...at }], 1.2);
  const pinkT = await placed(w, h, [{ gray: fl('pink'), ...at }], 1.2);
  const lineT = await placed(w, h, [{ gray: fl('ink'), ...at }], 0.8);
  const edge = await typeTone(w, h, `<div style="position:absolute;left:2150px;bottom:60px;transform:rotate(-90deg);transform-origin:0 100%;font:500 26px/1 Mono;font-stretch:87.5%;letter-spacing:0.32em;white-space:nowrap">FIX / PROFESSIONAL / FRIENDLY / SHORTER / CLEARER</div>`);
  await print('garden', w, h, [
    { tone: minus(full(w, h), max(shape, edge)), color: INK.tan, dot: 3, seed: 11 },
    { tone: lineT, color: INK.ink, dot: 3, seed: 13 },
    { tone: pinkT, color: INK.pink, dot: 3, seed: 12 },
  ], [900, 1800]);
}

// ── 2. Voice: the sky plate with the page's ghost word knocked out ───────────────────────
// A smaller sheet that peeks out from behind the panel's other side. Portrait.
{
  const w = 900, h = 1200;
  const word = await typeTone(w, h, `<div style="position:absolute;left:-30px;top:1290px;transform:rotate(-90deg);transform-origin:0 0;font:900 560px/0.8 Chunky;letter-spacing:-8px;white-space:nowrap">VOICE</div>`);
  let starSvg = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + 0.12;
    starSvg += `<line x1="700" y1="1040" x2="${(700 + Math.cos(a) * 74).toFixed(1)}" y2="${(1040 + Math.sin(a) * 74).toFixed(1)}" stroke="#fff" stroke-width="26" stroke-linecap="round"/>`;
  }
  const star = await svgTone(w, h, starSvg + '<circle cx="700" cy="1040" r="22" fill="#fff"/>', 0.8);
  await print('voice', w, h, [
    { tone: minus(full(w, h), max(word, star)), color: INK.sky, dot: 3, seed: 31 },
    { tone: star, color: INK.ink, dot: 3, seed: 32 },
  ], [450, 900]);
}

// ── 3. The desk: the Mac's desktop for the recordings, and 07's screen corner ────────────
// A spread: the left in ink with the flower in pink, the right in sky with the sun. The
// windows sit across the middle; flat ink round them, so paper pops.
let deskPng;
{
  const w = 3456, h = 2234, split = 1500;
  const at = { x: 120, y: 520, width: 1500 };
  const shape = await placed(w, h, [{ gray: fl('shape'), ...at }], 2);
  const pinkT = await placed(w, h, [{ gray: fl('pink'), ...at }], 2);
  const lineT = await placed(w, h, [{ gray: fl('ink'), ...at }], 1.4);
  const sunAt = { x: 2700, y: 150, width: 640 };
  const flyAt = { x: 2350, y: 980, width: 300, deg: -12 };
  const shapes = await placed(w, h, [{ gray: sun.shape, ...sunAt }, { gray: sun.rays, ...sunAt }, { gray: fly.shape, ...flyAt }, { gray: fly.body, ...flyAt }], 3);
  const sunFace = await placed(w, h, [{ gray: sun.face, ...sunAt }], 3);
  const wings = await placed(w, h, [{ gray: fly.wings, ...flyAt }], 3);
  const lines = await placed(w, h, [{ gray: sun.line, ...sunAt }, { gray: sun.rays, ...sunAt }, { gray: fly.line, ...flyAt }, { gray: fly.body, ...flyAt }], 3);
  const left = await svgTone(w, h, `<rect x="0" y="0" width="${split}" height="${h}" fill="#fff"/>`);
  const right = await svgTone(w, h, `<rect x="${split}" y="0" width="${w - split}" height="${h}" fill="#fff"/>`);
  deskPng = await print('desk', w, h, [
    { tone: minus(right, shapes), color: INK.sky, dot: 4, seed: 51 },
    { tone: max(minus(left, shape), lineT, lines), color: INK.ink, dot: 4, seed: 52 },
    { tone: pinkT, color: INK.pink, dot: 4, seed: 53 },
    { tone: sunFace, color: INK.sunflower, dot: 4, seed: 54 },
    { tone: wings, color: INK.orange, dot: 4, seed: 55 },
  ], [], { keep: true });
}
// The desk's top right, for 07's Mac: the corner of the screen, where the menu bar is.
{
  const corner = sharp(deskPng).extract({ left: 3456 - 1800, top: 0, width: 1800, height: 1160 });
  for (const s of [700, 1200]) {
    const img = corner.clone().resize(s);
    await img.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `corner-${s}.avif`));
    await img.clone().webp({ quality: 80 }).toFile(path.join(OUT, `corner-${s}.webp`));
  }
}
await browser.close();
console.log('art: garden, voice, corner →', OUT, '· desk →', TMP);
