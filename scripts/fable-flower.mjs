// Prints Iris's flower part by part for the cover's other animation (src/GardenFable.tsx):
// every petal, the heart, the throat, the stem, the sword leaf and the ground as a sprite of
// its own, so each can move.
//
//   node scripts/fable-flower.mjs [--proof]
//
// Writes public/fable/flower.webp (every part on one sheet) and src/fableFlower.ts (each part's
// size, the point it grows from, and where it is on the sheet).
//
// The flower isn't a picture, it is drawn in code: this is a port of the app's rig
// (IrisRig.swift), the way sprites.mjs ports Garden.swift's sun and butterflies.
//
//   the shapes      IrisRig.fall(), standard(), the leaf's blade, the stem's taper, the puddle
//   the parts       drawHead's: two falls behind, the heart, five standards, three bearded
//                   falls, the throat; then the stem, the leaf, the ground
//   a part's print  drawPetal: paper under the line, the pink landed off register through a
//                   4×4 Bayer screen with a little noise (fillScreen: five bands from tip to
//                   base, each denser and a step along the ink ramp), a beard down a fall's
//                   haft, then the pen, gone over once more a hair off
//
// Each part is printed standing straight up from its own base, as the rig draws it before
// turning it; the page turns each to its angle (IrisPose.openAngle) and moves it from there.
// The plates are landed where they land on the page whatever a part's angle, as the rig's
// `plate` does, so the pink sits off the line the same way all round the bloom.
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/fable');
mkdirSync(outDir, { recursive: true });

const S = 3.125;                 // pixels a point of the rig: its 1.6-point dot is 5 pixels
const DOT = 1.6;                 // IrisRig.dotScale
const REGISTER = [3, 2.6];       // IrisPose.register: where the colour lands, off the line
const GAP = 2;                   // clear pixels between parts on the sheet

// IrisRig's inks.
const INK = {
  pen: [38, 24, 22], paper: [252, 248, 240],
  blush: [250, 196, 218], pink: [240, 134, 176], hot: [233, 107, 192], magenta: [208, 64, 150], raspberry: [142, 36, 83],
  lilac: [200, 160, 226], tan: [196, 157, 122], espresso: [100, 56, 46],
};
const RAMP = {
  soft: [INK.blush, INK.pink, INK.hot, INK.magenta],
  deep: [INK.pink, INK.hot, INK.magenta, INK.raspberry],
  outer: [INK.lilac, INK.blush, INK.pink, INK.hot],
  heart: [INK.magenta, INK.raspberry],
  soil: [INK.tan, INK.tan, INK.espresso],
  // The earth's top, seen from above: a lighter tan at the far edge, deeper near the stem.
  surface: [[212, 178, 146], INK.tan, [178, 138, 104]],
};

// ── The shapes, in the rig's points: a part grows from 0,0 up the page (−y) ────────────
const f = (v) => Math.round(v * 100) / 100;
/** A fall: a narrow haft flaring into a blade with a ruffled tip, curling by `c`. */
const fall = (l, w, c) =>
  `M0,0C${f(-0.15 * w)},${f(-0.25 * l)} ${f(-0.95 * w + c * 0.3)},${f(-0.42 * l)} ${f(-0.85 * w + c * 0.6)},${f(-0.68 * l)}` +
  `Q${f(-0.85 * w + c)},${f(-0.97 * l)} ${f(-0.3 * w + c)},${f(-0.98 * l)}Q${f(c)},${f(-1.1 * l)} ${f(0.3 * w + c)},${f(-0.98 * l)}` +
  `Q${f(0.85 * w + c)},${f(-0.97 * l)} ${f(0.85 * w + c * 0.6)},${f(-0.68 * l)}C${f(0.95 * w + c * 0.3)},${f(-0.42 * l)} ${f(0.15 * w)},${f(-0.25 * l)} 0,0Z`;
/** A standard: pinched at the base, a cupped spoon at the top, its tip leaning in by `c`. */
const standard = (l, w, c) =>
  `M0,0C${f(-w * 0.15)},${f(-l * 0.3)} ${f(-w * 0.75 + c * 0.6)},${f(-l * 0.6)} ${f(-w * 0.5 + c)},${f(-l * 0.86)}` +
  `Q${f(c * 1.3)},${f(-l * 1.18)} ${f(w * 0.5 + c)},${f(-l * 0.86)}C${f(w * 0.75 + c * 0.6)},${f(-l * 0.6)} ${f(w * 0.15)},${f(-l * 0.3)} 0,0Z`;
const ellipse = (x, y, w, h) => `M${f(x)},${f(y + h / 2)}a${f(w / 2)},${f(h / 2)} 0 1 0 ${f(w)},0a${f(w / 2)},${f(h / 2)} 0 1 0 ${f(-w)},0Z`;

/* The parts, back to front as the rig draws them. `angle` is the way a part points when the
 * bloom is open (IrisPose.openAngle, and the two falls behind); `box` is the room it is
 * printed in, in points round its base. */
const STEM = 70;   // IrisRig.stem
const petalBox = (l, w) => [-w - 9, -1.14 * l - 6, w + 9, 7];
const PARTS = [
  { name: 'ground-back', kind: 'groundBack', angle: 0, box: [-46, -22, 48, 3] },
  { name: 'ground', kind: 'ground', angle: 0, box: [-40, -13, 42, 8] },
  { name: 'leaf', kind: 'leaf', angle: -10, box: [-18, -62, 6, 4] },
  { name: 'stem', kind: 'stem', angle: 0, box: [-6, -STEM - 4, 6, 5] },
  { name: 'back-1', kind: 'petal', angle: -96, shape: fall(31, 10, 0), l: 31, w: 10, tone: [0.45, 0.85], ramp: RAMP.soft },
  { name: 'back-2', kind: 'petal', angle: 96, shape: fall(31, 10, 0), l: 31, w: 10, tone: [0.45, 0.85], ramp: RAMP.soft },
  { name: 'heart', kind: 'heart', angle: 0, box: [-16, -16, 17, 16] },
  { name: 'standard-2', kind: 'petal', angle: -70, shape: standard(26, 11, 4), l: 26, w: 11, tone: [0.34, 0.75], ramp: RAMP.outer },
  { name: 'standard-4', kind: 'petal', angle: 70, shape: standard(26, 11, -4), l: 26, w: 11, tone: [0.34, 0.75], ramp: RAMP.outer },
  { name: 'standard-1', kind: 'petal', angle: -35, shape: standard(25, 9.5, 2.5), l: 25, w: 9.5, tone: [0.4, 0.85], ramp: RAMP.soft },
  { name: 'standard-5', kind: 'petal', angle: 35, shape: standard(25, 9.5, -2.5), l: 25, w: 9.5, tone: [0.4, 0.85], ramp: RAMP.soft },
  { name: 'standard-3', kind: 'petal', angle: 0, shape: standard(26, 11, 0), l: 26, w: 11, tone: [0.4, 0.85], ramp: RAMP.soft },
  { name: 'fall-1', kind: 'petal', angle: -122, shape: fall(38, 8.5, 4), l: 38, w: 8.5, tone: [0.7, 1], ramp: RAMP.deep, beard: true },
  { name: 'fall-3', kind: 'petal', angle: 122, shape: fall(38, 8.5, -4), l: 38, w: 8.5, tone: [0.7, 1], ramp: RAMP.deep, beard: true },
  { name: 'fall-2', kind: 'petal', angle: 180, shape: fall(26, 8.5, 0), l: 26, w: 8.5, tone: [0.6, 0.95], ramp: RAMP.deep, beard: true },
  { name: 'throat', kind: 'throat', angle: 0, box: [-6, -7, 6, 6] },
];

// ── Printing ──────────────────────────────────────────────────────────────────────────
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// One noisy screen for every part (IrisRig.screen, seed 11): a deeper tone keeps a paler one's dots.
const FIELD = (() => { const r = rng(11); return Array.from({ length: 256 }, (_, i) => (BAYER[Math.floor(i / 16) % 4][i % 4] + 0.5) / 16 + (r() - 0.5) * 0.3); })();
const mod = (v, m) => ((v % m) + m) % m;
/** The ink `m` of the way along a ramp. */
const along = (ramp, m) => {
  if (ramp.length < 2) return ramp[0];
  const x = Math.min(1, Math.max(0, m)) * (ramp.length - 1), i = Math.min(ramp.length - 2, Math.floor(x)), t = x - i;
  return ramp[i].map((v, k) => Math.round(v + (ramp[i + 1][k] - v) * t));
};

/** A part's printing room: its box in points, and what has been printed in it so far. */
function room([x0, y0, x1, y1]) {
  const w = Math.ceil((x1 - x0) * S), h = Math.ceil((y1 - y0) * S);
  const out = new Float32Array(w * h * 4);
  /** `body` (SVG, in points) as coverage 0–1 a pixel. */
  const cover = async (body) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x0} ${y0} ${w / S} ${h / S}"><rect x="${x0}" y="${y0}" width="${w / S}" height="${h / S}" fill="#000"/>${body}</svg>`;
    const grey = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer();
    return Float32Array.from(grey, (v) => v / 255);
  };
  const fillOf = (d, transform = '') => `<path d="${d}" fill="#fff" transform="${transform}"/>`;
  const strokeOf = (d, width, transform = '') => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" transform="${transform}"/>`;
  /** Ink laid over what's there, as much as `a` covers. */
  const lay = (a, ink, strength = 1) => {
    for (let i = 0; i < w * h; i++) {
      const k = a[i] * strength;
      if (k <= 0.004) continue;
      const o = i * 4, under = out[o + 3];
      for (let c = 0; c < 3; c++) out[o + c] = ink[c] * k + out[o + c] * (1 - k);
      out[o + 3] = k + under * (1 - k);
    }
  };
  return {
    w, h, x0, y0, out, cover, fillOf, strokeOf, lay,
    /** Flat ink where a shape is. */
    async fill(body, ink) { lay(await cover(body), ink); },
    /** fillScreen: dots landed `reg` off the shape, in five bands from its tip to its base. */
    async screen(d, reg, [tip, base], ramp) {
      const moved = await cover(fillOf(d, `translate(${reg[0]} ${reg[1]})`));
      const bands = [[1, 0], [0.84, 0.25], [0.69, 0.5], [0.55, 0.75], [0.42, 1]];
      for (const [shrink, m] of bands) {
        const area = shrink === 1 ? null : await cover(fillOf(d, `translate(${reg[0]} ${reg[1]}) scale(${shrink})`));
        const ink = along(ramp, m), density = Math.round(Math.min(1, Math.max(0, tip + (base - tip) * m)) * 16) / 16;
        for (let y = 0; y < h; y++) {
          const cy = mod(Math.floor((y0 + (y + 0.5) / S) / DOT), 16);
          for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (moved[i] < 0.5 || (area && area[i] < 0.5)) continue;
            const cx = mod(Math.floor((x0 + (x + 0.5) / S) / DOT), 16);
            if (density > FIELD[cy * 16 + cx]) out.set([...ink, 1], i * 4);
          }
        }
      }
    },
    /** Earth going back into the picture: dots as thick as `near` at y = `yNear`, thinning to
     *  `far` at y = `yFar` (points), the ink paling the same way, a little uneven across. */
    async fade(d, [near, far], [yNear, yFar], [inkNear, inkFar], seed) {
      const a = await cover(fillOf(d));
      const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6];
      for (let y = 0; y < h; y++) {
        const py = y0 + (y + 0.5) / S;
        const cy = mod(Math.floor(py / DOT), 16);
        const t = Math.min(1, Math.max(0, (py - yNear) / (yFar - yNear)));
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (a[i] < 0.5) continue;
          const px = x0 + (x + 0.5) / S;
          const wobble = 0.12 * Math.sin(px * 0.31 + ph[0]) + 0.08 * Math.sin(px * 0.77 + ph[1]) + 0.06 * Math.sin(px * 1.9 + py * 0.6 + ph[2]);
          const density = Math.min(1, Math.max(0, near + (far - near) * t + wobble * t));
          const cx = mod(Math.floor(px / DOT), 16);
          if (density > FIELD[cy * 16 + cx]) out.set([...along([inkNear, inkFar], t), 1], i * 4);
        }
      }
    },
    /** Pen.stroke: the heavy round line, gone over once more a hair off so it reads as pressed. */
    async pen(d, width) {
      lay(await cover(strokeOf(d, width)), INK.pen);
      lay(await cover(strokeOf(d, width * 0.7, 'translate(0.4 0.35)')), INK.pen, 0.35);
    },
    /** The printed part, cropped to its ink, and where its base is in the crop. */
    async done() {
      let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
      for (let i = 0; i < w * h; i++) if (out[i * 4 + 3] > 0.02) { const x = i % w, y = Math.floor(i / w); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
      const tw = bx1 - bx0 + 1, th = by1 - by0 + 1, buf = Buffer.alloc(tw * th * 4);
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const o = ((by0 + y) * w + bx0 + x) * 4;
        buf.set([out[o], out[o + 1], out[o + 2], out[o + 3] * 255].map(Math.round), (y * tw + x) * 4);
      }
      return { width: tw, height: th, origin: [-x0 * S - bx0, -y0 * S - by0], input: await sharp(buf, { raw: { width: tw, height: th, channels: 4 } }).png().toBuffer() };
    },
  };
}

/** Where the page's off-register lands in a part's own frame, the part turned by `angle`. */
const plate = (angle) => {
  const t = (angle * Math.PI) / 180;
  return [REGISTER[0] * Math.cos(t) + REGISTER[1] * Math.sin(t), -REGISTER[0] * Math.sin(t) + REGISTER[1] * Math.cos(t)];
};

const printers = {
  /** drawPetal. */
  async petal(p) {
    const r = room(petalBox(p.l, p.w));
    await r.fill(r.fillOf(p.shape), INK.paper);
    await r.screen(p.shape, plate(p.angle), p.tone, p.ramp);
    if (p.beard) {
      // The fall's pale throat and its beard: ink dots either side of the haft.
      const top = -1.1 * p.l, width = 1.9 * p.w;   // near enough the shape's bounding box
      await r.fill(r.fillOf(ellipse(-width * 0.13, top * 0.5, width * 0.26, -top * 0.36)), INK.paper);
      const dots = [0.16, 0.22, 0.28, 0.34, 0.4, 0.46].map((at, k) => ellipse((k % 2 ? 0.8 : -0.8) - 1.1, top * at - 1.1, 2.2, 2.2)).join('');
      await r.fill(r.fillOf(dots), INK.pen);
    }
    await r.pen(p.shape, 2.4);
    return r.done();
  },
  /** The dotted heart behind the petals: paper, then magenta into raspberry. No line. */
  async heart(p) {
    const r = room(p.box), disc = ellipse(-10, -9.5, 20, 19);
    await r.fill(r.fillOf(disc), INK.paper);
    await r.screen(disc, plate(0), [0.85, 1], RAMP.heart);
    return r.done();
  },
  /** The throat where the petals meet: a pinch of pink with the print's grain through it. */
  async throat(p) {
    const r = room(p.box), spot = ellipse(-3.2, -3.6, 6.4, 6);
    await r.fill(r.fillOf(spot), INK.hot);
    const a = await r.cover(r.fillOf(spot)), noise = rng(7);
    for (let i = 0; i < r.w * r.h; i++) if (a[i] > 0.5 && noise() < 0.14) r.out.set(noise() < 0.5 ? INK.magenta : INK.pink, i * 4);
    return r.done();
  },
  /** The stem: Pen.taper, thick at the ground and thin at the head, pink down its middle. */
  async stem(p) {
    const r = room(p.box), n = 14;
    const taper = (from, to) => Array.from({ length: n }, (_, i) => r.strokeOf(`M0,${f((-STEM * i) / n)}L0,${f((-STEM * (i + 1)) / n)}`, f(from + ((to - from) * i) / (n - 1)))).join('');
    await r.fill(taper(5.6, 3.2), INK.pen);
    await r.fill(taper(2.4, 1.0), INK.hot);
    return r.done();
  },
  /** The sword leaf: paper, the pen round it, a vein. */
  async leaf(p) {
    const r = room(p.box), blade = 'M0,0Q1,-33 -13,-58Q-13,-22 -7,0Z';
    await r.fill(r.fillOf(blade), INK.paper);
    await r.pen(blade, 2.2);
    await r.pen('M-3.5,-3Q-4,-28 -11.5,-44', 0.9);
    return r.done();
  },
  /** The ground's top, going back into the picture behind the stem: no shape to it, earth
   *  petering out unevenly, its dots thinning and paling with distance, crumbs beyond.
   *  Printed before everything else; the front lip covers its near side. */
  async groundBack(p) {
    const r = room(p.box), rand = rng(37), f1 = (n) => n.toFixed(2);
    const ph = [rand() * 6, rand() * 6, rand() * 6];
    // The far edge, left to right: no curve to it, just earth petering out unevenly, reaching
    // furthest back a little off the stem.
    const edge = [];
    for (let x = -42; x <= 44; x += 2) {
      const reach = 7 + 4.5 * Math.exp(-((x - 4) ** 2) / 900) + 2.2 * Math.sin(x * 0.23 + ph[0]) + 1.4 * Math.sin(x * 0.61 + ph[1]) + (rand() - 0.5) * 2.6;
      edge.push([x + (rand() - 0.5) * 1.2, -Math.max(2.5, reach * (1 - (Math.abs(x - 1) / 46) ** 3))]);
    }
    let d = 'M-42,1.5L' + edge.map(([x, y]) => `${f1(x)},${f1(y)}`).join('L') + 'L44,1.5Z';
    // Clods and crumbs scattered beyond it, thinning out with distance.
    for (let k = 0; k < 22; k++) {
      const x = -38 + rand() * 80, back = 6 + rand() * 11, s = 0.5 + rand() * (2.4 - back * 0.08);
      d += ellipse(x, -back, s * 1.6, s);
    }
    await r.fade(d, [1, 0.12], [0, -17], [INK.tan, [222, 196, 170]], 41);
    return r.done();
  },
  /** The ground: a patch of earth the plant stands in, tan at its edges, espresso under the
   *  stem. Wider than the rig's puddle and never round: its top edge is broken into clods and
   *  dips, lopsided, a stray clump to one side, as dug earth is. */
  async ground(p) {
    const r = room(p.box), rand = rng(29);
    // The top edge, left to right: a wobble at two scales, lumpier toward the ends.
    const top = [];
    for (let i = 0; i <= 26; i++) {
      const x = -36 + (i / 26) * 74, edge = Math.abs(x) / 37;
      // A low mound, highest just off the stem, with clods along its top.
      const y = -1.4 - (1 - edge * edge) * 3.4 - Math.max(0, Math.sin(i * 2.3 + 0.6)) * 1.2 + (rand() - 0.5) * 1.6 * (0.5 + edge);
      top.push([x, y]);
    }
    // The bottom edge, right to left: flatter, a little ragged.
    const bottom = [];
    for (let i = 26; i >= 0; i--) {
      const x = -36 + (i / 26) * 74;
      bottom.push([x + (rand() - 0.5) * 1.2, 4.6 + (rand() - 0.5) * 1.8 - (Math.abs(x) > 30 ? 1.6 : 0)]);
    }
    const f1 = (n) => n.toFixed(2);
    const outline = 'M' + [...top, ...bottom].map(([x, y]) => `${f1(x)},${f1(y)}`).join('L') + 'Z';
    // A couple of clods thrown off to the sides.
    const clods = ellipse(-38.5, 0.6, 3.6, 2.6) + ellipse(34, -0.4, 5, 3.2) + ellipse(-31, 3, 2.8, 1.8) + ellipse(24, -6.4, 2.6, 2);
    const puddle = outline.replace(/^/, '') + clods;
    // fillScreen shrinks toward 0,0, which is the stem's foot: the middle prints deepest.
    await r.screen(puddle, [0, 0], [0.85, 1], RAMP.soil);
    return r.done();
  },
};

const tiles = [];
for (const p of PARTS) tiles.push({ name: p.name, angle: p.angle, ...(await printers[p.kind](p)) });

// ── The sheet ─────────────────────────────────────────────────────────────────────────
const sheetW = 420;
let sx = 0, sy = 0, shelf = 0;
for (const t of [...tiles].sort((a, b) => b.height - a.height)) {
  if (sx + t.width > sheetW) { sx = 0; sy += shelf + GAP; shelf = 0; }
  t.sx = sx; t.sy = sy;
  sx += t.width + GAP;
  shelf = Math.max(shelf, t.height);
}
const sheetH = sy + shelf;
const file = path.join(outDir, 'flower.webp');
await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(tiles.map((t) => ({ input: t.input, left: t.sx, top: t.sy })))
  .webp({ quality: 82, alphaQuality: 85, effort: 6, smartSubsample: true })
  .toFile(file);

const r1 = (v) => Math.round(v * 10) / 10;
writeFileSync(
  path.join(root, 'src/fableFlower.ts'),
  `// Written by scripts/fable-flower.mjs: Iris's flower printed part by part, a port of the app's
// rig (IrisRig.swift). Sizes are in the sheet's pixels, \`scale\` of them to a point of the rig;
// \`origin\` is the point a part grows from, in its own picture; \`angle\` is the way it points
// when the bloom is open; \`sheet\` is where it is on public/fable/flower.webp.
export const flower = {
  scale: ${S},
  stem: ${STEM},
  sheet: { src: '/fable/flower.webp', width: ${sheetW}, height: ${sheetH} },
  parts: {
${tiles.map((t) => `    '${t.name}': { width: ${t.width}, height: ${t.height}, origin: [${r1(t.origin[0])}, ${r1(t.origin[1])}], angle: ${t.angle}, sheet: [${t.sx}, ${t.sy}] },`).join('\n')}
  },
} as const;
export type FlowerPart = keyof typeof flower.parts;
`,
);
console.log(`${tiles.length} parts on a ${sheetW} × ${sheetH} sheet, ${(statSync(file).size / 1024).toFixed(1)} KB`);

// A proof for the eye: the parts put together as the rig poses them open, beside the app's
// own render of the flower.
if (process.argv.includes('--proof')) {
  const sheet = await sharp(file).png().toBuffer();
  const W = 360, H = 420, base = [W / 2, H - 40];
  const layers = [];
  for (const t of tiles) {
    const at = /ground|leaf|stem/.test(t.name) ? [t.name === 'leaf' ? -3 : 0, 0] : [0, -STEM];
    const tile = await sharp(sheet).extract({ left: t.sx, top: t.sy, width: t.width, height: t.height }).toBuffer();
    // Turn the part about its origin: pad it so the origin is the middle, then rotate.
    const R = Math.ceil(Math.hypot(Math.max(t.origin[0], t.width - t.origin[0]), Math.max(t.origin[1], t.height - t.origin[1])));
    const padded = await sharp({ create: { width: 2 * R, height: 2 * R, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: tile, left: Math.round(R - t.origin[0]), top: Math.round(R - t.origin[1]) }]).png().toBuffer();
    const turned = await sharp(padded).rotate(t.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const m = await sharp(turned).metadata();
    layers.push({ name: t.name, input: turned, left: Math.round(base[0] + at[0] * S - m.width / 2), top: Math.round(base[1] + at[1] * S - m.height / 2) });
  }
  const order = [...layers.filter((l) => l.name !== 'ground'), ...layers.filter((l) => l.name === 'ground')];
  await sharp({ create: { width: W + 380, height: Math.max(H, 483), channels: 4, background: { r: 120, g: 162, b: 220, alpha: 1 } } })
    .composite([...order.map(({ input, left, top }) => ({ input, left, top })), { input: path.join(root, 'public/img/hero-flower-335.webp'), left: W + 20, top: 20 }])
    .png().toFile('/tmp/iris-fable/flower-proof.png');
}
