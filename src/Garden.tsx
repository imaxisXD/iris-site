// The cover's garden: Iris's flower on the sky plate, a sun coming up behind it, butterflies
// arriving one by one, petals on the breeze. It tells the same story as the garden in Iris's
// setup (Garden.swift), where the flower opens, the sun rises and butterflies arrive as each
// step finishes, played here as a short opening that then keeps going.
//
// Every part is its own picture: the flower is Iris's (cut from its README render, assets.mjs),
// the sun, butterflies and petals are riso sprites printed the way Iris prints them
// (sprites.mjs). Everything moves in CSS, on transforms and opacity only, so the browser's
// compositor plays it. The script only pauses it while the cover is scrolled away
// (client.ts). Under Reduce Motion nothing travels: the sun is up, the butterflies perch.

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each time is ms after the page paints.
 *
 *     0ms   the flower is already standing on the plate; empty sky
 *   120ms   the flower stretches up from its foot, scale 0.9 → 1.03 → 1
 *           then sways from the root for good (±2.2°, with a slower gust over it)
 *   500ms   the sun climbs into the top left, y +170 → 0, fading in
 *   700ms   its rays unfurl, scale 0.55 → 1, then turn slowly; the short
 *           glints between them turn the other way and twinkle
 *  1400ms   the monarch flutters in from the top right onto a wide loop
 *  2050ms   the swallowtail sails in from the right, up and down beside the bloom
 *  2700ms   the rose comes in from the lower left, circling under the sun
 *  3350ms   the small white darts in from the top, quick loops over the flower
 *           (every loop keeps clear of the sun; the build checks it)
 *  4200ms   petals start drifting down from the top right (staggered 1100ms)
 *           and keep drifting
 * ───────────────────────────────────────────────────────── */
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { Picture } from './parts';

const TIMING = {
  flowerStretches: 120,   // the flower stretches up from its foot
  sunRises:        500,   // the sun climbs into the top left
  raysUnfurl:      700,   // its rays open out, then start turning
  firstButterfly:  1400,  // the monarch flutters in
  butterflyGap:    650,   // each next butterfly, from its own side
  petalsDrift:     4200,  // the first petal comes loose
  petalGap:        1100,  // between petals
};

/* The garden is laid out in the README render's pixels: a 700 × 720 box, the size the cover's
 * garden always had. Everything below is in those units; the page scales the box. */
const BOX = { width: 700, height: 720 };

/* The flower, Iris's own drawing */
const FLOWER = {
  left: 213, top: 256, width: 335,   // where it stands in the box (from assets.json `at`)
  foot: '45% 97%',                   // the root it stretches and sways from
  stretchFrom: 0.9,                  // scale before it stretches up
  stretchOver: 1.03,                 // past full height, then settles
  stretchMs:   1100,
  swayDeg:     2.2,                  // Iris's own sway: ±2.2°, 4.8 s a swing
  swayMs:      2400,                 // one way
  gustDeg:     1.4,                  // a slower lean over it, so it never repeats exactly
  gustMs:      5600,
};

/* The sun, in three prints: face, long rays, short glints */
const SUN = {
  x: 205, y: 110, size: 320,   // centre and size: high and big, the brightest thing in the sky
  riseFrom:    170,            // units below where it ends up
  riseMs:      1500,
  unfurlFrom:  0.55,           // the rays' scale as it comes up
  unfurlMs:    1700,
  raysTurnMs:  60000,          // one turn of the long rays
  glintTurnMs: 84000,          // the glints, the other way round
  twinkleMs:   1300,           // glints dim and brighten
  twinkleDim:  0.3,
  glowScale:   1.05,           // the face swells a touch
  glowMs:      2600,
};

/* Butterflies. Each flies an elliptical loop round `x, y` (radii `rx, ry`), lapping in
 * `lapMs`, clockwise unless `ccw`. It arrives from `from` (units away), beats its wings every
 * `flapMs`, and with `glide` beats a few times then holds them open. Under Reduce Motion it
 * rests at `perch`, on the sky, off the petals.
 *
 * Smaller than the sun, and no loop comes within `sunClearance` of its centre: the monarch
 * across the top right, the swallowtail up and down beside the bloom, the rose low on the
 * left under the sun, the small white just over the flower's head. */
const BUTTERFLIES = {
  arriveMs:  2000,                            // the flight in, easing onto the loop
  arriveEase: 'cubic-bezier(0.33, 1, 0.68, 1)', // Iris's ease: 1 − (1 − x)³
  dotUnits:  3.6,                             // units per printed dot, so all print alike
  sunClearance: 12,                           // units between the sun's rays and any wingtip
  wingsClosed: 0.28,                          // how far the wings fold (Iris's flap)
  items: [
    { name: 'monarch',     dots: 36, x: 545, y: 80,  rx: 105, ry: 40,  lapMs: 9000,  ccw: false, from: [300, -260], perch: [470, 64],  flapMs: 210, glide: true,  bob: 22, bobMs: 5200 },
    { name: 'swallowtail', dots: 40, x: 610, y: 330, rx: 44,  ry: 125, lapMs: 9400,  ccw: true,  from: [320, 60],   perch: [622, 250], flapMs: 300, glide: true,  bob: 24, bobMs: 7100 },
    { name: 'rose',        dots: 34, x: 172, y: 455, rx: 74,  ry: 42,  lapMs: 6400,  ccw: false, from: [-380, 140], perch: [176, 436], flapMs: 240, glide: false, bob: 16, bobMs: 4300 },
    { name: 'white',       dots: 26, x: 440, y: 192, rx: 50,  ry: 20,  lapMs: 3400,  ccw: true,  from: [300, -240], perch: [462, 176], flapMs: 150, glide: false, bob: 12, bobMs: 2900 },
  ],
};

// Fails the build if a loop (or a perch) brings a butterfly's wingtip over the sun. The rays
// reach 32.5 of the sprite's 80 points from its centre.
for (const b of BUTTERFLIES.items) {
  const half = (b.dots * BUTTERFLIES.dotUnits) / 2;
  const near = Math.min(
    ...Array.from({ length: 72 }, (_, k) => {
      const a = (k / 72) * 2 * Math.PI;
      return Math.hypot(b.x + b.rx * Math.cos(a) - SUN.x, b.y + b.ry * Math.sin(a) - SUN.y);
    }),
    Math.hypot(b.perch[0] - SUN.x, b.perch[1] - SUN.y),
  );
  if (near - half < (SUN.size * 32.5) / 80 + BUTTERFLIES.sunClearance) throw new Error(`The ${b.name} flies over the sun (${Math.round(near)} units from it)`);
}

/* Petals, loose on the breeze: in from the top right, drifting down and left, fading out
 * before they reach the paper. */
const PETALS = {
  dots: 14, dotUnits: 5.2,   // printed petal size
  swayMs: 1700,              // side to side as it falls
  tumbleMs: 2600,            // one turn over
  items: [
    { sprite: 1, x: 640, y: -40, dx: -330, dy: 640, sway: 26, fallMs: 9000 },
    { sprite: 3, x: 520, y: -60, dx: -260, dy: 600, sway: 34, fallMs: 10400 },
    { sprite: 2, x: 700, y: 60,  dx: -420, dy: 560, sway: 22, fallMs: 8600 },
    { sprite: 1, x: 580, y: -20, dx: -360, dy: 660, sway: 30, fallMs: 11200 },
    { sprite: 3, x: 690, y: -50, dx: -300, dy: 620, sway: 24, fallMs: 9800 },
    { sprite: 2, x: 470, y: -30, dx: -240, dy: 640, sway: 32, fallMs: 10800 },
  ],
};

/** The flower's sizes attribute: it is 335/700 of the garden's width (Page.tsx `garden`). */
export const flowerSizes = '(max-width: 760px) 106px, (max-width: 1000px) 130px, min(13vw, 201px)';

// ── Units ─────────────────────────────────────────────────────────────────────────────
const pct = (v: number, of: number) => `${+((v / of) * 100).toFixed(3)}%`;
/** A distance in box units as a share of the garden's width (the garden is a container). */
const cq = (v: number) => `${+((v / BOX.width) * 100).toFixed(3)}cqw`;
const ms = (v: number) => `${Math.round(v)}ms`;
/** Places a square sprite of `size` units centred on (x, y). */
const centred = (x: number, y: number, size: number): React.CSSProperties => ({
  left: pct(x - size / 2, BOX.width),
  top: pct(y - size / 2, BOX.height),
  width: pct(size, BOX.width),
});
const vars = (v: Record<string, string | number>) => v as React.CSSProperties;

// ── Motion ────────────────────────────────────────────────────────────────────────────
const STILL = '@media (prefers-reduced-motion: reduce)';

const stretch = stylex.keyframes({
  '0%': { scale: 'var(--from)' },
  '55%': { scale: 'var(--over)' },
  '100%': { scale: '1' },
});
const swing = stylex.keyframes({
  from: { rotate: 'calc(var(--deg) * -1)' },
  to: { rotate: 'var(--deg)' },
});
const rise = stylex.keyframes({
  from: { translate: '0 var(--dy)', opacity: 0 },
  '40%': { opacity: 1 },
  to: { translate: '0 0', opacity: 1 },
});
const grow = stylex.keyframes({
  from: { scale: 'var(--from)' },
  to: { scale: '1' },
});
const turn = stylex.keyframes({
  from: { rotate: '0deg' },
  to: { rotate: '360deg' },
});
const twinkle = stylex.keyframes({
  from: { opacity: 1 },
  to: { opacity: 'var(--dim)' },
});
const swell = stylex.keyframes({
  from: { scale: '1' },
  to: { scale: 'var(--swell)' },
});
const arrive = stylex.keyframes({
  from: { translate: 'var(--fx) var(--fy)', opacity: 0 },
  '30%': { opacity: 1 },
  to: { translate: '0 0', opacity: 1 },
});
const bob = stylex.keyframes({
  from: { translate: '0 calc(var(--bob) * -0.5)' },
  to: { translate: '0 calc(var(--bob) * 0.5)' },
});
const loopX = stylex.keyframes({
  from: { translate: 'calc(var(--rx) * -1) 0' },
  to: { translate: 'var(--rx) 0' },
});
const loopY = stylex.keyframes({
  from: { translate: '0 calc(var(--ry) * -1)' },
  to: { translate: '0 var(--ry)' },
});
const flap = stylex.keyframes({
  '0%, 100%': { scale: '1 1' },
  '50%': { scale: 'var(--closed) 1' },
});
// Beats three times, then holds its wings open and sails.
const flapGlide = stylex.keyframes({
  '0%, 20%, 40%, 60%, 100%': { scale: '1 1' },
  '10%, 30%, 50%': { scale: 'var(--closed) 1' },
});
const fall = stylex.keyframes({
  from: { translate: '0 0', opacity: 0 },
  '8%': { opacity: 1 },
  '78%': { opacity: 1 },
  to: { translate: 'var(--dx) var(--dy)', opacity: 0 },
});
const drift = stylex.keyframes({
  from: { translate: 'calc(var(--sway) * -1) 0' },
  to: { translate: 'var(--sway) 0' },
});
const tumble = stylex.keyframes({
  from: { transform: 'rotate(0deg) rotateX(0deg)' },
  to: { transform: 'rotate(360deg) rotateX(720deg)' },
});

const g = stylex.create({
  garden: {
    position: 'absolute',
    right: 'clamp(-20px, 2vw, 40px)',
    bottom: -64,
    width: 'clamp(250px, 27vw, 420px)',
    aspectRatio: `${BOX.width} / ${BOX.height}`,
    zIndex: 1,
    containerType: 'inline-size',
    pointerEvents: 'none',
    '@media (max-width: 760px)': { width: 220, right: 0, bottom: -34 },
  },
  layer: { position: 'absolute' },
  square: { aspectRatio: '1' },
  rel: { position: 'relative' },
  fill: { position: 'absolute', inset: 0 },
  sprite: { display: 'block', width: '100%', height: 'auto' },
  flowerImg: { width: '100%' },

  // Every moving layer: its own animation, off under Reduce Motion.
  run: { animationFillMode: 'both' },
  ease: { animationTimingFunction: 'ease-in-out' },
  linear: { animationTimingFunction: 'linear' },
  forever: { animationIterationCount: 'infinite' },
  pingPong: { animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },

  stretch: { transformOrigin: FLOWER.foot, animationName: { default: stretch, [STILL]: 'none' }, animationDuration: ms(FLOWER.stretchMs), animationDelay: ms(TIMING.flowerStretches), animationTimingFunction: 'cubic-bezier(0.34, 1.2, 0.64, 1)' },
  swing: { transformOrigin: FLOWER.foot, animationName: { default: swing, [STILL]: 'none' }, animationDuration: 'var(--ms)' },

  rise: { animationName: { default: rise, [STILL]: 'none' }, animationDuration: ms(SUN.riseMs), animationDelay: ms(TIMING.sunRises), animationTimingFunction: BUTTERFLIES.arriveEase },
  unfurl: { animationName: { default: grow, [STILL]: 'none' }, animationDuration: ms(SUN.unfurlMs), animationDelay: ms(TIMING.raysUnfurl), animationTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' },
  turn: { animationName: { default: turn, [STILL]: 'none' }, animationDuration: ms(SUN.raysTurnMs) },
  turnBack: { animationName: { default: turn, [STILL]: 'none' }, animationDuration: ms(SUN.glintTurnMs), animationDirection: 'reverse' },
  twinkle: { animationName: { default: twinkle, [STILL]: 'none' }, animationDuration: ms(SUN.twinkleMs) },
  swell: { animationName: { default: swell, [STILL]: 'none' }, animationDuration: ms(SUN.glowMs) },

  arrive: { translate: { default: null, [STILL]: 'var(--px) var(--py)' }, animationName: { default: arrive, [STILL]: 'none' }, animationDuration: ms(BUTTERFLIES.arriveMs), animationDelay: 'var(--at)', animationTimingFunction: BUTTERFLIES.arriveEase },
  bob: { animationName: { default: bob, [STILL]: 'none' }, animationDuration: 'var(--bob-ms)' },
  mirror: { scale: '-1 1' },
  // A loop is two swings a quarter-lap apart: x across, y up and down, so the path is an
  // ellipse. Starting at the left, heading up; the heading turns with it, one turn a lap.
  loopX: { animationName: { default: loopX, [STILL]: 'none' }, animationDuration: 'calc(var(--lap) / 2)' },
  loopY: { animationName: { default: loopY, [STILL]: 'none' }, animationDuration: 'calc(var(--lap) / 2)', animationDelay: 'calc(var(--lap) * -0.75)' },
  heading: { animationName: { default: turn, [STILL]: 'none' }, animationDuration: 'var(--lap)' },
  flap: { animationName: { default: flap, [STILL]: 'none' }, animationDuration: 'var(--flap)' },
  flapGlide: { animationName: { default: flapGlide, [STILL]: 'none' }, animationDuration: 'calc(var(--flap) * 6)' },

  petal: { opacity: 0, animationName: { default: fall, [STILL]: 'none' }, animationDuration: 'var(--fall)', animationDelay: 'var(--at)', animationIterationCount: 'infinite', animationTimingFunction: 'linear', [STILL]: { display: 'none' } },
  drift: { animationName: { default: drift, [STILL]: 'none' }, animationDuration: ms(PETALS.swayMs) },
  tumble: { animationName: { default: tumble, [STILL]: 'none' }, animationDuration: ms(PETALS.tumbleMs) },
});

function Sprite({ name, dots }: { name: string; dots: number }) {
  const px = dots * 6; // sprites.mjs prints at 6× its dots
  // Low priority: they only matter once the opening plays, and must not hold up the fonts.
  return <img src={`/sprite/${name}.png`} width={px} height={px} alt="" decoding="async" fetchPriority="low" {...stylex.props(g.sprite)} />;
}

export function Garden() {
  const sunStyle = centred(SUN.x, SUN.y, SUN.size);
  return (
    <div {...stylex.props(g.garden)} aria-hidden data-garden>
      {/* The sun, behind everything */}
      <div {...stylex.props(g.layer, g.square, g.run, g.rise)} style={{ ...sunStyle, ...vars({ '--dy': cq(SUN.riseFrom) }) }}>
        <div {...stylex.props(g.fill, g.run, g.unfurl)} style={vars({ '--from': SUN.unfurlFrom })}>
          <div {...stylex.props(g.fill, g.run, g.turn, g.linear, g.forever)}>
            <Sprite name="sun-rays" dots={44} />
          </div>
          <div {...stylex.props(g.fill, g.run, g.turnBack, g.linear, g.forever)}>
            <div {...stylex.props(g.run, g.twinkle, g.pingPong)} style={vars({ '--dim': SUN.twinkleDim })}>
              <Sprite name="sun-glints" dots={44} />
            </div>
          </div>
        </div>
        <div {...stylex.props(g.fill, g.run, g.swell, g.pingPong)} style={vars({ '--swell': SUN.glowScale })}>
          <Sprite name="sun-face" dots={44} />
        </div>
      </div>

      {/* The flower: stretches up, then sways from its root under a slower gust */}
      <div
        {...stylex.props(g.layer, g.run, g.stretch)}
        style={{ left: pct(FLOWER.left, BOX.width), top: pct(FLOWER.top, BOX.height), width: pct(FLOWER.width, BOX.width), ...vars({ '--from': FLOWER.stretchFrom, '--over': FLOWER.stretchOver }) }}
      >
        <div {...stylex.props(g.run, g.swing, g.pingPong)} style={vars({ '--deg': `${FLOWER.gustDeg}deg`, '--ms': ms(FLOWER.gustMs) })}>
          <div {...stylex.props(g.run, g.swing, g.pingPong)} style={vars({ '--deg': `${FLOWER.swayDeg}deg`, '--ms': ms(FLOWER.swayMs) })}>
            <Picture name="hero-flower" alt="" eager scale={1.4} sizes={flowerSizes} xstyle={g.flowerImg} />
          </div>
        </div>
      </div>

      {/* Butterflies, one by one */}
      {BUTTERFLIES.items.map((b, i) => {
        const size = b.dots * BUTTERFLIES.dotUnits;
        return (
          <div
            key={b.name}
            {...stylex.props(g.layer, g.run, g.arrive)}
            style={{
              ...centred(b.x, b.y, size),
              ...vars({ '--fx': cq(b.from[0]), '--fy': cq(b.from[1]), '--px': cq(b.perch[0] - b.x), '--py': cq(b.perch[1] - b.y), '--at': ms(TIMING.firstButterfly + i * TIMING.butterflyGap) }),
            }}
          >
            <div {...stylex.props(g.run, g.bob, g.pingPong)} style={vars({ '--bob': cq(b.bob), '--bob-ms': ms(b.bobMs) })}>
              <div {...stylex.props(b.ccw && g.mirror)} style={vars({ '--rx': cq(b.rx), '--ry': cq(b.ry), '--lap': ms(b.lapMs) })}>
                <div {...stylex.props(g.run, g.loopX, g.pingPong)}>
                  <div {...stylex.props(g.run, g.loopY, g.pingPong)}>
                    <div {...stylex.props(g.rel, g.run, g.heading, g.linear, g.forever)}>
                      <div {...stylex.props(g.run, b.glide ? g.flapGlide : g.flap, g.ease, g.forever)} style={vars({ '--flap': ms(b.flapMs * 2), '--closed': BUTTERFLIES.wingsClosed })}>
                        <Sprite name={`${b.name}-wings`} dots={b.dots} />
                      </div>
                      <div {...stylex.props(g.fill)}>
                        <Sprite name={`${b.name}-body`} dots={b.dots} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Petals on the breeze */}
      {PETALS.items.map((p, i) => (
        <div
          key={i}
          {...stylex.props(g.layer, g.petal)}
          style={{
            ...centred(p.x, p.y, PETALS.dots * PETALS.dotUnits),
            ...vars({ '--dx': cq(p.dx), '--dy': cq(p.dy), '--fall': ms(p.fallMs), '--at': ms(TIMING.petalsDrift + i * TIMING.petalGap) }),
          }}
        >
          <div {...stylex.props(g.run, g.drift, g.pingPong)} style={vars({ '--sway': cq(p.sway) })}>
            <div {...stylex.props(g.run, g.tumble, g.linear, g.forever)}>
              <Sprite name={`petal-${p.sprite}`} dots={PETALS.dots} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
