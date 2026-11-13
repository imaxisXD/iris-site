// Draws the apps the page names (Slack, Mail, Messages, Notes, Chrome, Safari, TextEdit) the
// way Iris draws its own icons: a wobbly espresso pen line, a crema shadow plate under the
// colour, and each colour printed off register through Iris's riso screen (RisoArt.print: a
// 4×4 Bayer threshold with a little noise; grey sets the dot density). Each app keeps its own
// colours; only the drawing is Iris's.
//
//   node scripts/app-icons.mjs     → public/app/*.png and /tmp/iris-icons/sheet.png
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const OUT = path.join(root, 'public/app');
const TMP = '/tmp/iris-icons';
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const SCALE = 6; // each printed dot, blown up nearest-neighbour so it stays square
const DOTS = 44; // dots across an icon

const INK = {
  espresso: [100, 56, 46],
  crema: [226, 200, 185],
  paper: [255, 252, 249],
};
// The apps' own colours.
const C = {
  slackBlue: [54, 197, 240],
  slackGreen: [46, 182, 125],
  slackYellow: [236, 178, 46],
  slackRed: [224, 30, 90],
  mail: [30, 130, 245],
  messages: [52, 199, 89],
  notesYellow: [255, 204, 0],
  notesLine: [200, 190, 180],
  chromeRed: [219, 68, 55],
  chromeYellow: [244, 180, 0],
  chromeGreen: [15, 157, 88],
  chromeBlue: [66, 133, 244],
  safariBlue: [26, 140, 255],
  safariRed: [235, 64, 52],
  textEdit: [70, 70, 80],
};

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function plateGrey(svg, px) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/>${svg}</svg>`;
  return sharp(Buffer.from(doc)).greyscale().raw().toBuffer();
}
/** Prints plates one over another, like Iris's `RisoArt.print`. */
async function print(name, seed, plates) {
  const px = DOTS, out = Buffer.alloc(px * px * 4), r = rng(seed);
  for (const { ink, dx = 0, dy = 0, svg, noise = 0.35 } of plates) {
    const grey = await plateGrey(svg, px);
    for (let y = 0; y < px; y++)
      for (let x = 0; x < px; x++) {
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= px || sy >= px) continue;
        const dark = 1 - grey[sy * px + sx] / 255;
        if (dark <= 0.02) continue;
        const t = (BAYER[y % 4][x % 4] + 0.5) / 16 + (r() - 0.5) * noise;
        if (dark > t) out.set([...ink, 255], (y * px + x) * 4);
      }
  }
  const file = path.join(OUT, `${name}.png`);
  await sharp(out, { raw: { width: px, height: px, channels: 4 } }).resize(px * SCALE, px * SCALE, { kernel: 'nearest' }).png({ palette: true, compressionLevel: 9, effort: 10 }).toFile(file);
  return file;
}

// ── Drawing, in the canvas's 80×80 points ───────────────────────────────────────────
const g = (v) => `rgb(${v},${v},${v})`;
const fill = (d, grey = 70) => `<path d="${d}" fill="${g(grey)}"/>`;
const pen = (d, w = 3.4) => `<path d="${d}" fill="none" stroke="${g(25)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const f = (n) => Math.round(n * 100) / 100;
/** A closed Catmull-Rom curve through points, as cubic Béziers. */
function closed(p) {
  const n = p.length, at = (i) => p[((i % n) + n) % n];
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}
/** A shape traced by a hand: points round a curve, each nudged a little. */
const wobbly = (seed, n, at, amp = 0.7) => {
  const r = rng(seed);
  return closed(Array.from({ length: n }, (_, i) => {
    const [x, y] = at((i / n) * Math.PI * 2);
    return [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp];
  }));
};
/** The macOS tile, a squircle, drawn by hand. */
const tile = (seed, cx = 40, cy = 40, s = 31) =>
  wobbly(seed, 36, (t) => {
    const c = Math.cos(t), si = Math.sin(t), e = 0.42;
    return [cx + s * Math.sign(c) * Math.abs(c) ** e, cy + s * Math.sign(si) * Math.abs(si) ** e];
  });
const circle = (seed, cx, cy, rad, amp = 0.6) => wobbly(seed, 24, (t) => [cx + Math.cos(t) * rad, cy + Math.sin(t) * rad], amp);
const capsule = (x0, y0, x1, y1, w) => {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy * w / 2, ny = ux * w / 2;
  return `M${f(x0 + nx)},${f(y0 + ny)}L${f(x1 + nx)},${f(y1 + ny)}A${w / 2},${w / 2} 0 0 0 ${f(x1 - nx)},${f(y1 - ny)}L${f(x0 - nx)},${f(y0 - ny)}A${w / 2},${w / 2} 0 0 0 ${f(x0 + nx)},${f(y0 + ny)}Z`;
};
const sector = (cx, cy, r, a0, a1) => {
  const p = (a) => `${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`;
  return `M${cx},${cy}L${p(a0)}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}Z`;
};
// Every icon: the crema shadow, then its colours a dot up and left, then the pen.
const shadow = (d) => [{ ink: INK.crema, dx: 1, dy: 1, svg: fill(d, 110) }, { ink: INK.paper, svg: fill(d, 0), noise: 0 }];
const colour = (ink, svg) => ({ ink, dx: -1, dy: -1, svg, noise: 0.22 });
const line = (svg) => ({ ink: INK.espresso, svg });

const icons = [];
// Slack: its pinwheel, one arm (a bar and its nub) turned round four times, on a paper tile.
{
  const T = tile(1);
  const turn = (d, k) => `<g transform="rotate(${k * 90} 40 40)">${d}</g>`;
  const bar = capsule(20.5, 36, 36, 36, 8.5);
  const nub = capsule(36, 25, 36, 28.5, 8.5);
  const colours = [C.slackBlue, C.slackGreen, C.slackYellow, C.slackRed];
  icons.push(['slack', 'Slack', await print('slack', 11, [
    ...shadow(T),
    ...colours.map((c, k) => colour(c, turn(fill(bar, 30) + fill(nub, 30), k))),
    line(pen(T) + [0, 1, 2, 3].map((k) => turn(pen(bar, 2) + pen(nub, 2), k)).join('')),
  ])]);
}
// Mail: the blue tile, a paper envelope with its flap.
{
  const T = tile(2);
  const env = wobbly(21, 4, (t) => [[22, 27], [58, 27], [58, 54], [22, 54]][Math.round(t / (Math.PI / 2)) % 4], 0.5);
  const envD = 'M22,27L58,27L58,54L22,54Z';
  icons.push(['mail', 'Mail', await print('mail', 12, [
    ...shadow(T),
    colour(C.mail, fill(T, 38) + `<path d="${envD}" fill="#fff"/>`),
    line(pen(T) + pen(envD, 2.6) + pen('M23,28L40,42L57,28', 2.6)),
  ])]);
  void env;
}
// Messages: the green tile, a paper speech bubble.
{
  const T = tile(3);
  const bubble = wobbly(31, 24, (t) => [40 + Math.cos(t) * 20, 38 + Math.sin(t) * 15], 0.6);
  const tail = 'M27,48Q24,56 19,58Q29,58 34,51';
  icons.push(['messages', 'Messages', await print('messages', 13, [
    ...shadow(T),
    colour(C.messages, fill(T, 38) + `<path d="${bubble}" fill="#fff"/><path d="${tail}" fill="#fff"/>`),
    line(pen(T) + pen(bubble, 2.6) + pen(tail, 2.6)),
  ])]);
}
// Notes: a paper tile with its yellow band and ruled lines.
{
  const T = tile(4);
  const band = 'M9,9L71,9L71,26L9,26Z';
  icons.push(['notes', 'Notes', await print('notes', 14, [
    ...shadow(T),
    colour(C.notesYellow, `<clipPath id="c"><path d="${T}"/></clipPath><g clip-path="url(#c)">${fill(band, 30)}</g>`),
    colour(C.notesLine, [37, 46, 55].map((y) => pen(`M19,${y}L61,${y + 0.4}`, 2.4)).join('')),
    line(pen(T) + pen('M11,26.5Q40,25 69,26.8', 2.4)),
  ])]);
}
// Chrome: the three-colour wheel with its blue eye, on a paper tile.
{
  const T = tile(5);
  const R = 21, cx = 40, cy = 40, a = (deg) => (deg * Math.PI) / 180;
  const ring = circle(51, cx, cy, R);
  const eye = circle(52, cx, cy, 8.5, 0.3);
  icons.push(['chrome', 'Chrome', await print('chrome', 15, [
    ...shadow(T),
    colour(C.chromeRed, fill(sector(cx, cy, R, a(-150), a(-30)), 30)),
    colour(C.chromeYellow, fill(sector(cx, cy, R, a(-30), a(90)), 30)),
    colour(C.chromeGreen, fill(sector(cx, cy, R, a(90), a(210)), 30)),
    { ink: INK.paper, svg: fill(circle(53, cx, cy, 11.5, 0.3), 0) },
    colour(C.chromeBlue, fill(eye, 30)),
    line(pen(T) + pen(ring, 2.6) + pen(eye, 2.2) + [-30, 90, 210].map((d) => pen(`M${f(cx + Math.cos(a(d)) * 11.5)},${f(cy + Math.sin(a(d)) * 11.5)}L${f(cx + Math.cos(a(d)) * R)},${f(cy + Math.sin(a(d)) * R)}`, 1.8)).join('')),
  ])]);
}
// Safari: a blue compass face with its ticks and the red-and-paper needle.
{
  const T = tile(6);
  const face = circle(61, 40, 40, 22);
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2, r0 = i % 4 ? 18.5 : 16.5;
    return pen(`M${f(40 + Math.cos(a) * r0)},${f(40 + Math.sin(a) * r0)}L${f(40 + Math.cos(a) * 21)},${f(40 + Math.sin(a) * 21)}`, 1.3);
  }).join('');
  const north = 'M40,40L47,27L44,44Z', south = 'M40,40L33,53L36,36Z';
  icons.push(['safari', 'Safari', await print('safari', 16, [
    ...shadow(T),
    colour(C.safariBlue, fill(face, 34)),
    { ink: INK.paper, svg: fill('M47,27L44,44L36,36Z', 0) + fill('M33,53L36,36L44,44Z', 0) },
    colour(C.safariRed, fill('M47,27L44,44L36,36Z', 25)),
    line(pen(T) + pen(face, 2.6) + ticks + pen('M47,27L44,44L33,53L36,36Z', 2)),
  ])]);
  void north; void south;
}
// TextEdit: a sheet of paper with its lines, and the pen across it.
{
  const T = tile(7);
  const page = wobbly(71, 4, (t) => [[25, 15], [57, 17], [55, 64], [23, 62]][Math.round(t / (Math.PI / 2)) % 4], 0.4);
  const pageD = 'M25,15L57,17L55,64L23,62Z';
  const nib = capsule(30, 58, 60, 24, 6);
  icons.push(['textedit', 'TextEdit', await print('textedit', 17, [
    ...shadow(T),
    { ink: INK.paper, svg: fill(pageD, 0) },
    colour(INK.crema, [24, 31, 38, 45].map((y, i) => pen(`M29,${y + i * 0.2}L${51 - (i === 3 ? 10 : 0)},${y + 0.8 + i * 0.2}`, 1.6)).join('')),
    colour(C.textEdit, fill(nib, 40)),
    line(pen(T) + pen(pageD, 2.4) + pen(nib, 2) + pen('M30,58L26,63', 2.2)),
  ])]);
  void page;
}

// ── The sheet to look at: every icon big, then at the sizes the page would use ─────────
const big = 264, small = [64, 32, 22];
const cellW = 330, cellH = 470, W = cellW * icons.length + 40, H = cellH;
const parts = [];
let x = 20;
for (const [, label, file] of icons) {
  parts.push({ input: await sharp(file).resize(big, big, { kernel: 'nearest' }).png().toBuffer(), left: x + (cellW - big) / 2, top: 30 });
  let sx = x + 24;
  for (const s of small) {
    parts.push({ input: await sharp(file).resize(s, s, { kernel: 'lanczos3' }).png().toBuffer(), left: Math.round(sx), top: 330 + (64 - s) });
    sx += s + 26;
  }
  parts.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="60"><text x="24" y="40" font-family="Menlo" font-size="22" fill="rgb(42,26,22)">${label}</text></svg>`), left: x, top: 400 });
  x += cellW;
}
await sharp({ create: { width: W, height: H, channels: 3, background: { r: 255, g: 252, b: 249 } } }).composite(parts).png().toFile(path.join(TMP, 'sheet.png'));
console.log('icons:', icons.map((i) => i[0]).join(', '), '→', OUT, '· sheet →', path.join(TMP, 'sheet.png'));
