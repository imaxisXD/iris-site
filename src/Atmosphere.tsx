// The air round the page's two skies (the cover and the foot), taken from About's meadow in the
// app (MakersJourney.swift, "Where Iris comes from"): the same pieces at the same values, drawn
// at build time.
//
//   clouds     towering cumulus as anime background art paints them, printed in riso
//              (scripts/clouds.mjs): one hanging from each top corner, the sun tucked under
//              the right one, and a bank rising behind the garden; a little soft, drifting
//   beams      warm light falling from the sun in four long wedges, breathing slowly
//   dust       soft specks drifting up through the light, each its own size and pace,
//              twinkling as they turn
//   petals     a few pink petals carried across on the breeze, turning as they go
//   lens       right in front of the lens: big leaves rising into the corners from below the
//              frame, deep inks, out of focus, with grain over the blur
//   butterfly  one close to the lens: big, out of focus, drifting past slowly
//
// Riso, as About is: flat inks through the screen, no gradients. All of it is decoration, so
// screen readers skip it and it never takes a tap. How it moves is the caller's (global.css,
// "The air"): on the cover it runs on its own with a pause button, as About's does, looping
// with the garden; on the foot it only follows the scroll. Under Reduce Motion it is still.
import { rng } from './pen';

export const AIR = {
  /** About's beam colour, a warm cream, and its dust, a little paler. */
  beam: 'rgb(255 242 204)',
  dust: 'rgb(255 247 224)',
  /** The four beams from About's sun: the way each falls (radians, 0 is right, y down), how wide,
   *  how strong. */
  // Each beam lives on its own on the cover, as light through moving air does: it brightens and
  // dims on an uneven breath (`breathe`, s) and sways a little about the sun (`sway`, degrees,
  // one way and back over `swayFor`, s). Their periods share no beat, so the four never fall
  // into step.
  beams: [
    { angle: 2.28, spread: 0.07, alpha: 0.22, breathe: 13, sway: 1.1, swayFor: 29 },
    { angle: 2.47, spread: 0.045, alpha: 0.17, breathe: 17, sway: 0.7, swayFor: 23 },
    { angle: 2.64, spread: 0.08, alpha: 0.2, breathe: 11, sway: 0.9, swayFor: 37 },
    { angle: 2.84, spread: 0.04, alpha: 0.14, breathe: 19, sway: 0.6, swayFor: 31 },
  ],
  /** About's foreground: big leaves rising into the corners from below the frame (`Foreground`),
   *  in a corner's own box (200 × 260, the frame's bottom at 260): root, length, width, lean
   *  (radians from upright), ink. Darker and bigger than anything else, so they read as near. */
  lens: {
    left: [
      { root: [38, 300], length: 196, width: 38, lean: 0.22, ink: 'rgb(22 70 46)' },
      { root: [74, 306], length: 158, width: 34, lean: 0.52, ink: 'rgb(236 110 176)' },
      { root: [10, 294], length: 150, width: 32, lean: -0.08, ink: 'rgb(40 112 70)' },
      { root: [116, 312], length: 118, width: 28, lean: 0.8, ink: 'rgb(170 102 124)' },
    ],
    right: [
      { root: [180, 304], length: 176, width: 36, lean: -0.3, ink: 'rgb(22 70 46)' },
      { root: [212, 294], length: 132, width: 30, lean: -0.08, ink: 'rgb(240 134 176)' },
      { root: [144, 312], length: 112, width: 26, lean: -0.62, ink: 'rgb(40 112 70)' },
    ],
    blur: 6,       // About's Foreground.blur, in the corner's units
    grain: 0.45,   // and its .grain
  },
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** The cover's clouds (scripts/clouds.mjs, the same boxes): where each sits on a 1440 × 760
 *  cover, in px, `[x, y, width, height]` (each print is one dot every 2px there), its size in
 *  dots, and how it drifts: `[x, y]` px each way and how long one way takes.
 *  - left: hangs into the sky from the top-left corner, over the wordmark, clear of the headline
 *  - bank: rises along the bottom behind the garden, its towers clear of the words
 *  - sun: hangs from the top-right corner with the sun tucked under it, its upper half behind
 *    the cloud. Its box is from the sun (at 1245, 211 on that cover), and it's printed 360px
 *    taller above, out of sight there, for narrower covers where the sun sits lower.
 *  Closed edges run 90px past the frame, so they drift without ever showing a cut. */
export const COVER_CLOUDS = {
  left: { box: [-90, -90, 650, 330], dots: [325, 165], drift: [16, 0, 50] },
  bank: { box: [360, 500, 1170, 350], dots: [585, 175], drift: [20, 0, 44] },
  sun: { box: [1000, -426, 530, 760], dots: [265, 380], drift: [9, 5, 32], at: [1245, 211] },
} as const;
export type CoverCloudName = keyof typeof COVER_CLOUDS;

/** One of the cover's clouds, the size of its box (its dots stay square: pixelated). */
export function CoverCloud({ name }: { name: CoverCloudName }) {
  const [w, h] = COVER_CLOUDS[name].dots;
  return <img src={`/sprite/cover-cloud-${name}.png`} alt="" width={w} height={h} decoding="async" style={{ display: 'block', width: '100%', height: 'auto', maxWidth: 'none', imageRendering: 'pixelated' }} />;
}

/** The sun's beams, centred on the box's middle (put the box's middle on the sun), each long
 *  enough to cross the sky. The light breathes as one (`data-beams-soft`), so the blur is drawn once. */
export function Beams({ strength = 0.7, rising = false }: { strength?: number; rising?: boolean }) {
  const L = 1000;
  // `rising`: a sun low in the sky, as it comes up, fans its light up into the sky instead.
  const turn = (a: number) => (rising ? -a : a);
  // A page is far bigger than About's little window: the same light, a little fainter, and its
  // edges softened (a blur on the whole drawing, `data-beams-soft`) as light through air is,
  // rather than cut like paper.
  return (
    <svg aria-hidden data-beams-soft viewBox={`${-L} ${-L} ${L * 2} ${L * 2}`} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible', filter: 'blur(9px)' }}>
      {AIR.beams.map((b, k) => (
        <path
          key={k}
          data-beam
          style={{ ['--k' as string]: k, ['--alpha' as string]: b.alpha * strength, opacity: b.alpha * strength, ['--breathe' as string]: `${b.breathe}s`, ['--sway' as string]: `${b.sway}deg`, ['--sway-for' as string]: `${b.swayFor}s`, ['--lag' as string]: `${-b.breathe * 0.37 * (k + 1)}s` }}
          fill={AIR.beam}
          d={`M0 0L${r1(Math.cos(turn(b.angle - b.spread)) * L)} ${r1(Math.sin(turn(b.angle - b.spread)) * L)}L${r1(Math.cos(turn(b.angle + b.spread)) * L)} ${r1(Math.sin(turn(b.angle + b.spread)) * L)}Z`}
        />
      ))}
    </svg>
  );
}

/** Dust in the light: soft specks across the box, each its own size, rise, pace and sway. */
export function Dust({ seed, count = 34, area = [0, 100, 10, 95] }: { seed: number; count?: number; area?: [number, number, number, number] }) {
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = area[0] + r() * (area[1] - area[0]), y = area[2] + r() * (area[3] - area[2]);
        const size = r1(1.6 + 4.4 * Math.abs(r() * 2 - 1));
        const dur = 14 + 16 * r();
        return (
          <span
            key={i}
            data-dust
            style={{
              left: `${r1(x)}%`,
              top: `${r1(y)}%`,
              width: size,
              height: size,
              backgroundColor: AIR.dust,
              ['--rise' as string]: `${Math.round(60 + 120 * r())}px`,
              ['--sway' as string]: `${Math.round((r() - 0.5) * 28)}px`,
              ['--dur' as string]: `${r1(dur)}s`,
              ['--delay' as string]: `${r1(-dur * r())}s`,
            }}
          />
        );
      })}
    </>
  );
}

/** Petals carried across the box on the breeze: About's five, from the garden's petal sprites. */
export function Petals({ seed, count = 5, band = [12, 70] }: { seed: number; count?: number; band?: [number, number] }) {
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const dur = 42 + 20 * r();
        return (
          <span
            key={i}
            data-petal
            style={{
              top: `${r1(band[0] + ((i * 23) % 60) / 60 * (band[1] - band[0]))}%`,
              // Where it rests when nothing moves: spread across, never in a row.
              ['--x' as string]: `${r1(((i + 0.5 + (r() - 0.5) * 0.6) / count) * 100)}%`,
              width: Math.round(14 + 8 * r()),
              ['--dur' as string]: `${r1(dur)}s`,
              ['--delay' as string]: `${r1(-dur * ((i + r() * 0.5) / count))}s`,
              ['--bob' as string]: `${r1(3 + 2.4 * r())}s`,
              ['--spin' as string]: `${Math.round(200 + 260 * r())}deg`,
              ['--k' as string]: i,
            }}
          >
            <span data-petal-turn>
              <img src={`/sprite/petal-${(i % 3) + 1}.png`} alt="" width={84} height={84} loading="lazy" decoding="async" />
            </span>
          </span>
        );
      })}
    </>
  );
}

/** About's foreground: big soft leaves rising into a corner from below the frame. Fills its box
 *  (200 × 260 units), the frame's bottom along the box's. */
export function Lens({ side, seed }: { side: 'left' | 'right'; seed: number }) {
  const L = AIR.lens, id = `lens-${side}-${seed}`;
  return (
    <svg aria-hidden viewBox="0 0 200 260" preserveAspectRatio={side === 'left' ? 'xMinYMax meet' : 'xMaxYMax meet'} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <filter id={id} x="-40%" y="-30%" width="180%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={L.blur} result="soft" />
          {/* Film grain over the blur (About's .grain): dark specks, only where there's ink. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} result="noise" />
          <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0 0.05  ${-L.grain * 2.4} 0 0 0 ${L.grain * 1.3}`} result="dark" />
          <feComposite in="dark" in2="soft" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {L[side].map((l, i) => {
          const [x, y] = l.root;
          const tx = x + Math.sin(l.lean) * l.length, ty = y - Math.cos(l.lean) * l.length;
          const mx = (x + tx) / 2, my = (y + ty) / 2, nx = Math.cos(l.lean) * l.width, ny = Math.sin(l.lean) * l.width;
          return <path key={i} fill={l.ink} d={`M${x} ${y}Q${r1(mx - nx)} ${r1(my - ny)} ${r1(tx)} ${r1(ty)}Q${r1(mx + nx)} ${r1(my + ny)} ${x} ${y}Z`} />;
        })}
      </g>
    </svg>
  );
}

/** One butterfly close to the lens: big and a little out of focus, in the garden's own colours.
 *  Fills its box; how it drifts is the caller's, always in open sky, never over a cloud. */
/** The small butterflies flitting about the cover's flowers, a little soft in front of the
 *  lens: each a butterfly of the garden's (a tint makes a fifth, a blue), its size, the box it
 *  flits about in (low, by the flower and the leaves in the corners, never by the words), how
 *  long one round of its path takes and where in it it starts, which way round it goes, and how
 *  fast its wings beat. `wide`: only where the cover's margin has room (data-air-full, 1440px). */
export const FLUTTER: { sprite: string; hue?: number; size: string; box: React.CSSProperties; round: number; from: number; back?: boolean; flap: number; wide?: boolean }[] = [
  // By the flower and the leaves in the right corner
  { sprite: 'monarch', size: 'clamp(16px, 1.5vw, 22px)', box: { right: '1%', bottom: '5%', width: 'min(15vw, 220px)', height: '26%' }, round: 22, from: -3, flap: 240 },
  { sprite: 'rose', size: 'clamp(14px, 1.25vw, 19px)', box: { right: '5%', bottom: '14%', width: 'min(11vw, 160px)', height: '20%' }, round: 17, from: -9, back: true, flap: 200 },
  { sprite: 'monarch', hue: 190, size: 'clamp(13px, 1.1vw, 17px)', box: { right: '0%', bottom: '1%', width: 'min(10vw, 150px)', height: '17%' }, round: 26, from: -14, flap: 220 },
  // By the leaves in the left corner
  { sprite: 'white', size: 'clamp(14px, 1.2vw, 18px)', box: { left: '0%', bottom: '4%', width: 'min(7vw, 100px)', height: '22%' }, round: 19, from: -5, flap: 230, wide: true },
  { sprite: 'swallowtail', size: 'clamp(13px, 1.1vw, 17px)', box: { left: '1%', bottom: '12%', width: 'min(5.5vw, 80px)', height: '16%' }, round: 24, from: -11, back: true, flap: 210, wide: true },
];

export function CloseButterfly({ sprite = 'monarch' }: { sprite?: string }) {
  return (
    <span data-close-fly>
      <img data-close-wings src={`/sprite/${sprite}-wings.png`} alt="" width={216} height={216} loading="lazy" decoding="async" />
      <img src={`/sprite/${sprite}-body.png`} alt="" width={216} height={216} loading="lazy" decoding="async" />
    </span>
  );
}
