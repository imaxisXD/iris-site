// Draws the privacy stickers' pictures (a cloud, a sign-up card, the wi-fi, a Mac) the way Iris
// prints its drawings: a wobbly espresso pen pressed twice, the colour printed through Iris's
// riso screen and running under the pen a dot off register, a crema shadow. No clean vectors.
//
//   node scripts/privacy-icons.mjs [palette]   → public/privacy/*.png
//   node scripts/privacy-icons.mjs --sheet     → /tmp/iris-icons/privacy-options.png, every palette
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const OUT = path.join(root, 'public/privacy');
const TMP = '/tmp/iris-icons';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const SCALE = 5, DOTS = 64;

const INK = {
  espresso: [100, 56, 46], crema: [226, 200, 185], paper: [255, 252, 249],
  sky: [120, 162, 220], pink: [240, 134, 176], sunflower: [255, 190, 40], orange: [255, 116, 60], tan: [196, 157, 122],
  mint: [88, 206, 120], green: [30, 140, 85],
};
/* Each pin's two inks, its outer band and its core, per palette. */
export const PALETTES = {
  garden: { cloud: { outer: INK.sky, core: INK.sunflower }, card: { outer: INK.sunflower, core: INK.orange }, wifi: { outer: INK.orange, core: INK.sky }, mac: { outer: INK.pink, core: INK.sky }, free: { outer: INK.mint, core: INK.green }, kept: { outer: INK.pink, core: INK.sky }, book: { outer: INK.sky, core: INK.pink }, globe: { outer: INK.sky, core: INK.sunflower }, bolt: { outer: INK.sunflower, core: INK.orange } },
  cool:   { cloud: { outer: INK.sky, core: INK.pink }, card: { outer: INK.sky, core: INK.pink }, wifi: { outer: INK.sky, core: INK.pink }, mac: { outer: INK.sky, core: INK.pink }, free: { outer: INK.mint, core: INK.green }, kept: { outer: INK.pink, core: INK.sky }, book: { outer: INK.sky, core: INK.pink }, globe: { outer: INK.sky, core: INK.sunflower }, bolt: { outer: INK.sunflower, core: INK.orange } },
  warm:   { cloud: { outer: INK.sunflower, core: INK.orange }, card: { outer: INK.orange, core: INK.sunflower }, wifi: { outer: INK.sunflower, core: INK.orange }, mac: { outer: INK.orange, core: INK.sunflower }, free: { outer: INK.mint, core: INK.green }, kept: { outer: INK.pink, core: INK.sky }, book: { outer: INK.sky, core: INK.pink }, globe: { outer: INK.sky, core: INK.sunflower }, bolt: { outer: INK.sunflower, core: INK.orange } },
  mixed:  { cloud: { outer: INK.sky, core: INK.orange }, card: { outer: INK.sunflower, core: INK.sky }, wifi: { outer: INK.sky, core: INK.sunflower }, mac: { outer: INK.sunflower, core: INK.sky }, free: { outer: INK.mint, core: INK.green }, kept: { outer: INK.pink, core: INK.sky }, book: { outer: INK.sky, core: INK.pink }, globe: { outer: INK.sky, core: INK.sunflower }, bolt: { outer: INK.sunflower, core: INK.orange } },
};

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
async function plateGrey(svg, px) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/>${svg}</svg>`;
  return sharp(Buffer.from(doc)).greyscale().raw().toBuffer();
}
/** Plates one over another, like Iris's RisoArt.print: grey sets the dot density. */
async function print(seed, plates) {
  const px = DOTS, out = Buffer.alloc(px * px * 4), r = rng(seed);
  for (const { ink, dx = 0, dy = 0, svg, noise = 0.3 } of plates) {
    const grey = await plateGrey(svg, px);
    for (let y = 0; y < px; y++)
      for (let x = 0; x < px; x++) {
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= px || sy >= px) continue;
        const dark = 1 - grey[sy * px + sx] / 255;
        if (dark <= 0.02) continue;
        if (dark > (BAYER[y % 4][x % 4] + 0.5) / 16 + (r() - 0.5) * noise) out.set([...ink, 255], (y * px + x) * 4);
      }
  }
  return sharp(out, { raw: { width: px, height: px, channels: 4 } }).resize(px * SCALE, px * SCALE, { kernel: 'nearest' }).png({ palette: true, compressionLevel: 9 }).toBuffer();
}

const g = (v) => `rgb(${v},${v},${v})`;
const f = (n) => Math.round(n * 100) / 100;
const fill = (d, grey = 40) => `<path d="${d}" fill="${g(grey)}"/>`;
const pen = (d, w = 4.2) => `<path d="${d}" fill="none" stroke="${g(20)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** A closed shape traced by hand: points round it, each nudged, smoothed. */
function closed(p) {
  const n = p.length, at = (i) => p[((i % n) + n) % n];
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}
const hand = (seed, pts, amp = 1.1) => { const r = rng(seed); return closed(pts.map(([x, y]) => [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp])); };
/** An open line drawn by hand. */
const stroke = (seed, pts, amp = 0.9) => { const r = rng(seed); return 'M' + pts.map(([x, y]) => `${f(x + (r() - 0.5) * amp)},${f(y + (r() - 0.5) * amp)}`).join('L'); };
/** A box drawn by hand: straight sides that wander a little, corners kept. */
const box = (seed, [x0, y0, x1, y1], amp = 0.9) => {
  const r = rng(seed), pts = [];
  const side = (ax, ay, bx, by, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([ax + (bx - ax) * t + (i ? (r() - 0.5) * amp : 0), ay + (by - ay) * t + (i ? (r() - 0.5) * amp : 0)]); } };
  side(x0, y0, x1, y0, 5); side(x1, y0, x1, y1, 5); side(x1, y1, x0, y1, 5); side(x0, y1, x0, y0, 5);
  return 'M' + pts.map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z';
};
const ring = (cx, cy, r, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);

// ── Pins ──────────────────────────────────────────────────────────────────────────────
// Like enamel pins: a thick pen rim, nested bands of contrasting ink, a paper glint for the
// shine. Printed, not drawn clean.
const RED = [217, 67, 46];
const fillT = (d, t, grey = 40) => `<path d="${d}" fill="${g(grey)}" transform="${t}"/>`;
const about = (cx, cy, k) => `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
const capsule = (x0, y0, x1, y1, w) => {
  const len = Math.hypot(x1 - x0, y1 - y0), nx = (-(y1 - y0) / len) * (w / 2), ny = ((x1 - x0) / len) * (w / 2);
  return `M${f(x0 + nx)},${f(y0 + ny)}L${f(x1 + nx)},${f(y1 + ny)}A${w / 2},${w / 2} 0 0 0 ${f(x1 - nx)},${f(y1 - ny)}L${f(x0 - nx)},${f(y0 - ny)}A${w / 2},${w / 2} 0 0 0 ${f(x0 + nx)},${f(y0 + ny)}Z`;
};
/** A pin: `bands` are [ink, svg] laid in order; `rim` the pen; `glint` a paper shine. */
const pin = ({ shadow, bands, rim, glint, slash }) => [
  { ink: INK.crema, dx: 2, dy: 3, svg: fill(shadow, 150) },
  // Enamel is flat: the bands print nearly solid, the screen showing only at their edges.
  ...bands.map(([ink, svg]) => ({ ink, svg, noise: 0.06 })),
  { ink: INK.paper, svg: glint, noise: 0.04 },
  { ink: INK.espresso, svg: pen(rim, 3.6) },
  { ink: INK.espresso, dx: 1, svg: pen(rim, 1.3), noise: 0.5 },
];
const glintArc = (cx, cy, r, a0 = 3.6, a1 = 4.5) => pen(stroke(5, Array.from({ length: 6 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }), 0.3), 3);

function cloud(c) {
  const d = hand(11, [[14, 52], [8, 45], [9, 37], [17, 33], [19, 24], [29, 19], [38, 23], [45, 16], [56, 19], [59, 29], [67, 33], [69, 43], [63, 52]]);
  return pin({ shadow: d, rim: d, slash: true, glint: glintArc(26, 36, 9),
    bands: [[c.outer, fill(d)], [INK.paper, fillT(d, about(38, 37, 0.62))], [c.core, fill(hand(31, ring(38, 38, 6, 12), 0.5))]] });
}
function card(c) {
  const d = box(12, [12, 6, 58, 66]);
  return pin({ shadow: d, rim: d + stroke(14, [[23, 45], [47, 45]]) + stroke(15, [[23, 53], [47, 53]]), slash: true, glint: pen('M18,13L18,23', 3),
    bands: [[c.outer, fill(d)], [INK.paper, fill(box(13, [19, 13, 51, 59]))], [c.core, fill(hand(16, ring(35, 28, 8, 14), 0.6))]] });
}
function wifi(c) {
  const disc = hand(17, ring(37, 37, 30, 22), 1);
  const arc = (r, seed) => stroke(seed, Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (1.2 + (i / 12) * 0.6); return [37 + Math.cos(a) * r, 52 + Math.sin(a) * r]; }), 0.7);
  const arcs = arc(30, 18) + arc(20, 19) + arc(10, 20);
  return pin({ shadow: disc, rim: disc + arcs, slash: true, glint: glintArc(37, 37, 25, 3.5, 4.2),
    bands: [[c.outer, fill(disc)], [INK.paper, `<path d="${arcs}" fill="none" stroke="${g(30)}" stroke-width="7" stroke-linecap="round"/>`], [c.core, fill(hand(21, ring(37, 52, 4.6, 10), 0.4))]] });
}
function mac(c) {
  const screen = box(21, [13, 12, 67, 52]);
  const base = 'M5,57L75,57L70,66L10,66Z';
  const tick = stroke(24, [[30, 33], [37, 40], [51, 25]], 0.6);
  return pin({ shadow: screen + base, rim: screen + base + tick, slash: false, glint: pen('M19,19L19,28', 3),
    bands: [[c.outer, fill(screen)], [c.core, fill(box(22, [20, 18, 60, 46]))], [INK.tan, fill(base)], [INK.paper, `<path d="${tick}" fill="none" stroke="${g(30)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`]] });
}
// The Fix facts' pins, in the same hand.
const glyph = (t, x, y, size, grey = 20) => `<text x="${x}" y="${y}" font-family="Menlo, monospace" font-weight="700" font-size="${size}" text-anchor="middle" fill="${g(grey)}">${t}</text>`;
/** "Leaves things alone": an @ and a # on their own chips, kept just as they were. */
function kept(c) {
  const a = box(92, [4, 18, 38, 58], 0.5), b = box(93, [42, 18, 76, 58], 0.5);
  return pin({ shadow: a + b, rim: a + b, slash: false, glint: pen('M9,23L9,31', 2.6),
    bands: [[c.outer, fill(a)], [c.core, fill(b)], [INK.espresso, glyph('@', 21, 47, 29) + glyph('#', 59, 47, 29)]] });
}
/** "Learns your words": a little dictionary, Aa on its cover, a ribbon marking your page. */
function book(c) {
  const cover = box(101, [14, 8, 64, 70], 0.8);
  const spine = 'M14,8L20,8L20,70L14,70Z';
  const ribbon = 'M50,70L50,78L54,74L58,78L58,70Z';
  return pin({ shadow: cover, rim: cover + `M20,8L20,70` + ribbon + box(102, [26, 26, 58, 50], 0.4), slash: false, glint: pen('M26,14L26,24', 3),
    bands: [[c.outer, fill(cover)], [INK.espresso, fill(spine, 60)], [c.core, fill(ribbon)], [INK.paper, fill(box(102, [26, 26, 58, 50], 0.4))], [INK.espresso, glyph('Aa', 42, 46, 22)]] });
}
/** "Any language in": a globe, its lines drawn by hand. */
function globe(c) {
  const d = hand(111, ring(40, 40, 30, 22), 0.8);
  const meridian = (rx, seed) => hand(seed, Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return [40 + Math.cos(a) * rx, 40 + Math.sin(a) * 30]; }), 0.5);
  const lines = meridian(13, 112) + stroke(113, [[40, 10], [40, 70]], 0.5) + stroke(114, [[10, 40], [70, 40]], 0.5) + stroke(115, [[15, 26], [65, 26]], 0.6) + stroke(116, [[15, 54], [65, 54]], 0.6);
  const land = hand(117, [[22, 22], [34, 18], [36, 30], [28, 38], [20, 34]], 0.6) + hand(118, [[46, 44], [60, 42], [62, 56], [50, 62], [44, 54]], 0.6);
  return pin({ shadow: d, rim: d + lines, slash: false, glint: glintArc(40, 40, 24, 3.6, 4.4),
    bands: [[c.outer, fill(d)], [c.core, fill(land)]] });
}
/** "Quick Fix": a lightning bolt, a fix in a flash. */
function bolt(c) {
  const d = hand(81, [[44, 6], [16, 44], [36, 44], [28, 74], [64, 30], [42, 30], [52, 6]], 0.6);
  return pin({ shadow: d, rim: d, slash: false, glint: pen('M40,14L34,24', 3),
    bands: [[c.outer, fill(d)], [c.core, fillT(d, about(40, 40, 0.45))]] });
}
/** "Free forever": a chunky money-green $ scratched out with quick red pen strokes. */
function free(c) {
  // Open-counter S + protruding top/bottom bars so the $ silhouette stays crisp even at 22px.
  const sCurve = 'M54,23C52,16.5 46,14.5 39,14.5C29.5,14.5 24,18.8 24,25.5C24,32.5 30,36 40,38.5C50,41 56,45 56,53C56,60.5 49.5,65 39.5,65C31.5,65 25.5,62 23.5,56.5';
  const topPost = 'M40,6L40,17';
  const botPost = 'M40,63L40,74';
  const body = (sw, pw, grey = 20) =>
    `<path d="${topPost}" fill="none" stroke="${g(grey)}" stroke-width="${pw}" stroke-linecap="round"/>` +
    `<path d="${botPost}" fill="none" stroke="${g(grey)}" stroke-width="${pw}" stroke-linecap="round"/>` +
    `<path d="${sCurve}" fill="none" stroke="${g(grey)}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Hand-drawn diagonal red scratch-out scribbles across the $.
  const scratch =
    stroke(131, [[13, 55], [63, 12]], 1.0) +
    stroke(132, [[63, 12], [15, 68]], 1.0) +
    stroke(133, [[15, 68], [67, 25]], 1.0);
  return [
    { ink: INK.crema, dx: 2, dy: 3, svg: body(16.5, 11.5, 145) },
    { ink: INK.espresso, svg: body(16.5, 11.5, 18), noise: 0.06 },
    { ink: INK.espresso, dx: 1, svg: body(16.5, 11.5, 70), noise: 0.4 },
    { ink: c.outer, svg: body(10, 6.2, 24), noise: 0.05 },
    { ink: c.core, dx: 1, dy: 1, svg: body(7.5, 4.5, 130), noise: 0.14 },
    { ink: INK.paper, svg: '<path d="M27,23.5C28,19.5 32,17.5 37,17.5" fill="none" stroke="rgb(20,20,20)" stroke-width="2.4" stroke-linecap="round"/>', noise: 0.04 },
    { ink: RED, svg: `<path d="${scratch}" fill="none" stroke="rgb(18,18,18)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>`, noise: 0.06 },
  ];
}
const PICTURES = { cloud, card, wifi, mac, free };

async function draw(palette) {
  const out = {};
  for (const [name, shape] of Object.entries(PICTURES)) {
    out[name] = await print(30 + Object.keys(PICTURES).indexOf(name), shape(PALETTES[palette][name]));
  }
  return out;
}

if (process.argv.includes('--sheet')) {
  const size = 130, gap = 20, rows = Object.keys(PALETTES);
  const comp = [];
  for (const [r, pal] of rows.entries()) {
    const pics = await draw(pal);
    Object.values(pics).forEach((buf, c) => comp.push({ input: buf, left: 170 + c * (size + gap), top: 20 + r * (size + gap), blend: 'over' }));
    comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><text x="10" y="28" font-family="Menlo" font-size="20" fill="#2a1a16">${pal}</text></svg>`), left: 0, top: 20 + r * (size + gap) + 55 });
  }
  const resized = await Promise.all(comp.map(async (c) => (c.blend ? { ...c, input: await sharp(c.input).resize(size, size, { kernel: 'nearest' }).png().toBuffer() } : c)));
  await sharp({ create: { width: 170 + 7 * (size + gap), height: 20 + rows.length * (size + gap), channels: 3, background: { r: 246, g: 172, b: 207 } } }).composite(resized).png().toFile(path.join(TMP, 'privacy-options.png'));
  console.log('sheet →', path.join(TMP, 'privacy-options.png'));
} else {
  const pal = process.argv[2] ?? 'garden';
  const pics = await draw(pal);
  for (const [name, buf] of Object.entries(pics)) await sharp(buf).toFile(path.join(OUT, `${name}.png`));
  console.log('privacy pictures, palette', pal, '→', OUT);
}
