/* ─────────────────────────────────────────────────────────
 * THE COVER'S ENTRY · STORYBOARD
 *
 * Read top-to-bottom. Each value is ms after the page shows. It plays once, as About's camera
 * pulls focus on the sky: the clouds come into focus from their corners, the words print in,
 * and the garden wakes last. Never under Reduce Motion (global.css, "The cover's entry"); the
 * words are there without it, and without the script.
 *
 *    0ms   the clouds drift in from their corners, out of focus → sharp
 *   80ms   TONE prints in behind, snapping into register
 *  140ms   the wordmark, then the nav links (staggered 50ms)
 *  200ms   the sun slips down out from behind its cloud; its beams come up after it (1200ms)
 *  240ms   headline line 1 rises out of its slot; line 2 follows (staggered 110ms)
 *  420ms   the ✻ spins in, −150° → 0, with a little bounce
 *  560ms   the line under the headline rises; the leaves rise into the bottom corners
 *  660ms   "100% on your Mac" stamps down; the three promises rise (staggered 60ms)
 *  700ms   the flower grows up from its foot
 *  760ms   the butterflies flutter in round it; the one close to the lens after (900ms)
 *  800ms   Download Iris stamps down; the requirements rise (staggered 60ms)
 *  960ms   ⌃ ⌥ G drop in (staggered 70ms)
 * 1150ms   "in any text box" writes on, left to right
 * 1400ms   the pause button
 * 1500ms   the garden wakes: its loop starts (Garden.tsx's TIMING; client.ts starts it)
 * ───────────────────────────────────────────────────────── */
import type React from 'react';

export const TIMING = {
  clouds:      0,     // the clouds drift in from their corners, coming into focus
  ghost:       80,    // TONE prints in, snapping into register
  masthead:    140,   // the wordmark, then the nav links
  sun:         200,   // the sun slips out from behind its cloud
  title:       240,   // headline line 1 rises; line 2 after TITLE.gap
  star:        420,   // the ✻ spins in
  lede:        560,   // the line under the headline rises
  lens:        560,   // the leaves rise into the bottom corners, in front of the lens
  promise:     660,   // "100% on your Mac" stamps down, the promises rise
  flower:      700,   // the flower grows up from its foot
  butterflies: 760,   // the garden's butterflies flutter in
  closeFly:    900,   // and the one close to the lens
  cta:         800,   // Download Iris stamps down, the requirements rise
  keys:        960,   // ⌃ ⌥ G drop in
  keysWords:   1150,  // "in any text box" writes on
  pause:       1400,  // the pause button
  gardenWakes: 1500,  // the garden's loop starts
};

/** A spring, as stiffness and damping on a unit mass. */
type Spring = { stiffness: number; damping: number };

/* Springs, by what they move */
const SPRINGS = {
  settle: { stiffness: 220, damping: 24 },  // big type: rises and settles, no bounce to speak of
  rise:   { stiffness: 300, damping: 30 },  // small copy: quick, smooth
  stamp:  { stiffness: 520, damping: 20 },  // a rubber stamp: down, a touch past, back
  drop:   { stiffness: 600, damping: 22 },  // keycaps landing
  spin:   { stiffness: 280, damping: 14 },  // the ✻: a little bounce at the end
  grow:   { stiffness: 260, damping: 15 },  // the flower: up, a touch past, settles
  slip:   { stiffness: 200, damping: 20 },  // the sun
} satisfies Record<string, Spring>;

/* The clouds: a slow ease out of focus (no spring: weather doesn't bounce) */
const CLOUDS = {
  duration: 1800,                              // ms to come into focus
  ease:     'cubic-bezier(0.16, 1, 0.3, 1)',   // fast at first, a long settle
  blur:     '12px',                            // how far out of focus they start
  scale:    1.06,                              // a touch closer at first, as a lens focusing
  from: {                                      // where each drifts in from: out of its corner
    left: ['-48px', '-32px'],
    bank: ['24px', '56px'],
    sun:  ['40px', '-36px'],
  },
};

/* TONE, the ghost word behind */
const GHOST = {
  duration: 900,                          // ms to print in
  ease:     'cubic-bezier(0.2, 0.8, 0.3, 1)',
  from:     ['8px', '-5px'],              // off register, snapping in
};

/* The wordmark and nav */
const MASTHEAD = { y: '-10px', gap: 50, spring: SPRINGS.rise };

/* The headline: each line rises out of its own slot */
const TITLE = { y: '0.55em', gap: 110, spring: SPRINGS.settle };

/* The ✻ */
const STAR = { rotate: '-150deg', scale: 0.3, spring: SPRINGS.spin };

/* Small copy rising: the line under the headline, the promises, the requirements */
const RISE = { y: '14px', gap: 60, spring: SPRINGS.rise };

/* Stamped down: the label and the button */
const STAMP = { scale: 1.22, rotate: '-4deg', spring: SPRINGS.stamp };

/* ⌃ ⌥ G */
const KEYS = { y: '-18px', gap: 70, spring: SPRINGS.drop };

/* "in any text box", in the brush hand */
const WRITE = { duration: 650, ease: 'cubic-bezier(0.45, 0, 0.2, 1)' };

/* The sun, out from behind its cloud */
const SUN = { y: '-70%', spring: SPRINGS.slip };

/* The leaves in the bottom corners, right in front of the lens */
const LENS = { y: '45%', duration: 1300, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' };

/* The flower, from its foot */
const FLOWER = { from: [0.92, 0.25], spring: SPRINGS.grow };

/* The sun's beams: they come up after it */
const BEAMS = { duration: 1200, ease: 'ease-out' };

/* The butterflies: in, out of nowhere, as they flit */
const BUTTERFLIES = { duration: 700, ease: 'ease-out' };

/* The pause button */
const PAUSE = { duration: 400, ease: 'ease-out' };

/** A spring as a CSS `linear()` easing, and how long it takes to settle: simulated from 0 to 1
 *  (a unit mass), sampled every 1/60s, kept to the points that bend the curve. */
export function spring({ stiffness, damping }: Spring): { ease: string; duration: number } {
  const dt = 1 / 240;
  let x = 0, v = 0, t = 0;
  const pts: [number, number][] = [[0, 0]];
  while (t < 4) {
    for (let k = 0; k < 4; k++) {
      v += (-stiffness * (x - 1) - damping * v) * dt;
      x += v * dt;
      t += dt;
    }
    pts.push([t, x]);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  pts[pts.length - 1][1] = 1;
  const end = pts[pts.length - 1][0];
  // Every other point is enough to hold the curve, and keeps the CSS small.
  const kept = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);
  const ease = `linear(${kept.map(([pt, px], i) => (i === 0 || i === kept.length - 1 ? `${+px.toFixed(3)}` : `${+px.toFixed(3)} ${+((pt / end) * 100).toFixed(1)}%`)).join(', ')})`;
  return { ease, duration: Math.round(end * 1000) };
}

type Motion = 'rise' | 'line' | 'focus' | 'write' | 'fade';
/** Who moves: the element itself, its children, or its children's children (staggered by
 *  `gap`, in order). Children where the element runs an animation of its own (a cloud's drift,
 *  a leaf's sway) or is only a wrapper. */
type Who = 'self' | 'kids' | 'grandkids';
const ATTR = { self: 'data-enter', kids: 'data-enter-kids', grandkids: 'data-enter-grandkids' } as const;
/** What an element needs to enter: which motion, when, how long, on what curve, and its own
 *  start (`from`, as CSS variables: global.css's "The cover's entry" reads them). */
function cue(motion: Motion, at: number, curve: { ease: string; duration: number }, from: Record<string, string | number> = {}, who: Who = 'self', gap = 0) {
  const style: Record<string, string> = { '--enter': `enter-${motion}`, '--enter-at': `${at}ms`, '--enter-dur': `${curve.duration}ms`, '--enter-ease': curve.ease, '--enter-gap': `${gap}ms` };
  for (const [k, v] of Object.entries(from)) style[`--e${k}`] = String(v);
  return { [ATTR[who]]: '', style: style as React.CSSProperties };
}
const timed = (duration: number, ease: string) => ({ duration, ease });

/** Each element's entry, ready to spread onto it: `<p {...ENTER.lede}>`. Styles merge with
 *  `withEnter` where the element has its own. */
/** Each cue carries its own name on its attribute (`data-enter="title"`), so it can be found and
 *  retimed while reviewing. */
const named = <T extends Record<string, ReturnType<typeof cue>>>(cues: T): T =>
  Object.fromEntries(Object.entries(cues).map(([k, c]) => [k, Object.fromEntries(Object.entries(c).map(([a, v]) => [a, a.startsWith('data-enter') ? k : v]))])) as T;
export const ENTER = named({
  cloudLeft: cue('focus', TIMING.clouds, timed(CLOUDS.duration, CLOUDS.ease), { b: CLOUDS.blur, s: CLOUDS.scale, x: CLOUDS.from.left[0], y: CLOUDS.from.left[1] }, 'kids'),
  cloudBank: cue('focus', TIMING.clouds, timed(CLOUDS.duration, CLOUDS.ease), { b: CLOUDS.blur, s: CLOUDS.scale, x: CLOUDS.from.bank[0], y: CLOUDS.from.bank[1] }, 'kids'),
  cloudSun: cue('focus', TIMING.clouds, timed(CLOUDS.duration, CLOUDS.ease), { b: CLOUDS.blur, s: CLOUDS.scale, x: CLOUDS.from.sun[0], y: CLOUDS.from.sun[1] }, 'kids'),
  ghost: cue('focus', TIMING.ghost, timed(GHOST.duration, GHOST.ease), { x: GHOST.from[0], y: GHOST.from[1] }, 'kids'),
  wordmark: cue('rise', TIMING.masthead, spring(MASTHEAD.spring), { y: MASTHEAD.y }),
  nav: cue('rise', TIMING.masthead + MASTHEAD.gap, spring(MASTHEAD.spring), { y: MASTHEAD.y }, 'kids', MASTHEAD.gap),
  sun: cue('rise', TIMING.sun, spring(SUN.spring), { y: SUN.y }),
  beams: cue('fade', TIMING.sun, timed(BEAMS.duration, BEAMS.ease)),
  butterflies: cue('fade', TIMING.butterflies, timed(BUTTERFLIES.duration, BUTTERFLIES.ease)),
  closeFly: cue('fade', TIMING.closeFly, timed(BUTTERFLIES.duration, BUTTERFLIES.ease)),
  title: cue('line', TIMING.title, spring(TITLE.spring), { y: TITLE.y }, 'kids', TITLE.gap),
  star: cue('rise', TIMING.star, spring(STAR.spring), { r: STAR.rotate, sx: STAR.scale, sy: STAR.scale }),
  lede: cue('rise', TIMING.lede, spring(RISE.spring), { y: RISE.y }),
  lens: cue('rise', TIMING.lens, timed(LENS.duration, LENS.ease), { y: LENS.y }, 'kids'),
  promise: cue('rise', TIMING.promise, spring(RISE.spring), { y: RISE.y }, 'kids', RISE.gap),
  promiseStamp: cue('rise', TIMING.promise, spring(STAMP.spring), { sx: STAMP.scale, sy: STAMP.scale, r: STAMP.rotate }),
  flower: cue('rise', TIMING.flower, spring(FLOWER.spring), { sx: FLOWER.from[0], sy: FLOWER.from[1] }),
  cta: cue('rise', TIMING.cta, spring(STAMP.spring), { sx: STAMP.scale, sy: STAMP.scale, r: STAMP.rotate }, 'grandkids'),
  ctaMeta: cue('rise', TIMING.cta + RISE.gap, spring(RISE.spring), { y: RISE.y }, 'kids', RISE.gap),
  keys: cue('rise', TIMING.keys, spring(KEYS.spring), { y: KEYS.y }, 'grandkids', KEYS.gap),
  keysWords: cue('write', TIMING.keysWords, timed(WRITE.duration, WRITE.ease)),
  pause: cue('fade', TIMING.pause, timed(PAUSE.duration, PAUSE.ease)),
});
export type EnterCue = (typeof ENTER)[keyof typeof ENTER];

/** An entry's attributes with the element's own style folded in. */
export const withEnter = (cue: EnterCue, style: React.CSSProperties) => ({ ...cue, style: { ...style, ...cue.style } });
