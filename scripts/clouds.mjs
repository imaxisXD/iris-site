// Prints the cover's clouds: towering cumulus as anime background art paints them (billowing
// walls of cloud framing the sky), in Iris's riso. Three of them, the "corners" scene in the
// mono light: one hanging into the sky from the top-left corner, a bank rising along the bottom
// behind the garden, and one hanging from the top-right corner with the sun tucked under it.
//
//   node scripts/clouds.mjs
//
// Grown fractally: big puffs along the shape, on each one's outer side smaller puffs, and on
// those smaller still, so the outline cauliflowers at every scale. Lit as one surface (the
// puffs make a height field; its slope against the sun, high and to the right, gives the light;
// the billows between it and the sun shade it; the crevices between billows fall into shadow),
// then cut into three inks by an 8×8 ordered-dither screen, a riso print's, so the shading is
// soft in dots, not flat. Each cloud fades out before an edge it's open on and runs off the
// frame on the others; its base dissolves into haze.
//
// Each sprite is one dot a pixel: the page shows them at 2px a dot at 1440 with
// `image-rendering: pixelated` (Page.tsx, Garden.tsx; where on the cover is `COVER_CLOUDS` in
// Atmosphere.tsx, the same boxes as here).
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/sprite');
mkdirSync(outDir, { recursive: true });

// Iris's inks (DesignSystem.swift, Riso): the mono light's ramp, shade to light.
const INK = { sky: [132, 150, 222], mist: [204, 222, 244], paper: [255, 252, 249] };
const RAMP = [INK.sky, INK.mist, INK.paper];

const BAYER8 = (() => {
  const b = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]];
  return b.map((r) => r.map((v) => (v + 0.5) / 64));
})();
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
const D = Math.PI / 180;

/** A puff and, on its outer side (angles a0..a1, degrees; -90 is up), smaller puffs, recursively. */
function billow(out, r, x, y, rad, depth, a0, a1, level = 0) {
  out.push([x, y, rad, level]);
  if (depth === 0 || rad < 2.2) return;
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const a = (a0 + ((k + 0.25 + r() * 0.5) / n) * (a1 - a0)) * D;
    const cr = rad * (0.34 + r() * 0.2), dist = rad * (0.72 + r() * 0.16);
    const spread = (a1 - a0) * 0.35;
    billow(out, r, x + Math.cos(a) * dist, y + Math.sin(a) * dist, cr, depth - 1, a / D - spread, a / D + spread, level + 1);
  }
}

const SHAPES = {
  /** A bank on the horizon: billowing heaps along the bottom, towers rising out of it. */
  bank: (r, W, H, { towers = [[0.5, 0.85, 0.12]], floor = 0.35 } = {}) => {
    const out = [];
    const env = (u) => Math.max(floor * (0.85 + 0.15 * Math.sin(u * 14 + 1)), ...towers.map(([at, h, w]) => h * Math.exp(-((u - at) ** 2) / (2 * w * w))));
    const step = H * 0.12;
    // The billows along its top edge, cauliflowering.
    for (let x = -step; x < W + step; x += step * (0.6 + r() * 0.5)) {
      const top = H - env(x / W) * H;
      billow(out, r, x, top + step * (0.7 + r() * 0.5), step * (0.7 + r() * 0.7), 3, -170, -10);
    }
    // The body below: big, irregular puffs, so the inside reads as a few masses.
    for (let k = 0; k < (W / step) * 4; k++) {
      const x = r() * W, top = H - env(x / W) * H, y = top + step * 1.4 + r() * (H - top);
      out.push([x, y, step * (1 + r() * 1.2), 0]);
    }
    return out;
  },
  /** A mass hanging into the frame from a top corner, billowing down and out. */
  corner: (r, W, H, { side = 'left' } = {}) => {
    const out = [], left = side === 'left';
    // How far down it hangs at each share across from its corner.
    const deep = (u) => H * Math.max(0, 0.95 * Math.pow(Math.max(0, 1 - u), 0.8) + 0.08 * Math.sin(u * 13));
    const step = Math.min(W, H) * 0.13;
    for (let u = 0; u < 1.05; u += (step / W) * (0.55 + r() * 0.4)) {
      const d = deep(u), x = left ? u * W : W - u * W;
      if (d < step) continue;
      // Its edge, billowing down and outward.
      billow(out, r, x, d - step * 0.8, step * (0.7 + r() * 0.6), 3, left ? -10 : 10, left ? 170 : 190);
      for (let k = 0; k < 3; k++) out.push([x + (r() - 0.5) * step, r() * (d - step), step * (1 + r() * 0.9), 0]);
    }
    return out;
  },
};
/** Which edges of its canvas each shape is open on (it fades out before them); the others are
 *  where it runs off the frame. */
const OPEN = {
  bank: () => ({ l: 1, r: 1, t: 1 }),
  corner: (o) => (o?.side === 'right' ? { l: 1, b: 1 } : { r: 1, b: 1 }),
};

/** A box blur of a field, `r` dots each way, run `n` times. */
function blur(src, W, H, r, n = 2) {
  let a = Float32Array.from(src), b = new Float32Array(W * H);
  for (let p = 0; p < n; p++) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * W + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        b[y * W + x] = s / (2 * r + 1);
        s += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / (2 * r + 1);
        s += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x];
      }
    }
  }
  return a;
}

/** Lights the cloud as one surface, as a painter does: the puffs make a height field (their
 *  fronts), smoothed a little so the inside reads as one billowing mass; its slope against the
 *  sun gives the light, and wherever it dips below its surroundings (the crevices between
 *  billows) it falls into shadow. Lower in the cloud, deeper in its own shade. `rows` sets the
 *  span that shade is measured over (for a cloud grown taller above its frame, the frame's). */
function light(W, H, puffs, rows = null, L = [0.45, -0.6, 0.66]) {
  const n = Math.hypot(...L), l = L.map((v) => v / n);
  const z = new Float32Array(W * H).fill(-1e9);
  let minY = H, maxY = 0;
  for (const [, y, r] of puffs) (minY = Math.min(minY, y - r)), (maxY = Math.max(maxY, y + r));
  for (const [cx, cy, r] of puffs) {
    const front = cy * 0.25;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        const dx = (x - cx) / r, dy = (y - cy) / r, d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const v = front + Math.sqrt(1 - d2) * r, k = y * W + x;
        if (v > z[k]) z[k] = v;
      }
  }
  let lo = 1e9;
  for (const v of z) if (v > -1e8) lo = Math.min(lo, v);
  const field = z.map((v) => (v > -1e8 ? v : lo - 6));
  const smooth = blur(field, W, H, 2, 2);
  const around = blur(field, W, H, Math.max(4, Math.round(Math.min(W, H) * 0.045)), 2);
  const t = new Float32Array(W * H).fill(-1);
  const [top, span] = rows ?? [Math.max(0, minY), Math.max(1, Math.min(H, maxY) - Math.max(0, minY))];
  const reach = Math.round(Math.min(W, H) * 0.22);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const k = y * W + x;
      if (z[k] < -1e8) continue;
      const gx = (smooth[k + 1] - smooth[k - 1]) / 2, gy = (smooth[k + W] - smooth[k - W]) / 2;
      const nn = Math.hypot(gx, gy, 1);
      const lum = (-gx * l[0] - gy * l[1] + l[2]) / nn;
      // In the shadow of the billows between it and the sun: march toward the light over the
      // height field; where the surface rises above the ray, the sun is blocked.
      let shade = 0;
      const lxy = Math.hypot(l[0], l[1]), sx = l[0] / lxy, sy = l[1] / lxy, rise = l[2] / lxy * 0.55;
      for (let st = 2; st < reach; st += 2) {
        const X = Math.round(x + sx * st), Y = Math.round(y + sy * st);
        if (X < 0 || Y < 0 || X >= W || Y >= H) break;
        const over = field[Y * W + X] - (field[k] + st * rise);
        if (over > 0) { shade = Math.max(shade, Math.min(1, over / 6)); if (shade >= 1) break; }
      }
      const crevice = Math.min(1, Math.max(0, 0.85 + (field[k] - around[k]) / 14));
      const high = 1 - Math.min(1, Math.max(0, (y - top) / span));
      const lambert = Math.min(1, Math.max(0, (lum + 0.05) / 0.95));
      t[k] = Math.min(1, (0.25 + 0.75 * lambert) * (1 - 0.7 * shade) * crevice * (0.6 + 0.4 * high) * 1.15);
    }
  return t;
}

/** Grows a cloud. `above` (dots): grown that much taller over its top edge, the same cloud
 *  below and more of its body above, for a cloud hanging from the top that must still run off
 *  the frame where the cover moves it down. */
function grow({ W, H, shape, opts, seed, above = 0 }) {
  const puffs = SHAPES[shape](rng(seed), W, H, opts);
  const t = light(W, H, puffs);
  if (!above) return { W, H, t, open: OPEN[shape](opts) };
  // The same puffs, lowered; over them, more body wherever the cloud meets its top edge.
  const r = rng(seed + 1000), step = Math.min(W, H) * 0.13;
  const tall = puffs.map(([x, y, rad, level]) => [x, y + above, rad, level]);
  const xs = [];
  for (let x = 0; x < W; x++) if (t[W + x] >= 0) xs.push(x);
  // Row by row, each starting a little in from its open side with a smaller puff, at its own
  // place, so that side billows (and dissolves, printed) rather than running straight.
  for (let y = -step; y < above + step; y += step * (0.6 + r() * 0.3)) {
    const x0 = Math.min(...xs) + W * (0.12 + r() * 0.14);
    tall.push([x0, y + (r() - 0.5) * step * 0.4, step * (0.7 + r() * 0.4), 1]);
    for (let x = x0 + step * 0.9; x <= Math.max(...xs) + step; x += step * (0.5 + r() * 0.3)) tall.push([x + (r() - 0.5) * step, y + (r() - 0.5) * step * 0.4, step * (1.1 + r() * 0.8), 0]);
  }
  let minY = H;
  for (const [, y, rad] of puffs) minY = Math.min(minY, y - rad);
  const lo = Math.max(0, minY);
  return { W, H: H + above, t: light(W, H + above, tall, [lo + above, Math.max(1, Math.min(H, Math.max(...puffs.map(([, y, rad]) => y + rad))) - lo)]), open: OPEN[shape](opts), above, base: { W, H, t } };
}

/** Prints a cloud in the mono light's inks. `haze`: how much of its height (a share) dissolves
 *  at the base. */
function print({ W, H, t, open = {} }, { haze = 0.25, seed = 1, fadeLeft = null } = {}) {
  const out = Buffer.alloc(W * H * 4);
  const rn = rng(seed);
  // The base's haze: from the cloud's lowest dots up.
  let maxY = 0;
  for (let k = 0; k < W * H; k++) if (t[k] >= 0) maxY = Math.max(maxY, Math.floor(k / W));
  const hz = Math.max(1, haze * H);
  // Off the canvas on a side where it runs off the frame counts as more cloud.
  const inside = (x, y) => {
    if (x < 0) return !open.l && inside(0, y);
    if (x >= W) return !open.r && inside(W - 1, y);
    if (y < 0) return !open.t && inside(x, 0);
    if (y >= H) return !open.b && inside(x, H - 1);
    return t[y * W + x] >= 0;
  };
  // Fade out before an open edge, so it never ends on a straight cut.
  const ramp = (d, n) => Math.min(1, Math.max(0, d / n));
  const fl = fadeLeft ?? W * 0.12, ft = H * 0.12;
  const sides = (x, y) => (open.l ? ramp(x, fl) : 1) * (open.r ? ramp(W - 1 - x, fl) : 1) * (open.t ? ramp(y, ft) : 1) * (open.b ? ramp(H - 1 - y, ft) : 1);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = y * W + x, v = t[k];
      if (v < 0) continue;
      const th = BAYER8[y % 8][x % 8], j = (rn() - 0.5) * 0.12;
      // Dissolve into the haze toward the base, and soften the silhouette by a dot.
      let a = Math.min(1, (maxY - y) / hz + 0.05) * sides(x, y);
      const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
      if (edge) a *= 0.5;
      if (a < th + j) continue;
      const p = v * 2, lo = Math.min(1, Math.floor(p)), f = p - lo;
      out.set([...(RAMP[f > th + j ? lo + 1 : lo] ?? RAMP[2]), 255], k * 4);
    }
  return out;
}

// The scene, on a 1440 × 760 cover (px; two px a dot): each cloud's box, as Atmosphere.tsx's
// COVER_CLOUDS places them. Closed edges run 90px past the frame, so they drift without a cut.
// The sun's cloud is the top-right one; its box is from the sun (at 1245, 211 on that cover),
// its bottom edge just above the sun's middle where the sun is, so the sun hangs under it,
// peeking out. It's grown 180 dots taller above its top, out of sight on a wide cover, for
// narrower ones, where the sun sits lower and the cloud comes down with it.
const CLOUDS = [
  { name: 'cover-cloud-left', shape: 'corner', opts: { side: 'left' }, box: [-90, -90, 650, 330], seed: 80, haze: 0.3 },
  { name: 'cover-cloud-bank', shape: 'bank', opts: { towers: [[0.3, 0.6, 0.1], [0.72, 0.75, 0.09]], floor: 0.35 }, box: [360, 500, 1170, 350], seed: 93, haze: 0.3 },
  { name: 'cover-cloud-sun', shape: 'corner', opts: { side: 'right' }, box: [1000, -66, 530, 400], seed: 106, haze: 0.18, above: 180 },
];
const PRINT_SEED = 15;
for (const c of CLOUDS) {
  const cloud = grow({ W: c.box[2] / 2, H: c.box[3] / 2, shape: c.shape, opts: c.opts, seed: c.seed, above: c.above });
  let buf;
  if (!c.above) buf = print(cloud, { haze: c.haze, seed: PRINT_SEED });
  else {
    // The cloud as grown at its own height, dot for dot, under the rows grown above it. Across
    // its first rows (the edge of its own canvas: the light leaves the top one out and prints the
    // next as an outline) the two prints are blended through the screen, so there's no seam. Its
    // first 33 rows are above the frame on a 1440 cover; the blend stays inside them.
    const base = print({ ...cloud.base, open: cloud.open }, { haze: c.haze, seed: PRINT_SEED });
    const tall = print(cloud, { haze: c.haze, seed: PRINT_SEED, fadeLeft: cloud.W * 0.3 }); // its open side dissolving further in
    const W = cloud.W, BLEND = 24;
    buf = Buffer.concat([tall.subarray(0, W * c.above * 4), base]);
    for (let y = 0; y < BLEND; y++)
      for (let x = 0; x < W; x++)
        if (y < 2 || (y + 0.5) / BLEND < BAYER8[y % 8][x % 8]) {
          const k = ((c.above + y) * W + x) * 4;
          tall.copy(buf, k, k, k + 4);
        }
  }
  await sharp(buf, { raw: { width: cloud.W, height: cloud.H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `${c.name}.png`));
  console.log(`${c.name}.png  ${cloud.W} × ${cloud.H} dots`);
}
