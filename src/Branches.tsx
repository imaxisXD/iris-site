// Branches painted on the Questions sheet, drawn at build time with a seeded brush: a stem in
// deep green, broken where the brush ran dry, and along it leaves and blossoms laid on as short
// dabs, each a few strokes side by side. Four of Iris's inks, overprinted (multiply), so pink
// over green goes dark as it does on a riso. The edges are roughened (a displacement) and the
// ink is speckled where the paper shows through, as a dry brush leaves it.
//
// They are decoration: screen readers skip them and they never take a tap. Each sways on its
// own from where it grows (global.css, "Questions"), only while the sheet is on screen
// (client.ts) and never under Reduce Motion. The drawing itself never changes as it moves.
import { rng } from './pen';

/** The inks: the stem, the leaves, and the two blossom colours. */
export const BRANCH_INK = {
  stem: 'rgb(22 68 44)',
  leaf: '#1E8C55',
  pink: 'rgb(240 134 176)',
  sky: 'rgb(132 150 222)',
};
type Ink = keyof typeof BRANCH_INK;

export type BranchSpec = {
  seed: number;
  /** The drawing's own box, in units. */
  w: number;
  h: number;
  /** Where it grows from (in units, usually on an edge), and the stems that grow from there:
   *  the way each heads (degrees, 0 is right, 90 is down), how long it is and how it bends. */
  base: [number, number];
  stems: { angle: number; len: number; bend: number }[];
};

const R = (n: number) => Math.round(n);

/** Draws one branch: the paths for each ink, in the order they're printed. */
function paint(spec: BranchSpec) {
  const r = rng(spec.seed);
  const out: Record<Ink | 'twig', string> = { stem: '', twig: '', leaf: '', pink: '', sky: '' };
  /** A short stroke, as the brush lays one down. */
  const dab = (ink: Ink | 'twig', x1: number, y1: number, x2: number, y2: number) => {
    out[ink] += `M${R(x1)} ${R(y1)}l${R(x2 - x1)} ${R(y2 - y1)}`;
  };

  /** A leaf from (x, y) heading `a` (radians): hatched across with dabs, fat in the middle. */
  const leaf = (x: number, y: number, a: number, len: number, wide: number, ink: Ink) => {
    const n = 3 + Math.floor(len / 13);
    const ux = Math.cos(a), uy = Math.sin(a);
    // The dabs lean along the leaf, as a brush pulled from the stem outwards.
    const ha = a + Math.PI / 2 + (r() - 0.5) * 0.4 - 0.6;
    const hx = Math.cos(ha), hy = Math.sin(ha);
    for (let k = 0; k < n; k++) {
      const s = (k + 0.6) / (n + 0.2);
      const half = wide * Math.sin(Math.PI * Math.min(1, s * 1.05)) * (0.8 + r() * 0.35);
      const cx = x + ux * len * s + (r() - 0.5) * 2, cy = y + uy * len * s + (r() - 0.5) * 2;
      dab(ink, cx - hx * half, cy - hy * half, cx + hx * half, cy + hy * half);
    }
  };

  /** A blossom: dabs out from a heart, one colour. */
  const blossom = (x: number, y: number, size: number, ink: Ink) => {
    const n = 4 + Math.floor(r() * 3), turn = r() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a = turn + (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      const l = size * (0.7 + r() * 0.5);
      dab(ink, x + Math.cos(a) * 2, y + Math.sin(a) * 2, x + Math.cos(a) * l, y + Math.sin(a) * l);
    }
  };

  const pickInk = (): Ink => {
    const t = r();
    return t < 0.56 ? 'leaf' : t < 0.78 ? 'sky' : 'pink';
  };

  /** A stem from (x, y): its line, broken in places, and what grows along it. */
  const grow = (x: number, y: number, angle: number, len: number, bend: number, depth: number) => {
    const step = 8;
    const pts: [number, number][] = [[x, y]];
    let a = angle, px = x, py = y;
    for (let d = 0; d < len; d += step) {
      a += bend / (len / step) + (r() - 0.5) * 0.07;
      px += Math.cos(a) * step;
      py += Math.sin(a) * step;
      pts.push([px, py]);
    }
    // The line: segments a little apart, a dry gap now and then.
    const ink = depth === 0 ? 'stem' : 'twig';
    for (let i = 0; i < pts.length - 1; i += 2) {
      if (i > 4 && r() < 0.12) continue;
      const [x1, y1] = pts[i], [x2, y2] = pts[Math.min(i + 3, pts.length - 1)];
      const j = (r() - 0.5) * 1.6;
      dab(ink, x1 + j, y1 - j, x2, y2);
    }
    // Leaves and blossoms in pairs along it, from a fifth of the way up; a twig now and then.
    const gap = depth === 0 ? 30 : 24;
    let side = r() < 0.5 ? 1 : -1;
    for (let d = len * (depth === 0 ? 0.2 : 0.15); d < len - 4; d += gap * (0.8 + r() * 0.45)) {
      const i = Math.min(pts.length - 2, Math.round(d / step));
      const [sx, sy] = pts[i], [nx, ny] = pts[i + 1];
      const dir = Math.atan2(ny - sy, nx - sx);
      const far = d / len;
      const size = (depth === 0 ? 1 : 0.78) * (1.15 - far * 0.45);
      for (const sd of [side, -side]) {
        if (r() < 0.18) continue;
        const la = dir + sd * (0.75 + r() * 0.45);
        const ink = pickInk();
        if (ink !== 'leaf' && r() < 0.3) blossom(sx + Math.cos(la) * 15 * size, sy + Math.sin(la) * 15 * size, 14 * size, ink);
        else leaf(sx, sy, la, (30 + r() * 14) * size, 11 * size, ink);
      }
      side = -side;
      if (depth === 0 && far > 0.25 && far < 0.75 && r() < 0.3) {
        grow(sx, sy, dir + side * (0.55 + r() * 0.3), len * (0.3 + r() * 0.15), side * -0.4, 1);
      }
    }
    // A bud at the tip.
    const [tx, ty] = pts[pts.length - 1];
    blossom(tx, ty, depth === 0 ? 12 : 9, r() < 0.5 ? 'pink' : 'sky');
  };

  for (const s of spec.stems) grow(spec.base[0], spec.base[1], (s.angle * Math.PI) / 180, s.len, s.bend, 0);
  return out;
}

/** One branch, its own SVG filling its parent. */
export function Branch({ spec }: { spec: BranchSpec }) {
  const p = paint(spec);
  const id = `branch-${spec.seed}`;
  const layer = (ink: Ink | 'twig', width: number) =>
    p[ink] && <path d={p[ink]} stroke={BRANCH_INK[ink === 'twig' ? 'stem' : ink]} strokeWidth={width} style={{ mixBlendMode: 'multiply' }} />;
  return (
    <svg aria-hidden viewBox={`0 0 ${spec.w} ${spec.h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={spec.seed} result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale={8} result="rough" />
          {/* Specks where the dry brush skipped: fine noise turned into holes. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves={1} seed={spec.seed + 3} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4 0 0 0 3.3" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </defs>
      <g fill="none" strokeLinecap="round" filter={`url(#${id})`}>
        {layer('stem', 10)}
        {layer('twig', 6)}
        {layer('leaf', 7.5)}
        {layer('sky', 7.5)}
        {layer('pink', 7.5)}
      </g>
    </svg>
  );
}
