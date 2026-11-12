// The pen and the brush, drawn at build time.
//
// Every line on the page wobbles a little, seeded so the same mark always looks the same
// (Iris seeds its pen lines the same way). Areas of ink are never flat: a shape here is a
// mask, and what shows through it is ink printed through the riso screen (`printed` below).
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { ink, tex } from './tokens.stylex';

export function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from a word, so a mark under a label keeps its shape. */
export const seedOf = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const f = (n: number) => Math.round(n * 10) / 10;

/** Points along a line that drifts a little, like a hand following a ruler. */
function drift(r: () => number, from: number, to: number, at: number, amp: number, step: number) {
  const pts: [number, number][] = [];
  let y = at;
  const n = Math.max(2, Math.round(Math.abs(to - from) / step));
  for (let i = 0; i <= n; i++) {
    y = at + (y - at) * 0.55 + (r() - 0.5) * amp;
    pts.push([from + ((to - from) * i) / n, y]);
  }
  return pts;
}
const line = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join('');
const smooth = (pts: [number, number][]) => {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += `Q${f(x0)},${f(y0)} ${f((x0 + x1) / 2)},${f((y0 + y1) / 2)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return d + `L${f(lx)},${f(ly)}`;
};

export const svgUrl = (viewBox: string, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}' preserveAspectRatio='none'>${body}</svg>`,
  )}")`;

const maskStyle = (url: string): CSSProperties => ({ maskImage: url, WebkitMaskImage: url });

// ── Printed ink ───────────────────────────────────────────────────────────────────────
export const printed = stylex.create({
  base: {
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  },
  ink: { backgroundColor: ink.i12 },
  espresso: { backgroundColor: ink.espresso },
  pink: { backgroundColor: ink.pink },
  platePink: { backgroundColor: ink.platePink },
  rose: { backgroundColor: ink.rose },
  red: { backgroundColor: ink.red },
  sky: { backgroundColor: ink.sky },
  tan: { backgroundColor: ink.tan },
  crema: { backgroundColor: ink.crema },
  tape: { backgroundColor: ink.tape },
  green: { backgroundColor: ink.green },
});
export type InkName = Exclude<keyof typeof printed, 'base'>;

const s = stylex.create({
  layer: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  svgLine: { display: 'block', width: '100%', overflow: 'visible' },
});

/** A shape printed in one ink: the mask is the shape, the screen shows through it. */
export function Printed({ mask, color, style, xstyle }: { mask: string; color: InkName; style?: CSSProperties; xstyle?: stylex.StyleXStyles }) {
  return <span aria-hidden {...stylex.props(s.layer, printed.base, printed[color], xstyle)} style={{ ...maskStyle(mask), ...style }} />;
}

// ── Pen lines ─────────────────────────────────────────────────────────────────────────
/** A pen rule across its box. `strong` is the heading rule; the default is a row rule. */
export function PenRule({ seed, strong = false, color }: { seed: number; strong?: boolean; color?: string }) {
  const r = rng(seed);
  const d = smooth(drift(r, 0, 1000, 3, 2.2, 60));
  return (
    <svg aria-hidden viewBox="0 0 1000 6" preserveAspectRatio="none" height={6} {...stylex.props(s.svgLine)}>
      <path
        d={d}
        fill="none"
        stroke={color ?? (strong ? 'rgb(42 26 22 / 0.85)' : 'rgb(42 26 22 / 0.3)')}
        strokeWidth={strong ? 1.3 : 1}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A row rule as a background image, for places a separate element can't go (a <dl>). */
export function penLine(seed: number) {
  const r = rng(seed);
  const d = smooth(drift(r, 0, 1000, 3, 2.2, 60));
  return svgUrl('0 0 1000 6', `<path d='${d}' fill='none' stroke='rgb(42 26 22 / 0.3)' stroke-width='1' vector-effect='non-scaling-stroke'/>`);
}

/** A box drawn by hand round its parent: four strokes that overshoot the corners a little. */
export function HandRect({ seed, color = 'rgb(42 26 22)', width = 1.6, inset = 0 }: { seed: number; color?: string; width?: number; inset?: number }) {
  const r = rng(seed);
  const o = () => (r() - 0.5) * 1.6;
  const top = smooth(drift(r, -0.6, 100.6, 1 + o() * 0.3, 0.9, 12));
  const right = `M${f(99 + o() * 0.3)},${f(-0.8)}Q${f(99.4 + o() * 0.4)},50 ${f(99 + o() * 0.3)},${f(100.8)}`;
  const bottom = smooth(drift(r, 100.6, -0.6, 99 + o() * 0.3, 0.9, 12));
  const left = `M${f(1 + o() * 0.3)},${f(100.8)}Q${f(0.6 + o() * 0.4)},50 ${f(1 + o() * 0.3)},${f(-0.8)}`;
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset, width: `calc(100% - ${2 * inset}px)`, height: `calc(100% - ${2 * inset}px)`, overflow: 'visible', pointerEvents: 'none' }}>
      {[top, right, bottom, left].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// ── Brush marks (masks) ───────────────────────────────────────────────────────────────
/** A quick dry-brush swipe of marker under a word: blunt where it lands, frayed where it lifts. */
export function markerMask(seed: number) {
  const r = rng(seed);
  const top = drift(r, 4, 186, 9 + r() * 3, 3, 20);
  const bottom = drift(r, 186, 3, 33 - r() * 3, 3, 20);
  let d = line(top);
  // Bristle tips where the brush lifts off.
  const tips = 5;
  for (let i = 0; i <= tips; i++) {
    const y = top[top.length - 1][1] + ((bottom[0][1] - top[top.length - 1][1]) * i) / tips;
    d += `L${f(i % 2 ? 199 - r() * 3 : 189 + r() * 4)},${f(y)}`;
  }
  d += line(bottom).replace('M', 'L') + `Q${f(r() * 2)},21 4,${f(top[0][1])}Z`;
  // Dry streaks: slivers where the brush skipped, near the edges, never across the middle.
  let holes = '';
  for (let k = 0; k < 4; k++) {
    const x = 20 + r() * 140;
    const y = k % 2 ? 11 + r() * 3 : 29 + r() * 3;
    const len = 18 + r() * 40;
    holes += `M${f(x)},${f(y)}L${f(x + len)},${f(y + (r() - 0.5))}L${f(x + len - 4)},${f(y + 0.9)}L${f(x + 2)},${f(y + 0.8)}Z`;
  }
  return svgUrl('0 0 200 42', `<path fill-rule='evenodd' d='${d}${holes}'/>`);
}

/** A tapering pen stroke with body, for a link's underline. */
export function ribbonMask(seed: number) {
  const r = rng(seed);
  const mid = drift(r, 0, 200, 5, 2.4, 25);
  const upper = mid.map(([x, y], i) => [x, y - 0.6 - 1.8 * Math.sin((Math.PI * i) / (mid.length - 1))] as [number, number]);
  const lower = mid.map(([x, y], i) => [x, y + 0.6 + 1.4 * Math.sin((Math.PI * i) / (mid.length - 1))] as [number, number]).reverse();
  return svgUrl('0 0 200 10', `<path d='${smooth(upper)}${line(lower).replace('M', 'L')}Z'/>`);
}

/** A loop of dry brush round something chosen. */
export function ringMask(seed: number) {
  const r = rng(seed);
  const pts: string[] = [];
  const inner: string[] = [];
  const turns = 1.12;
  const n = 64;
  const tilt = (r() - 0.5) * 0.2;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * turns + 0.6;
    const grow = 1 + (i / n) * 0.05;
    const w = 2.2 + 2.6 * Math.sin((Math.PI * i) / n);
    const rx = 92 * grow + (r() - 0.5) * 1.5;
    const ry = 42 * grow + (r() - 0.5) * 1.2;
    const x = 100 + rx * Math.cos(t) + tilt * ry * Math.sin(t);
    const y = 50 + ry * Math.sin(t);
    const nx = Math.cos(t), ny = Math.sin(t);
    pts.push(`${f(x + nx * w)},${f(y + ny * w * 0.6)}`);
    inner.unshift(`${f(x - nx * w)},${f(y - ny * w * 0.6)}`);
  }
  return svgUrl('0 0 200 100', `<path d='M${pts.join('L')}L${inner.join('L')}Z'/>`);
}

/** Two flat, fat dry-brush strokes with frayed square ends: the zine's crossed-out cup. */
export function crossMask(seed: number) {
  const r = rng(seed);
  const stroke = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    const nx = -uy, ny = ux;
    const side = (sign: number) =>
      drift(r, 0, len, 0, 3, 10).map(([t, d]) => {
        const half = (w / 2) * (0.82 + 0.25 * Math.sin((Math.PI * t) / len)) + d * 0.4;
        return [x0 + ux * t + nx * half * sign, y0 + uy * t + ny * half * sign] as [number, number];
      });
    const a = side(1), b = side(-1).reverse();
    // Frayed ends: a few bristles sticking out of the square end.
    const fray = (p: [number, number], q: [number, number], dir: number) => {
      let d = '';
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const out = (r() * 6 + 1) * dir;
        d += `L${f(p[0] + (q[0] - p[0]) * t + ux * out)},${f(p[1] + (q[1] - p[1]) * t + uy * out)}`;
      }
      return d;
    };
    let holes = '';
    for (let k = 0; k < 3; k++) {
      const t = 0.15 + r() * 0.6, off = (r() - 0.5) * w * 0.7, l = 10 + r() * 20;
      const cx = x0 + ux * len * t + nx * off, cy = y0 + uy * len * t + ny * off;
      holes += `M${f(cx)},${f(cy)}L${f(cx + ux * l)},${f(cy + uy * l)}L${f(cx + ux * l + nx * 1.2)},${f(cy + uy * l + ny * 1.2)}Z`;
    }
    return `${line(a)}${fray(a[a.length - 1], b[0], 1)}${line(b).replace('M', 'L')}${fray(b[b.length - 1], a[0], -1)}Z${holes}`;
  };
  return svgUrl('0 0 100 100', `<path fill-rule='evenodd' d='${stroke(10, 12, 90, 88, 15)}'/><path fill-rule='evenodd' d='${stroke(88, 10, 14, 90, 13)}'/>`);
}

// The primary button's one brush. Fixed, never seeded by the label: ends measured from each
// end, only the middle stretches with the words (DESIGN.md, "The next step").
const slab = (() => {
  const r = rng(1009);
  const lt = 5 + r(), lb = 36 - r();
  const left = svgUrl('0 0 18 42', `<path d='M18,${f(lt)}C9,${f(lt - 0.6)} 2.6,6 1.6,13C0.8,19 0.9,27 2,31C3.4,36 9,${f(lb + 0.6)} 18,${f(lb)}Z'/>`);
  const top = drift(r, 0, 300, 5, 1.6, 30);
  const bottom = drift(r, 300, 0, 36.5, 1.6, 30);
  let holes = '';
  for (let k = 0; k < 7; k++) {
    const x = r() * 280, y = k % 2 ? 7.6 + r() * 1.5 : 32 + r() * 2, l = 14 + r() * 36;
    holes += `M${f(x)},${f(y)}L${f(x + l)},${f(y + (r() - 0.5) * 0.6)}L${f(x + l - 3)},${f(y + 0.9)}L${f(x + 1)},${f(y + 0.8)}Z`;
  }
  const middle = svgUrl('0 0 300 42', `<path fill-rule='evenodd' d='${line(top)}L300,${f(top[top.length - 1][1])}${line(bottom).replace('M', 'L')}Z${holes}'/>`);
  let tips = `M0,${f(top[top.length - 1][1])}`;
  const rows = 9;
  for (let i = 0; i <= rows; i++) {
    const y = 4.5 + (32 * i) / rows;
    tips += `L${f(i % 2 ? 12 + r() * 6 : 22 + r() * 12)},${f(y + (r() - 0.5) * 1.5)}`;
  }
  tips += `L0,${f(bottom[0][1])}Z`;
  // Loose bristles flicked past the tip.
  for (let k = 0; k < 3; k++) {
    const y = 9 + r() * 24, x = 26 + r() * 4;
    tips += `M${f(x)},${f(y)}L${f(x + 4 + r() * 3)},${f(y + 0.4)}L${f(x + 3.5)},${f(y + 1.3)}Z`;
  }
  const right = svgUrl('0 0 36 42', `<path fill-rule='evenodd' d='${tips}'/>`);
  return { left, middle, right };
})();
export const slabMasks = slab;

// ── Pen marks (strokes) ───────────────────────────────────────────────────────────────
/** The printed pen arrow: a straight shaft pressed in and lifted off, two barbs from the tip. */
export function PenArrow({ dir = 'right', size = 22, up = false, color = 'rgb(42 26 22)' }: { dir?: 'right' | 'left'; size?: number; up?: boolean; color?: string }) {
  const flip = dir === 'left' ? 'scale(-1,1) translate(-22,0)' : '';
  return (
    <svg aria-hidden width={size} height={(size * 12) / 22} viewBox="0 0 22 12" style={{ overflow: 'visible', flex: 'none', transform: up ? 'rotate(-35deg) scale(0.8)' : undefined }}>
      <g transform={flip}>
        <path d="M1.2,6.3 L19.6,5.8" stroke="rgb(240 134 176)" strokeWidth={2.6} strokeLinecap="round" transform="translate(-0.8,0.9)" opacity={0.85} />
        <path d="M1.2,6.3 C7,6.1 13,5.9 19.6,5.8" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <path d="M14.2,1.4 L20.2,5.8 L14.6,10.6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

/** A pen tick, drawn with a little overshoot. */
export function HandTick({ size = 16, color = 'rgb(142 36 83)' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" style={{ overflow: 'visible', flex: 'none' }}>
      <path d="M1.6,8.6 C3.4,10 4.6,11.6 5.8,14 C8,8.6 11.2,4.2 15.4,1.2" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The marking-up arrow: a hand curl pointing at a thing on the page. */
export function HandArrow({ width = 70, height = 48, flip = false, seed = 3 }: { width?: number; height?: number; flip?: boolean; seed?: number }) {
  const r = rng(seed);
  const bend = 0.6 + r() * 0.3;
  return (
    <svg aria-hidden width={width} height={height} viewBox="0 0 70 48" style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d={`M4,6 C${f(26 * bend)},2 ${f(58)},${f(10 + r() * 4)} 60,40`} fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" />
      <path d="M51.5,33 L60.4,41.4 L65.6,30.4" fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
