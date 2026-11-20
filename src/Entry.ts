/* ─────────────────────────────────────────────────────────
 * THE COVER'S ENTRY · STORYBOARD
 *
 * Read top-to-bottom. Each value is ms after the page shows. It plays once: the cover opens
 * before sunrise, the sun climbs out of the frame and the day comes up; as it does, About's
 * camera pulls focus on the sky, the words print in, and the garden wakes last. Never under
 * Reduce Motion (global.css, "The cover's entry"); the words are there without it, and
 * without the script.
 *
 *    0ms   night blue over the sky; the sun climbs up from below the frame (under 1024px,
 *          where it has no cloud and rests low by the garden, it comes down from the top)
 *    0ms   the day comes up: the night lifts over 1900ms
 *  200ms   the clouds drift in from their corners, out of focus → sharp
 * 1000ms   TONE prints in behind, snapping into register
 * 1060ms   the wordmark, then the nav links (staggered 50ms)
 * 1100ms   the sun's beams come up
 * 1160ms   headline line 1 rises out of its slot; line 2 follows (staggered 110ms)
 * 1340ms   the ✻ spins in, −150° → 0, with a little bounce
 * 1480ms   the line under the headline rises; the leaves rise into the bottom corners
 * 1580ms   "100% on your Mac" stamps down; the three promises rise (staggered 60ms)
 * 1620ms   the flower grows up from its foot
 * 1680ms   the butterflies flutter in round it; the small ones by the flowers after (1820ms)
 * 1720ms   Download Iris stamps down; the requirements rise (staggered 60ms)
 * 1880ms   ⌃ ⌥ G drop in (staggered 70ms)
 * 2070ms   "in any text box" writes on, left to right
 * 2320ms   the pause button
 * 2420ms   the garden wakes: its loop starts (Garden.tsx's TIMING; client.ts starts it)
 * ───────────────────────────────────────────────────────── */
import type React from 'react';

/** When the words begin: once the day is mostly up. */
const DAY = 920;

export const TIMING = {
  sun:         0,           // the sun climbs up from below the frame
  dawn:        0,           // the night lifts off the sky
  clouds:      200,         // the clouds drift in from their corners, coming into focus
  ghost:       DAY + 80,    // TONE prints in, snapping into register
  masthead:    DAY + 140,   // the wordmark, then the nav links
  beams:       1100,        // the sun's beams come up
  title:       DAY + 240,   // headline line 1 rises; line 2 after TITLE.gap
  star:        DAY + 420,   // the ✻ spins in
  lede:        DAY + 560,   // the line under the headline rises
  lens:        DAY + 560,   // the leaves rise into the bottom corners, in front of the lens
  promise:     DAY + 660,   // "100% on your Mac" stamps down, the promises rise
  flower:      DAY + 700,   // the flower grows up from its foot
  butterflies: DAY + 760,   // the garden's butterflies flutter in
  closeFly:    DAY + 900,   // and the small ones by the flowers
  cta:         DAY + 800,   // Download Iris stamps down, the requirements rise
  keys:        DAY + 960,   // ⌃ ⌥ G drop in
  keysWords:   DAY + 1150,  // "in any text box" writes on
  pause:       DAY + 1400,  // the pause button
  gardenWakes: DAY + 1500,  // the garden's loop starts
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
  climb:  { stiffness: 26, damping: 9.5 },  // the sun: a slow climb, settling without a bounce
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

/* The sun, climbing up from below the frame to tuck in under its cloud; under 1024px, where it
   has no cloud and rests low by the garden, coming down from the top of the sky instead, a
   screen's height above (global.css swaps the start) */
const SUN = { y: '520%', fromAbove: 'calc(-100svh - 60px)', spring: SPRINGS.climb };

/* The night over the sky, lifting */
const DAWN = { duration: 1900, ease: 'ease-in', color: 'rgb(26 32 84)', from: 0.86 };  // night blue, most of the way over the sky

/* The leaves in the bottom corners, right in front of the lens */
const LENS = { y: '45%', duration: 1300, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' };

/* The flower, from its foot */
const FLOWER = { from: [0.92, 0.25], spring: SPRINGS.grow };

/* The sun's beams: they come up once it's high */
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

type Motion = 'rise' | 'line' | 'focus' | 'write' | 'fade' | 'dawn';
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
  sun: cue('rise', TIMING.sun, spring(SUN.spring), { y: SUN.y, ya: SUN.fromAbove }),
  dawn: cue('dawn', TIMING.dawn, timed(DAWN.duration, DAWN.ease), { c: DAWN.color, o: DAWN.from }),
  beams: cue('fade', TIMING.beams, timed(BEAMS.duration, BEAMS.ease)),
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
