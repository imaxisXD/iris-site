// Prints the cover garden's cast as riso sprites: the sun in three layers (its face, long rays,
// short rays), four butterflies (wings and body apart, so the wings can beat), and petals.
//
//   node scripts/sprites.mjs
//
// The printing is Iris's own (`RisoArt.print` in Components.swift): each plate is drawn in grey
// on an 80×80 canvas, rendered at the sprite's size, ordered-dithered through a 4×4 Bayer
// screen with a little noise (grey sets the dot density) and laid down in its ink, nudged off
// register. The sun and the first butterfly are Iris's drawings (`Sprites` in Garden.swift);
// the other butterflies and the petals are new, drawn the same way.
//
// Each sprite is blown up with nearest-neighbour by SCALE, so the dots stay square and the
// browser can still turn it smoothly.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/sprite');
mkdirSync(outDir, { recursive: true });
const SCALE = 6;

// Iris's inks (DesignSystem.swift, Riso).
const INK = {
  espresso: [100, 56, 46],
  crema: [226, 200, 185],
  sunflower: [255, 190, 40],
  orange: [255, 116, 60],
  pink: [240, 134, 176],
  platePink: [236, 110, 176],
  paper: [255, 252, 249],
};

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One plate's drawing (SVG on the 80×80 canvas) as grey pixels, `px` wide. */
async function plateGrey(svg, px) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/>${svg}</svg>`;
  return sharp(Buffer.from(doc)).greyscale().raw().toBuffer();
}

/** Prints plates one over another, like `RisoArt.print`. */
async function print(name, px, seed, plates) {
  const out = Buffer.alloc(px * px * 4);
  const r = rng(seed);
  for (const { ink, dx = 0, dy = 0, svg } of plates) {
    const grey = await plateGrey(svg, px);
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= px || sy >= px) continue;
        const dark = 1 - grey[sy * px + sx] / 255;
        if (dark <= 0.02) continue;
        const t = (BAYER[y % 4][x % 4] + 0.5) / 16 + (r() - 0.5) * 0.35;
        if (dark > t) out.set([...ink, 255], (y * px + x) * 4);
      }
    }
  }
  await sharp(out, { raw: { width: px, height: px, channels: 4 } })
    .resize(px * SCALE, px * SCALE, { kernel: 'nearest' })
    .png({ palette: true, compressionLevel: 9, effort: 10 })
    .toFile(path.join(outDir, `${name}.png`));
}

// ── Drawing helpers, in the canvas's 80×80 points ──────────────────────────────────────
const g = (v) => `rgb(${v},${v},${v})`;
const fill = (d, grey) => `<path d="${d}" fill="${g(grey)}"/>`;
const pen = (d, w) => `<path d="${d}" fill="none" stroke="${g(25)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ellipse = (cx, cy, w, h) => `M${cx - w / 2} ${cy}a${w / 2} ${h / 2} 0 1 0 ${w} 0a${w / 2} ${h / 2} 0 1 0 ${-w} 0Z`;
/** Iris's wing: two quadratic curves through five points, mirrored across x = 40. */
const wing = (pts, mirror) => {
  const p = pts.map(([x, y]) => [mirror ? 80 - x : x, y]);
  return `M${p[0]}Q${p[1]} ${p[2]}Q${p[3]} ${p[4]}Z`;
};
const mirrorPath = (d) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${80 - Number(x)},${y}`);
const pair = (d) => [d, mirrorPath(d)];

// ── The sun: Iris's, its rays apart from its face so they can turn and twinkle ─────────
const SUN_PX = 44;
await print('sun-face', SUN_PX, 25, [
  { ink: INK.crema, dx: 1, dy: 1, svg: fill(ellipse(41, 41, 34, 34), 160) },
  { ink: INK.sunflower, dx: -1, dy: -1, svg: fill(ellipse(40, 40, 32, 32), 45) },
  { ink: INK.espresso, svg: pen(ellipse(40, 40, 32, 32), 3.4) },
]);
const rays = (n, from, to, turn) =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * 2 * Math.PI + turn;
    const p = (r) => `${(40 + r * Math.cos(a)).toFixed(2)},${(40 + r * Math.sin(a)).toFixed(2)}`;
    return `M${p(from)}L${p(to)}`;
  }).join('');
await print('sun-rays', SUN_PX, 26, [{ ink: INK.espresso, svg: pen(rays(8, 22, 32.5, 0), 3.4) }]);
await print('sun-glints', SUN_PX, 27, [
  { ink: INK.sunflower, dx: -1, dy: -1, svg: pen(rays(8, 24, 29, Math.PI / 8), 3.2) },
  { ink: INK.espresso, svg: pen(rays(8, 25, 28.5, Math.PI / 8), 2) },
]);

// ── Butterflies, seen from above ───────────────────────────────────────────────────────
// Each is printed twice: the wings (shadow, colour, pen) and the body (pen), so the page
// can beat the wings and keep the body still. All share the 80×80 canvas, body on x = 40.
const body = (len = 34) =>
  pen(`M40,26L40,${26 + len}`, 6.5) + pen('M39,24Q37,12 31,9', 2.6) + pen('M41,24Q43,12 49,9', 2.6);

/** wings: [{ d, grey }] in the colour plate; marks: extra pen on the wings (spots, stripes). */
async function butterfly(name, px, seed, colour, wings, { marks = '', spots = '', len } = {}) {
  await print(`${name}-wings`, px, seed, [
    { ink: INK.crema, dx: 1, dy: 1, svg: wings.map((w) => fill(w.d, 160)).join('') },
    { ink: colour, dx: -1, dy: -1, svg: wings.map((w) => fill(w.d, w.grey)).join('') },
    { ink: INK.espresso, svg: wings.map((w) => pen(w.d, 3.2)).join('') + marks + spots },
  ]);
  await print(`${name}-body`, px, seed + 1, [{ ink: INK.espresso, svg: body(len) }]);
}

// 1. Iris's own: pointed orange forewings, pale hindwings. Orange, so it stands off the bloom.
{
  const fore = [[38, 30], [14, 4], [4, 20], [10, 42], [38, 40]];
  const hind = [[38, 42], [12, 46], [18, 68], [30, 70], [38, 52]];
  await butterfly('monarch', 36, 21, INK.orange, [
    { d: wing(fore, false), grey: 45 }, { d: wing(fore, true), grey: 45 },
    { d: wing(hind, false), grey: 175 }, { d: wing(hind, true), grey: 175 },
  ]);
}
// 2. A rose: round wings in the plate's pink, an eye on each.
{
  const fore = [[38, 30], [8, 2], [3, 24], [12, 44], [38, 40]];
  const hind = [[38, 42], [4, 42], [12, 68], [30, 74], [38, 52]];
  const eyes = [[20, 22, 7], [19, 56, 5.5]].flatMap(([x, y, d]) => [ellipse(x, y, d, d), ellipse(80 - x, y, d, d)]);
  await butterfly('rose', 34, 31, INK.platePink, [
    { d: wing(fore, false), grey: 70 }, { d: wing(fore, true), grey: 70 },
    { d: wing(hind, false), grey: 130 }, { d: wing(hind, true), grey: 130 },
  ], { spots: eyes.map((d) => fill(d, 25)).join('') });
}
// 3. A swallowtail: long sunflower forewings striped in pen, hindwings drawn out into tails.
{
  const fore = [[38, 28], [16, -2], [0, 12], [6, 40], [38, 38]];
  const [hindL, hindR] = pair('M38,40 Q16,36 9,46 L15,62 Q17,70 19,79 Q23,70 25,66 Q33,62 38,52Z');
  const stripes = pair('M13,9 L21,34 M22,6 L28,33 M31,8 L34,32').map((d) => pen(d, 2.4)).join('');
  await butterfly('swallowtail', 40, 41, INK.sunflower, [
    { d: wing(fore, false), grey: 40 }, { d: wing(fore, true), grey: 40 },
    { d: hindL, grey: 90 }, { d: hindR, grey: 90 },
  ], { marks: stripes, len: 36 });
}
// 4. A small white: paper wings with ink tips and a dot, a quick one.
{
  const fore = [[38, 30], [12, 6], [6, 24], [14, 42], [38, 40]];
  const hind = [[38, 42], [12, 44], [16, 64], [30, 68], [38, 52]];
  const tips = pair('M11,14 Q15,9 22,9 Q16,13 13,20Z').map((d) => fill(d, 25)).join('');
  const dots = [[22, 28, 5], [58, 28, 5]].map(([x, y, d]) => fill(ellipse(x, y, d, d), 25)).join('');
  await butterfly('white', 26, 51, INK.paper, [
    { d: wing(fore, false), grey: 20 }, { d: wing(fore, true), grey: 20 },
    { d: wing(hind, false), grey: 40 }, { d: wing(hind, true), grey: 40 },
  ], { spots: tips + dots });
}

// ── Petals, loose on the wind ──────────────────────────────────────────────────────────
const petal = 'M40,10 Q62,24 58,48 Q52,70 40,70 Q28,70 22,48 Q18,24 40,10Z';
for (const [i, [colour, grey]] of [[INK.pink, 40], [INK.platePink, 70], [INK.crema, 30]].entries()) {
  await print(`petal-${i + 1}`, 14, 61 + i, [
    { ink: INK.crema, dx: 1, dy: 1, svg: fill(petal, 190) },
    { ink: colour, svg: fill(petal, grey) },
  ]);
}

console.log('sprites printed into public/sprite');
