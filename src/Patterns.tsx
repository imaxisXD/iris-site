// Patterns printed on the page's plates, drawn at build time with a seeded pen: loose petal
// loops, rings spreading out, wavy stripes, a tone-on-tone ✻. Each is one ink, a paler tint of
// the plate it lies on, its edges roughened like a dry brush (an SVG displacement), with the
// riso screen printed over it so it reads as ink, not vector. Decoration: screen readers skip
// it, and it never moves.
import * as stylex from '@stylexjs/stylex';
import { rng } from './pen';
import { tex } from './tokens.stylex';

export type PatternKind = 'loops' | 'ripples' | 'waves' | 'stars';

/* The canvas every pattern is drawn on; the page stretches it to cover its box (slice). */
const W = 1600, H = 1000;

/* How each kind is drawn: its brush width, and how rough the brush's edge is. */
const BRUSH: Record<PatternKind, { width: number; rough: number; grain: number }> = {
  loops:   { width: 26, rough: 9, grain: 0.035 },
  ripples: { width: 22, rough: 8, grain: 0.03 },
  waves:   { width: 30, rough: 10, grain: 0.04 },
  stars:   { width: 16, rough: 5, grain: 0.05 },
};

const f2 = (n: number) => n.toFixed(1);

/** Loose flower doodles: rose curves (petal loops), each a little lopsided, scattered big. */
function loops(seed: number, count = 7) {
  const r = rng(seed);
  let d = '';
  for (let k = 0; k < count; k++) {
    const cx = r() * W, cy = r() * H, R = 150 + r() * 170, petals = [2.5, 3, 2.5, 3.5][Math.floor(r() * 4)], turn = r() * Math.PI * 2;
    const n = 220, wob = [r() * 6, r() * 6];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * (petals % 1 ? 4 : 2);
      const rad = R * (0.25 + 0.75 * Math.abs(Math.cos(petals * t * 0.5))) * (1 + 0.06 * Math.sin(t * 3 + wob[0]) + 0.04 * Math.sin(t * 7 + wob[1]));
      d += `${i ? 'L' : 'M'}${f2(cx + Math.cos(t + turn) * rad)},${f2(cy + Math.sin(t + turn) * rad)}`;
    }
  }
  return d;
}

/** Rings spreading out from a point (a share of the canvas), each one drawn by hand. */
function ripples(seed: number, at: [number, number] = [0.5, 0.5], count = 14) {
  const r = rng(seed);
  const cx = at[0] * W, cy = at[1] * H;
  let d = '';
  for (let k = 0; k < count; k++) {
    const base = 70 + k * 78, n = 90, start = r() * Math.PI * 2, ph = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i <= n + 4; i++) {
      const t = start + (i / n) * Math.PI * 2;
      const rad = base + 12 * (Math.sin(t * 3 + ph[0]) * 0.6 + Math.sin(t * 5 + ph[1]) * 0.3 + Math.sin(t * 2 + ph[2]) * 0.5) + (i > n ? 8 : 0);
      d += `${i ? 'L' : 'M'}${f2(cx + Math.cos(t) * rad)},${f2(cy + Math.sin(t) * rad)}`;
    }
  }
  return d;
}

/** Wavy stripes across, each with its own swell, like lines drawn freehand with a fat brush. */
function waves(seed: number, rows = 11) {
  const r = rng(seed);
  let d = '';
  for (let k = 0; k < rows; k++) {
    const y0 = (k + 0.5) * (H / rows), amp = 16 + r() * 18, len = 170 + r() * 80, ph = r() * 6;
    for (let x = -40, i = 0; x <= W + 40; x += 12, i++) {
      const y = y0 + Math.sin(x / len * Math.PI * 2 + ph) * amp + Math.sin(x / 61 + ph * 2) * 4;
      d += `${i ? 'L' : 'M'}${f2(x)},${f2(y)}`;
    }
  }
  return d;
}

/** A tone-on-tone grid of ✻, each one drawn by hand, turned a little its own way. */
function stars(seed: number, cols = 9) {
  const r = rng(seed);
  const step = W / cols, rowsN = Math.ceil(H / step) + 1;
  let d = '';
  for (let j = 0; j < rowsN; j++)
    for (let i = 0; i < cols + 1; i++) {
      const cx = (i + (j % 2) * 0.5) * step, cy = j * step * 0.9, R = step * 0.2 * (0.85 + r() * 0.3), turn = r() * Math.PI;
      for (let k = 0; k < 4; k++) {
        const a = turn + (k * Math.PI) / 4;
        const jx = (r() - 0.5) * 4, jy = (r() - 0.5) * 4;
        d += `M${f2(cx - Math.cos(a) * R + jx)},${f2(cy - Math.sin(a) * R + jy)}L${f2(cx + Math.cos(a) * R - jy)},${f2(cy + Math.sin(a) * R + jx)}`;
      }
    }
  return d;
}

const s = stylex.create({
  // Under everything in its parent (which isolates), over the parent's own plate.
  layer: { position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  // The riso screen over the pattern, so its ink is printed like the plate's.
  screen: { position: 'absolute', inset: 0, backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px' },
});

/** A pattern covering its parent (which must be positioned). `color` is its ink; `at` is
 *  where ripples spread from, as a share of the box. */
export function Pattern({ kind, color, seed = 7, at, scale = 1, count, weight = 1 }: { kind: PatternKind; color: string; seed?: number; at?: [number, number]; scale?: number; count?: number; weight?: number }) {
  // `count`: how many loops, rings, stripes or columns of stars; `weight`: the brush, times its usual width.
  const d = kind === 'loops' ? loops(seed, count) : kind === 'ripples' ? ripples(seed, at, count) : kind === 'waves' ? waves(seed, count) : stars(seed, count);
  const b = { ...BRUSH[kind], width: BRUSH[kind].width * weight };
  const id = `rough-${kind}-${seed}`;
  // Slice keeps the drawing's proportions; `scale` zooms it, so a small box gets bigger marks.
  const vw = W / scale, vh = H / scale;
  const ox = at ? at[0] * W - vw * at[0] : (W - vw) / 2, oy = at ? at[1] * H - vh * at[1] : (H - vh) / 2;
  return (
    <span aria-hidden {...stylex.props(s.layer)}>
      <svg viewBox={`${f2(ox)} ${f2(oy)} ${f2(vw)} ${f2(vh)}`} preserveAspectRatio={at ? `x${at[0] < 0.34 ? 'Min' : at[0] > 0.66 ? 'Max' : 'Mid'}Y${at[1] < 0.34 ? 'Min' : at[1] > 0.66 ? 'Max' : 'Mid'} slice` : 'xMidYMid slice'} {...stylex.props(s.svg)}>
        <defs>
          <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={b.grain} numOctaves={2} seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={b.rough} />
          </filter>
        </defs>
        <path d={d} fill="none" stroke={color} strokeWidth={b.width} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id})`} />
      </svg>
      <span {...stylex.props(s.screen)} />
    </span>
  );
}
