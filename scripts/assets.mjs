// Makes everything in public/ that comes from Iris itself: fonts, the riso screen textures,
// cutouts of the flower, garden and icons, the app's own screens, and the ⌃⌥G video.
//
//   node scripts/assets.mjs [renders-dir]
//
// renders-dir holds what the Iris app draws off screen (nothing is shown, nothing is read):
//   Iris --readme-images <dir>/readme
//   Iris --snapshot      <dir>/snap
// With no argument it renders them itself from the Iris checkout in $IRIS (default
// ../grammly-alt), which must have been built with `swift build`.
// The outputs are committed, so a normal build never needs Iris.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import subsetFont from 'subset-font';

const root = path.resolve(import.meta.dirname, '..');
const iris = path.resolve(process.env.IRIS ?? path.join(root, '../grammly-alt'));
const out = (...p) => path.join(root, 'public', ...p);
for (const d of ['fonts', 'img', 'tex']) rmSync(out(d), { recursive: true, force: true }), mkdirSync(out(d), { recursive: true });

let renders = process.argv[2];
if (!renders) {
  renders = path.join(tmpdir(), 'iris-renders');
  rmSync(renders, { recursive: true, force: true });
  const bin = path.join(iris, '.build/debug/Iris');
  if (!existsSync(bin)) throw new Error(`Build Iris first: (cd ${iris} && swift build)`);
  for (const [flag, dir] of [['--readme-images', 'readme'], ['--snapshot', 'snap']]) {
    mkdirSync(path.join(renders, dir), { recursive: true });
    execFileSync(bin, [flag, path.join(renders, dir)], { stdio: 'ignore' });
  }
}
const src = (...p) => path.join(renders, ...p);

// ── Fonts ─────────────────────────────────────────────────────────────────────────────
// Every face Iris uses, cut down to the characters this site sets in it.
const fontDir = path.join(iris, 'Sources/Iris/Resources/Fonts');
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const extra = '✻·–—’‘“”…×→←↗↑↓⌃⌥⌘⇧↵⇥⌫é';
const fonts = [
  // Martian Mono keeps its weight and width axes: one family for body, caps and folios.
  ['MartianMono-Variable.ttf', 'martian.woff2', ascii + extra, { wght: { min: 300, max: 600 }, wdth: { min: 75, max: 87.5 } }],
  ['CaveatBrush-Regular.ttf', 'caveat-brush.woff2', ascii + '’‘“”…✓'],
  ['LondrinaSolid-Black.ttf', 'londrina.woff2', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ✻ '],
  ['Knewave-Regular.ttf', 'knewave.woff2', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '],
  ['Mansalva-Regular.ttf', 'mansalva.woff2', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '],
  ['RubikDoodleShadow-Regular.ttf', 'rubik-doodle.woff2', 'I'],
];
for (const [file, name, text, axes] of fonts) {
  const buf = await subsetFont(readFileSync(path.join(fontDir, file)), text, {
    targetFormat: 'woff2',
    ...(axes ? { variationAxes: axes } : {}),
  });
  writeFileSync(out('fonts', name), buf);
}

// ── Riso textures ─────────────────────────────────────────────────────────────────────
// Seeded like Iris's own (SeededRandom), so the page prints the same every time.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
async function tile(name, size, fill) {
  const data = Buffer.alloc(size * size * 4);
  fill(data, size);
  await sharp(data, { raw: { width: size, height: size, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(out('tex', name));
}
// Paper grain: Iris's Grain.tile, warm ink specks multiplied over the paper.
await tile('grain.png', 128, (d, n) => {
  const r = rng(42);
  for (let i = 0; i < n * n; i++) {
    const a = Math.max(0, Math.min(255, (r() - 0.35) * 170));
    d.set([26, 20, 16, a], i * 4);
  }
});
// The same grain at the strength Iris lays it on paper (.grain(0.22)), for the page itself,
// so the browser never has to blend a layer over the whole page.
await tile('paper.png', 128, (d, n) => {
  const r = rng(42);
  for (let i = 0; i < n * n; i++) {
    const a = Math.max(0, Math.min(255, (r() - 0.35) * 170)) * 0.22;
    d.set([26, 20, 16, a], i * 4);
  }
});
// The riso screen over an ink plate: a faint printing grid and sparse paper specks, more
// where the drum ran dry. Paper-coloured, laid over the ink.
await tile('screen.png', 192, (d, n) => {
  const r = rng(7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const o = (y * n + x) * 4;
      let a = 0;
      if (x % 3 === 0 || y % 3 === 0) a = 18; // printing grid
      const dry = 0.5 + 0.5 * Math.sin(x / 31 + Math.cos(y / 23) * 2) * Math.cos(y / 17);
      if (r() < 0.012 + dry * 0.025) a = 150 + r() * 105; // a speck of paper
      d.set([255, 252, 249, a], o);
    }
  }
});
// Ink printed through the screen, as Iris prints a shape's ink (`RisoArt.screen` in Zine.swift,
// used by `PrintedInk`): nearly solid, a faint grid every third dot, the ink drifting a few per
// cent, and rare specks gathering where the drum ran dry. A speck only thins the ink toward the
// paper (45%), it never leaves bare paper. Dark ink shows the screen far more, so it gets
// Iris's lighter touch: grid 0.22 and specks 0.35, against 0.55 and 0.6 for pale inks.
// Laid over the ink in paper colour, one tile pixel to a CSS pixel (Iris's points). 210 is a
// multiple of the grid (3) and of both noise cells, so the tile repeats without a seam.
function screenTile(name, { grid, specks, seed }) {
  const n = 210, drift = 0.1;
  const r = rng(seed);
  const noise = (cell) => {
    const g = n / cell;
    const lattice = Array.from({ length: g * g }, () => r());
    const smooth = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      const fx = smooth((x % cell) / cell), fy = smooth((y % cell) / cell);
      const at = (i, j) => lattice[((j + g) % g) * g + ((i + g) % g)];
      const top = at(gx, gy) + (at(gx + 1, gy) - at(gx, gy)) * fx;
      const bottom = at(gx, gy + 1) + (at(gx + 1, gy + 1) - at(gx, gy + 1)) * fx;
      return top + (bottom - top) * fy;
    };
  };
  const dry = noise(70), tone = noise(42);
  return tile(name, n, (d) => {
    const speck = new Uint8Array(n * n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = y * n + x;
        const chance = (0.004 + 0.085 * Math.max(0, dry(x, y) - 0.58)) * specks;
        if (r() < chance || (x > 0 && speck[i - 1] && r() < 0.35 * specks)) {
          speck[i] = 1;
          d.set([255, 252, 249, Math.round(0.45 * 255)], i * 4);
          continue;
        }
        let lift = ((y % 3 === 0 ? 0.1 : 0) + (x % 3 === 0 ? 0.07 : 0)) * grid + (tone(x, y) - 0.5) * drift;
        lift = Math.max(0, Math.min(0.3, lift));
        d.set([255, 252, 249, Math.round(lift * 255)], i * 4);
      }
    }
  });
}
await screenTile('ink.png', { grid: 0.55, specks: 0.6, seed: 7 });
await screenTile('ink-dark.png', { grid: 0.22, specks: 0.35, seed: 7 });
// Streaks: specks dragged sideways, the way the plates in Iris show the paper.
await tile('streaks.png', 256, (d, n) => {
  const r = rng(19);
  for (let k = 0; k < 420; k++) {
    const x0 = Math.floor(r() * n), y = Math.floor(r() * n), len = 1 + Math.floor(r() * r() * 9);
    const a = 120 + r() * 135;
    for (let i = 0; i < len; i++) d.set([255, 252, 249, a], (y * n + ((x0 + i) % n)) * 4);
  }
});

// ── Cutouts ───────────────────────────────────────────────────────────────────────────
// Lift a drawing off its paper: everything the paper colour that the outside can reach turns
// transparent, the pen's soft edge fades out, and white inside a petal stays white.
async function cutout(file, box, name, { tol = 20, widths = [], bg: plate, minSpot = 0, clear, holes = [] } = {}) {
  const img = sharp(src(file)).extract(box).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = plate ?? [data[0], data[1], data[2]];
  const dist = (i) => Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
  const seen = new Uint8Array(w * h);
  // A part of the picture that isn't the drawing (the banner's ink label in a corner).
  if (clear) for (let y = clear.y; y < clear.y + clear.h; y++) for (let x = clear.x; x < clear.x + clear.w; x++) { seen[y * w + x] = 1; data[(y * w + x) * 4 + 3] = 0; }
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  // Paper the outside can't reach but that isn't the drawing (sky shut in between a leaf and
  // its stem): start the fill there too.
  for (const [x, y] of holes) stack.push(y * w + x);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    const i = p * 4;
    if (data[i + 3] > 8 && dist(i) > tol) continue;
    seen[p] = 1;
    data[i + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // On a printed plate the screen's paper specks survive the fill as loose dots: drop every
  // island of ink smaller than a petal.
  if (minSpot) {
    const label = new Int32Array(w * h).fill(-1);
    for (let p0 = 0; p0 < w * h; p0++) {
      if (seen[p0] || label[p0] !== -1) continue;
      const island = [p0];
      label[p0] = p0;
      for (let k = 0; k < island.length; k++) {
        const p = island[k], x = p % w, y = (p / w) | 0;
        for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
          if (q >= 0 && !seen[q] && label[q] === -1) { label[q] = p0; island.push(q); }
        }
      }
      if (island.length < minSpot) for (const p of island) { seen[p] = 1; data[p * 4 + 3] = 0; }
    }
  }
  // Soften the rim: a pixel next to the cleared paper keeps only its share of ink.
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) continue;
    const x = p % w, y = (p / w) | 0;
    const nearPaper = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
    if (!nearPaper) continue;
    const i = p * 4;
    const share = Math.min(1, dist(i) / 90);
    if (share >= 1) continue;
    const a = Math.max(share, 0.15);
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, (data[i + c] - bg[c] * (1 - a)) / a));
    data[i + 3] = Math.round(a * 255);
  }
  const lifted = sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 });
  const { data: buf, info: trimmed } = await lifted.png().toBuffer({ resolveWithObject: true });
  await emit(buf, name, widths);
  // Where the trimmed drawing sat in the render, for pages that lay layers over it.
  manifest[name].at = [box.left - (trimmed.trimOffsetLeft ?? 0), box.top - (trimmed.trimOffsetTop ?? 0)];
}

// Writes AVIF and WebP at each width (every browser this page supports reads WebP).
const manifest = {};
async function emit(input, name, widths = [], q = { avif: 62, webp: 82 }) {
  const meta = await sharp(input).metadata();
  const sizes = [...new Set([...widths.filter((x) => x < meta.width), meta.width])];
  for (const width of sizes) {
    const base = sharp(input).resize({ width });
    await base.clone().avif({ quality: q.avif, effort: 6 }).toFile(out('img', `${name}-${width}.avif`));
    await base.clone().webp({ quality: q.webp, alphaQuality: 90, effort: 6 }).toFile(out('img', `${name}-${width}.webp`));
  }
  manifest[name] = { width: meta.width, height: meta.height, sizes };
}

// The garden storyboard: six frames of one flower, each 1/6 of the strip.
{
  const meta = await sharp(src('snap/after-garden-light.png')).metadata();
  const cell = Math.floor(meta.width / 6);
  const stages = ['bud', 'allowed', 'downloading', 'loading', 'ready', 'tried'];
  for (const [i, stage] of stages.entries()) {
    await cutout('snap/after-garden-light.png', { left: i * cell, top: 0, width: cell, height: 430 }, `garden-${stage}`, { widths: [240] });
  }
}
// The cover's flower, from the README banner (bigger than the storyboard's), lifted off its
// sky alone: the sun, butterflies and petals around it are printed apart (scripts/sprites.mjs)
// so each can move on its own.
await cutout('readme/readme-hero-light.png', { left: 1860, top: 340, width: 380, height: 480 }, 'hero-flower',
  { bg: [120, 162, 220], tol: 34, minSpot: 90, widths: [240, 320], clear: { x: 0, y: 0, w: 34, h: 44 }, holes: [[130, 300], [140, 380]] });

// Iris's riso icons, the big row.
{
  const file = 'snap/after-icons-light.png';
  const names = ['general', 'shortcuts', 'tones', 'words', 'apps', 'model', 'privacy', 'updates', 'about', 'clock', 'hand', 'plane', 'tray'];
  const centres = [52, 210, 367, 525, 683, 840, 998, 1156, 1314, 1471, 1629, 1787, 1945].map((x) => Math.round(x * 1.14));
  const meta = await sharp(src(file)).metadata();
  for (const [i, n] of names.entries()) {
    const left = Math.max(0, centres[i] - 80);
    const width = Math.min(meta.width - left, 160);
    await cutout(file, { left, top: 70, width, height: 165 }, `icon-${n}`, { tol: 16 });
  }
}

// Iris's own screens, as it draws them.
async function screen(file, name, widths, box, q) {
  let img = sharp(src(file));
  if (box) img = img.extract(box);
  await emit(await img.png().toBuffer(), name, widths, q);
}
// The menu as it opens under the menu bar, lifted off the grey it was drawn on.
await cutout('readme/readme-menu-light.png', { left: 0, top: 0, width: 800, height: 866 }, 'menu', { bg: [209, 209, 209], tol: 24, widths: [400, 800] });
await screen('readme/readme-quick-fix-light.png', 'quick-fix', [520]);
await screen('readme/readme-open-anyway-light.png', 'open-anyway', [800, 1240]);
// Settings pages for Make it yours, shown small, so pressed lightly to keep their small type sharp,
// and without their pink foot (the bottom 228px, cut a little above its rough edge): the window
// they sit in runs on in paper below them, whatever its height. Words is the README's, which has
// words in its list.
{
  const sharpText = { avif: 84, webp: 92 }, foot = 244;
  const pages = [['readme/readme-words-light.png', 'words'], ...['tones', 'apps', 'shortcuts'].map((p) => [`snap/screen-settings-${p}-light.png`, `settings-${p}`])];
  for (const [file, name] of pages) {
    const { width, height } = await sharp(src(file)).metadata();
    await screen(file, name, [560, 940], { left: 0, top: 0, width, height: height - foot }, sharpText);
  }
}
await screen('readme/readme-setup-light.png', 'setup', [560, 720]);
await screen('snap/after-book-shelf-many-light.png', 'shelf', [700]);

// What's new, as the app shows it in Settings › Updates.
writeFileSync(path.join(root, 'src/content/Changelog.md'), readFileSync(path.join(iris, 'Sources/Iris/Resources/Changelog.md')));

// The tab icon: Iris's own. (The card a shared link shows is drawn from the page: scripts/og.mjs.)
execFileSync('sips', ['-s', 'format', 'png', '-Z', '512', path.join(iris, 'assets/AppIcon.icns'), '--out', path.join(tmpdir(), 'iris-icon.png')], { stdio: 'ignore' });
await sharp(path.join(tmpdir(), 'iris-icon.png')).resize(180).png().toFile(out('apple-touch-icon.png'));
await sharp(path.join(tmpdir(), 'iris-icon.png')).resize(64).png().toFile(out('favicon.png'));

writeFileSync(path.join(root, 'src/assets.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log('assets done:', Object.keys(manifest).length, 'images');
