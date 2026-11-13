// The cover's garden (first drawn by a Fable 5.2 agent).
//
// Iris's garden, played as the app's one moment: Iris's flower, the sun and the four
// butterflies, and what the garden is for. At rest the flower stands, the sun's rays tick
// round a notch at a time, and the butterflies hover by the bloom. Then ⌃ ⌥ G: the cover's own
// keys go down, the flower perks up, the sun beams, and Iris's panel pops out of the bloom,
// drawn as the app draws it (PanelView.swift, and section 03 of this page). Three butterflies
// leave the bloom and each lands on one of Iris's words; as it lands, the pink is swiped on
// under that word. They go back, the fix is read, Return: Replace takes the press, the panel
// folds back into the bloom, and the garden is pleased about it.
//
// The flower is the app's own, printed part by part (scripts/fable-flower.mjs ports its rig,
// IrisRig.swift): three falls, two more behind, five standards, the heart, the throat, the
// stem and the sword leaf, each moving by itself, so the bloom breathes instead of rocking as
// one block, and the brown ground printed in front of its foot, so it grows out of the ground.
// The sun and butterflies are the garden's sprites (public/sprite). The storyboard below is
// every beat: each part keeps to the one loop (only the flower's breathing, the hovering and
// the wingbeats run free). It moves in CSS on transforms and opacity; the markers' swipes are
// clips, like the page's other markers. The
// script (client.ts, "The cover's garden") holds it while the cover is scrolled away and presses
// the keys. Under Reduce Motion it is the moment Iris has answered: the panel open, a
// butterfly on each of its words.

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each time is ms into a loop of 12000ms.
 *
 *  always   the scene has depth: the sun, the far butterfly, the panel, the
 *           butterflies in front of it, the flower. The view sways (9000ms
 *           one way) and each plane slides with it by its own amount, 2 to 13
 *           units; on a fine pointer each also follows the pointer, 3 to 17px
 *     0ms   the garden at rest. The flower breathes: the stem sways (1.4°), the
 *           head follows a beat behind it, every petal rocks at its own pace,
 *           the leaf flutters, the heart swells. Three butterflies hover apart
 *           in the open sky, each at a home of its own, a fourth far off; the
 *           sun's rays tick round (375ms a notch)
 *  1200ms   ⌃ ⌥ G: the cover's keys go down one after another (90ms apart)
 *  1700ms   the keys come up; the flower perks up from its foot, 1 → 1.06 → 1, and
 *           its petals open like a fan, the falls first, the top petal last
 *           (40ms apart, up to 6°), then close again; the leaf flicks out;
 *           the sun beams, its rays 1 → 1.2 → 1
 *  2000ms   the panel pops out of the bloom, 0.15 → 1.02 → 1; the flower's head
 *           tips back to it (4°)
 *  2500ms   the butterflies leave for Iris's words, the nearest first (the next
 *           180ms and 420ms after it), each from its own home over an arc of
 *           its own height (700ms), turning to face its word, ending a little
 *           bigger than the word
 *  3200ms   the first lands on "can't" and the pink is swiped on under it;
 *           then "tomorrow" (3380ms) and "they're" (3620ms)
 *           (they sit on the three fixes for 2880ms)
 *  6500ms   they lift off again in the same order, each back to its own home (700ms)
 *  7900ms   Return: Replace takes the press (scale 0.94)
 *  8050ms   the panel folds back into the bloom, 1 → 0.15; the head rocks the
 *           other way and settles, the petals open, overshoot shut and settle,
 *           the same wave again; the sun's rays kick 1 → 1.28 → 1, its face
 *           hops, its glints blink twice; every butterfly jumps, 250ms apart
 * 12000ms   the loop comes round. After three loops it settles: the garden at rest,
 *           no panel, nothing flying, every part held still (client.ts)
 * ───────────────────────────────────────────────────────── */
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { flower } from './fableFlower';
import type { FlowerPart } from './fableFlower';
import { Panel, panel } from './Panel';
import { font, ink } from './tokens.stylex';

const TIMING = {
  loop:        12000,  // one round of the garden
  keysPress:   1200,   // ⌃ goes down, then ⌥, then G (client.ts presses them)
  keyGap:      90,     // between keys
  wakes:       1700,   // the keys come up: the flower perks up, the sun beams
  panelPops:   2000,   // the panel pops out of the bloom, the flower leans to it
  flyOut:      2500,   // the first butterfly leaves for its word
  lands:       3200,   // the first lands, and its pink is swiped on
  flyHome:     6500,   // the first lifts off again: the last has been down 2880ms
  loops:       3,      // rounds played before the garden settles at rest for good (client.ts)
  returnKey:   7900,   // Replace takes the press
  replace:     8050,   // the panel folds away, the garden is pleased
};

/* The garden box, 700 × 720 in its own units, the flower in the same
 * place at the same size. The page scales the box. */
const BOX = { width: 700, height: 720 };

/* The note Iris is reading, as the panel shows it. A slip is { was, now }; the lines are the
 * panel's own, so each of Iris's words is where the butterflies expect it. */
type Word = string | { was: string; now: string };
const NOTE: { words: Word[]; tones: string[]; app: string } = {
  words: ['hey @sam! ', { was: 'cant', now: "can't" }, ' come ', { was: 'tmrw', now: 'tomorrow' }, ', ', { was: 'their', now: "they're" }, ' moving it!!'],   // short, so the narrow panel stays low
  tones: ['Fix', 'Professional', 'Friendly', 'Shorter', 'Clearer'],   // Iris's own, Fix chosen
  app: 'Notes',                                                      // where Replace will put it (its icon is public/app/notes.png)
};

/* Iris's panel: the site's one Panel (Panel.tsx), untouched, laid out at its own size and
 * scaled whole by one transform.
 *   wide    (over 1440px) with its key hints, at `scale.wide`. It opens into the sky left of
 *           the bloom, its bottom just above the plate's edge; the bloom is in front of its
 *           corner and may cover the end of Replace, never the word.
 *   desk    (1024 to 1440px) the same without the hints, so it is laid out narrower; from
 *           `scale.at1280` to `scale.at1440` between those widths, and under 1280px as wide
 *           as the room between the Download button's two lines and the bloom.
 *   narrow  (under 1024px) simpler: its tone names are hidden too, leaving the message, "into"
 *           and Replace, so it can be laid out narrow and shown at a size to read. The
 *           cover's words leave no room beside the bloom there, so it opens over the bloom,
 *           its right edge at the box's, as wide as fits clear of the words.
 *   phone   (760px and under) the same, as wide as the phone. */
const PANEL = {
  natural: { hints: 660, plain: 540, simple: 372 },   // px it is laid out at before scaling: the least its footer fits on one line
  scale: { wide: 0.82, at1440: 0.82, at1280: 0.78 },
  // Its height as a share of its width, until the script has measured it (client.ts).
  ratio: { wide: 0.391, desk: 0.476, simple: 0.55 },
  // How far past the bloom's left edge (35.3cqw in the box) its right edge goes: its own
  // padding and Replace's ↵ chip, and where room is short (toward 1024px) up to a third of Replace.
  past: { wide: '45px', desk: 'clamp(30px, 183.6px - 12vw, 60px)' },
  // The room from 24px right of the cover's "macOS 15 or later" line (the page's left padding
  // and 487px) to that edge, less `past`.
  room: '100vw - clamp(-20px, 2vw, 40px) - 64.7cqw - max(0px, (100vw - 1280px) / 2) - clamp(20px, 5vw, 72px) - 511px',
  bottom: 'calc(102.857cqw - 72px)',     // 8px above the plate's bottom edge (the box hangs 64px below it)
  narrow: { at: ['calc(100cqw + 2vw - 8px)', '58cqw'], width: 'min(100vw - 553px, 294px)', corner: '72% 100%' },
  phone:  { at: ['calc(100cqw - 12px)', '49.2cqw'], width: 'min(300px, 100vw - 24px)', corner: '72% 100%' },
  from: 0.15, over: 1.02,           // its scale as it pops: from, past, then 1
  popMs: [260, 140],                // out past full size, then settling
  swipeMs: 250,                     // a marker swiped on
  foldMs: 220,                      // folding back into the bloom
  pressScale: 0.94, pressMs: [80, 70],
};

/* The flower, printed part by part from the app's rig (fableFlower.ts has each part's sprite,
 * the point it grows from and the way it points). Places here are in the rig's points, from
 * the foot: the stem turns on its foot and carries the head; the head turns on the stem's
 * top; every petal turns on the bloom's centre; the leaf on its own foot. */
const FLOWER = {
  foot: [363.75, 685.7],            // where it stands in the box: the root the cover's flower has always had
  unit: 2.92,                       // box units to a point of the rig: its own size, as it was on the wider box
  stretch: 1,                       // the stem's length, as a share of the rig's
  phone: 1.26,                      // on a phone the box is small: the flower is this much bigger, from its foot
  room: { left: -50, top: -116, width: 100, height: 126 },   // the rig's points it is laid out in, round the foot
  leafAt: [-3, 0],                  // the leaf's foot, beside the stem's (IrisRig.draw)
  // Breathing, all the time. Each is a swing from −deg to +deg and back, `ms` one way.
  sway:   { deg: 1.4, ms: 3400 },                 // the stem, from its foot
  head:   { deg: 1.8, ms: 3400, lagMs: 900 },     // the bloom on the stem's top, a beat behind the stem
  leaf:   { deg: 2.2, ms: 2700, lagMs: 400 },
  heart:  { swell: 1.06, ms: 1500 },
  throat: { swell: 1.18, ms: 1500 },
  // The beats.
  perk: 1.06, perkMs: [180, 300],   // the plant up past full height, then settling; the petals open and close with it
  openGap: 40,                      // between one ring of petals opening and the next
  leafFlick: -6,                    // the leaf, as the petals open
  leanDeg: -4, leanMs: 400,         // the head tipped back to the panel while it is out
  rockDeg: 5, rockMs: [180, 420],   // and rocked the other way as the panel folds in
  shiverMs: [150, 250, 250],        // the petals at Return: open, past shut, settled
  shiverBack: -0.5,                 // how far past shut, as a share of `open`
  // The bloom, back to front as the rig draws it. Each petal: how far it opens (degrees, away
  // from the top of the fan; the two that point straight up and down swell instead), its
  // place in the wave (the front fall first, the top standard last), and its own breathing.
  bloom: [
    { part: 'back-1',     open: -5, swell: 1,    ring: 2, breathe: 1.5, ms: 2800 },
    { part: 'back-2',     open: 5,  swell: 1,    ring: 2, breathe: 1.6, ms: 2400 },
    { part: 'heart' },
    { part: 'standard-2', open: -5, swell: 1,    ring: 3, breathe: 2.2, ms: 2300 },
    { part: 'standard-4', open: 5,  swell: 1,    ring: 3, breathe: 2.3, ms: 2700 },
    { part: 'standard-1', open: -3, swell: 1.02, ring: 4, breathe: 1.8, ms: 2900 },
    { part: 'standard-5', open: 3,  swell: 1.02, ring: 4, breathe: 1.9, ms: 2200 },
    { part: 'standard-3', open: 0,  swell: 1.07, ring: 5, breathe: 1.2, ms: 2600 },
    { part: 'fall-1',     open: -6, swell: 1,    ring: 1, breathe: 1.8, ms: 3000 },
    { part: 'fall-3',     open: 6,  swell: 1,    ring: 1, breathe: 1.9, ms: 2500 },
    { part: 'fall-2',     open: 0,  swell: 1.06, ring: 0, breathe: 1.4, ms: 2000 },
    { part: 'throat' },
  ] as ({ part: 'heart' | 'throat' } | { part: Exclude<FlowerPart, 'heart' | 'throat'>; open: number; swell: number; ring: number; breathe: number; ms: number })[],
};

/* Depth. The cover is a scene, not a sheet of stickers: five planes, back to front. A plane
 * further off is drawn smaller (`scale`), in thinner ink (`ink`, its opacity: the sky shows
 * through, as far things pale), keeps a slower pace (`pace`, times every beat of its own),
 * and moves less: `drift` is how far it slides each way as the view sways (units), `look` how
 * far it follows the pointer (px, fine pointers only). The flower is rooted, so it stays put
 * and everything behind it slides past it. */
const DEPTH = {
  swayMs: 9000,                                                              // one way across, every plane together
  sun:    { scale: 0.86, ink: 0.84, pace: 1,    drift: 2,  look: [3, 2] },    // far away: moves least
  far:    { scale: 0.72, ink: 0.78, pace: 1.35, drift: 5,  look: [7, 4] },    // butterflies behind the panel
  panel:  { scale: 1,    ink: 1,    pace: 1,    drift: 8,  look: [11, 6] },   // the panel, and whatever has landed on it
  near:   { scale: 1,    ink: 1,    pace: 0.82, drift: 8,  look: [11, 6] },   // the butterflies in front of the panel: they land on it, so they slide with it
  flower: { scale: 1,    ink: 1,    pace: 1,    drift: 0,  look: [0, 0] },    // closest, in front of everything, rooted
  shadow: '0 2px 2px rgb(42 26 22 / 0.08), 0 22px 34px -14px rgb(42 26 22 / 0.5)',   // the panel's, soft, on what's behind it
};
type Plane = { scale: number; ink: number; pace: number; drift: number; look: number[] };

/* The sun, in three prints: face, long rays, short glints */
const SUN = {
  size: 140,                        // before its plane's scale
  // Its centre: up and to the right of the flower, in the open sky under the headline's line.
  // Where the panel opens over the bloom it is above the panel's right end, and on a phone
  // beside the bloom, to its right.
  wide:   ['84.3cqw', '25.7cqw'],
  narrow: ['88.6cqw', 'calc(var(--py) - var(--pw) * var(--pr) - 17cqw)'  ],        // under 1024px
  phone:  ['calc(100cqw - 22px)', '70cqw'],                                                // 760px and under
  notchMs: 375,                     // the rays move a sixteenth of a turn at a time
  beam: 1.2, beamMs: [150, 350],    // the rays as the garden wakes
  cheer: 1.28, cheerMs: [150, 450], // and at Return
  hop: -14, hopMs: [150, 250, 250], // the face: up and stretched, down and squashed, settled
  blinkMs: 100,                     // the glints, off and on, twice
};

/* Butterflies.
 *   far      one hovers behind the panel, half out from behind its top edge (`by`, across and
 *            down the panel as shares of its width and height), small and pale. It never lands.
 *   landing  three hover in front, in full ink, each at a home of its own in the open sky
 *            (HOMES, in the box's units, which may be outside the box; `narrow` and `phone`
 *            on those covers): one low on the left, one high on the right, one beside
 *            the bloom, never together. When the panel is out each flies to its word,
 *            `after` the nearest has left, so they go one by one and never as a formation:
 *            a straight line with an arc over it (`arc` units high), turned to
 *            `heading` on the way, landing in front of the panel at `perch` pointing
 *            `perchTilt`: the top right corner of its word, which the script measures
 *            (client.ts); until it has, a guess, across and down the panel as shares of its
 *            width and height. On the word it is `perched` of the panel's height tall, a
 *            little more than the word, whatever size the panel is. Then back.
 * All of them jump at Return. `dots` is the sprite's own size (sprites.mjs); `flapMs` is one
 * wingbeat, open to closed, and `hoverMs` one rise or fall, before the plane's pace. */
type Butterfly = { name: string; dots: number; plane: 'far' | 'landing'; perched?: number; word?: string; after?: number; arc?: number; perch?: number[]; perchTilt?: number; home?: number[]; by?: number[]; homeTilt: number; heading?: number; hoverMs: number; flapMs: number };
/* The landing butterflies' homes, in the order they are listed below. */
const HOMES = [
  { home: [-725, 461], narrow: [-190, 468], phone: [-250, 440] },   // low on the left, under the Download button's lines
  { home: [410, -384], narrow: [410, -384], phone: [-64, 551] },    // high on the right, in the sky beside the headline
  { home: [617, 452],  narrow: [617, 452],  phone: [557, 392] },    // beside the bloom, to its right
];
const BUTTERFLIES = {
  dotUnits: 2.25,       // units per printed dot on the panel's plane
  flightMs: 700,
  jump: 44,             // at Return
  jumpMs: [300, 400],
  hover: 6,             // up and down at rest, in units
  wingsClosed: 0.3,
  items: [
    { name: 'swallowtail', dots: 40, plane: 'far',     by: [0.7, 0.02],  homeTilt: 16,  hoverMs: 2500, flapMs: 200 },
    { name: 'monarch',     dots: 36, plane: 'landing', word: "can't",    after: 0,   arc: 70,  perch: [0.37, 0.4], perched: 0.15,  perchTilt: 14,  homeTilt: -18, heading: 40,  hoverMs: 1700, flapMs: 150 },
    { name: 'rose',        dots: 34, plane: 'landing', word: 'tomorrow', after: 180, arc: 40,  perch: [0.73, 0.4], perched: 0.14,  perchTilt: -12, homeTilt: 24,  heading: -150, hoverMs: 2100, flapMs: 170 },
    { name: 'white',       dots: 26, plane: 'landing', word: "they're",  after: 420, arc: 110, perch: [0.3, 0.52], perched: 0.125, perchTilt: 10,  homeTilt: -30, heading: -70, hoverMs: 1300, flapMs: 120 },
  ] as Butterfly[],
};

// ── Units ─────────────────────────────────────────────────────────────────────────────
const pct = (v: number, of: number) => `${+((v / of) * 100).toFixed(3)}%`;
/** A distance in box units as a share of the box's width (the box is a container). */
const cq = (v: number) => `${+((v / BOX.width) * 100).toFixed(3)}cqw`;
const ms = (v: number) => `${Math.round(v)}ms`;
const vars = (v: Record<string, string | number>) => v as React.CSSProperties;

// ── Motion ────────────────────────────────────────────────────────────────────────────
// Every part runs one keyframe set as long as the loop, so nothing can drift out of step.
// StyleX wants keyframe stops written out, so they are: each is a TIMING above as a share of
// the 12000ms loop. `stops` below works every one out again from TIMING and the configs, and
// the build fails if a stop written here has drifted from them. A butterfly that leaves later
// than the first runs the same keyframes with a delay (its `after`), and so does its marker.
const STILL = '@media (prefers-reduced-motion: reduce)';

// The plant perking up from its foot as the garden wakes.
const perk = stylex.keyframes({
  '0%, 14.17%': { scale: '1', animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
  '15.67%': { scale: 'var(--perk)', animationTimingFunction: 'ease-in-out' },
  '18.17%, 100%': { scale: '1' },
});
// The head tipped back to the panel while it is out, rocked the other way as it folds in.
const lean = stylex.keyframes({
  '0%, 16.67%': { rotate: '0deg', animationTimingFunction: 'cubic-bezier(0.3, 0, 0.2, 1)' },
  '20%, 67.08%': { rotate: 'var(--lean)', animationTimingFunction: 'ease-out' },
  '68.58%': { rotate: 'var(--rock)', animationTimingFunction: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  '72.08%, 100%': { rotate: '0deg' },
});
// A petal (or the leaf) opening as the garden wakes, and again at Return, when it swings
// past shut before it settles. Each ring of petals runs this a little after the one before.
const open = stylex.keyframes({
  '0%, 14.17%': { rotate: '0deg', scale: '1', animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
  '15.67%': { rotate: 'var(--open)', scale: 'var(--swell)', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.3, 1.4)' },
  '18.17%, 67.08%': { rotate: '0deg', scale: '1', animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
  '68.33%': { rotate: 'var(--open)', scale: 'var(--swell)', animationTimingFunction: 'ease-in-out' },
  '70.42%': { rotate: 'var(--shut)', scale: '1', animationTimingFunction: 'ease-out' },
  '72.5%, 100%': { rotate: '0deg', scale: '1' },
});
// Breathing: a swing either side of rest, and the centre's swell.
const swing = stylex.keyframes({
  from: { rotate: 'calc(var(--deg) * -1)' },
  to: { rotate: 'var(--deg)' },
});
const swell = stylex.keyframes({
  from: { scale: '1' },
  to: { scale: 'var(--swell)' },
});
// The sun's rays, a notch at a time (the element sets the steps), two turns a loop.
const tick = stylex.keyframes({
  from: { rotate: '0deg' },
  to: { rotate: '360deg' },
});
// The rays beaming as the garden wakes, and further at Return.
const beam = stylex.keyframes({
  '0%, 14.17%': { scale: '1', animationTimingFunction: 'ease-out' },
  '15.42%': { scale: 'var(--beam)', animationTimingFunction: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  '18.33%, 67.08%': { scale: '1', animationTimingFunction: 'ease-out' },
  '68.33%': { scale: 'var(--cheer)', animationTimingFunction: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  '72.08%, 100%': { scale: '1' },
});
// The face hopping at Return: up and stretched, down and squashed, settled.
const hop = stylex.keyframes({
  '0%, 67.08%': { translate: '0 0', scale: '1 1', animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
  '68.33%': { translate: '0 var(--hop)', scale: '0.95 1.07', animationTimingFunction: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
  '70.42%': { translate: '0 0', scale: '1.07 0.93', animationTimingFunction: 'cubic-bezier(0.3, 1.5, 0.5, 1)' },
  '72.5%, 100%': { translate: '0 0', scale: '1 1' },
});
// The glints blinking twice at Return.
const blink = stylex.keyframes({
  '0%, 67.08%': { opacity: 1, animationTimingFunction: 'step-end' },
  '67.92%': { opacity: 0.15, animationTimingFunction: 'step-end' },
  '68.75%': { opacity: 1, animationTimingFunction: 'step-end' },
  '69.58%': { opacity: 0.15, animationTimingFunction: 'step-end' },
  '70.42%, 100%': { opacity: 1 },
});
// The panel popping out of the bloom, and folding back into it at Return.
const pop = stylex.keyframes({
  '0%, 16.67%': { scale: 'var(--from)', opacity: 0, animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
  '17.17%': { opacity: 1 },
  '18.83%': { scale: 'var(--over)', opacity: 1, animationTimingFunction: 'ease-in-out' },
  '20%, 67.08%': { scale: '1', opacity: 1, animationTimingFunction: 'cubic-bezier(0.5, 0, 0.9, 0.4)' },
  '68.42%': { opacity: 1 },
  '68.92%, 100%': { scale: 'var(--from)', opacity: 0 },
});
// Replace taking Return.
const push = stylex.keyframes({
  '0%, 65.83%': { scale: '1', animationTimingFunction: 'ease-out' },
  '66.5%': { scale: 'var(--press)', animationTimingFunction: 'ease-out' },
  '67.08%, 100%': { scale: '1' },
});
// A pink marker swiped on as its butterfly lands.
const swipe = stylex.keyframes({
  '0%, 26.67%': { clipPath: 'inset(-20% 100% -20% 0)', animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  '28.75%, 80%': { clipPath: 'inset(-20% -6% -20% 0)', animationTimingFunction: 'step-end' },
  '80.01%, 100%': { clipPath: 'inset(-20% 100% -20% 0)' },
});
// A butterfly: from its place by the bloom to its word and back, coming forward as it goes:
// bigger and in fuller ink. It is placed at its word,
// so `--hx, --hy` is the way home from there.
const fly = stylex.keyframes({
  '0%, 20.83%': { translate: 'var(--hx) var(--hy)', rotate: 'var(--home-tilt)', scale: 'var(--home-scale)', opacity: 'var(--home-ink)', animationTimingFunction: 'cubic-bezier(0.45, 0, 0.3, 1)' },
  '22.08%': { rotate: 'var(--heading)' },
  '26.67%, 54.17%': { translate: '0 0', rotate: 'var(--perch-tilt)', scale: 'var(--perched)', opacity: 'var(--perch-ink)', animationTimingFunction: 'cubic-bezier(0.45, 0, 0.3, 1)' },
  '60%, 100%': { translate: 'var(--hx) var(--hy)', rotate: 'var(--home-tilt)', scale: 'var(--home-scale)', opacity: 'var(--home-ink)' },
});
// The arc over each flight, and the jump at Return.
const arc = stylex.keyframes({
  '0%, 20.83%': { translate: '0 0', animationTimingFunction: 'ease-out' },
  '23.75%': { translate: '0 var(--arc)', animationTimingFunction: 'ease-in' },
  '26.67%, 54.17%': { translate: '0 0', animationTimingFunction: 'ease-out' },
  '57.08%': { translate: '0 var(--arc)', animationTimingFunction: 'ease-in' },
  '60%, 67.08%': { translate: '0 0', animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
  '69.58%': { translate: '0 var(--jump)', animationTimingFunction: 'cubic-bezier(0.6, 0, 0.7, 0.6)' },
  '72.92%, 100%': { translate: '0 0' },
});
// The view swaying: every plane slides across and back, the near ones further.
const sway = stylex.keyframes({
  from: { translate: 'calc(var(--drift) * -1) 0' },
  to: { translate: 'var(--drift) 0' },
});
const hover = stylex.keyframes({
  from: { translate: '0 calc(var(--hover) * -1)' },
  to: { translate: '0 var(--hover)' },
});
const flap = stylex.keyframes({
  from: { scale: '1 1' },
  to: { scale: 'var(--closed) 1' },
});

// The stops above, worked out from TIMING and the configs: a number changed in one place and
// not the other stops the build here rather than playing out of step.
{
  const T = TIMING;
  const at = (t: number) => +((t / T.loop) * 100).toFixed(2);
  /** The stops after `from`, each `steps` further on. */
  const then = (from: number, steps: number[]) => steps.map((_, i) => at(from + steps.slice(0, i + 1).reduce((a, b) => a + b, 0)));
  const B = BUTTERFLIES, half = B.flightMs / 2;
  const stops: Record<string, [number[], number[]]> = {
    perk: [[14.17, 15.67, 18.17], [at(T.wakes), ...then(T.wakes, FLOWER.perkMs)]],
    open: [[14.17, 15.67, 18.17, 67.08, 68.33, 70.42, 72.5], [at(T.wakes), ...then(T.wakes, FLOWER.perkMs), at(T.replace), ...then(T.replace, FLOWER.shiverMs)]],
    lean: [[16.67, 20, 67.08, 68.58, 72.08], [at(T.panelPops), at(T.panelPops + FLOWER.leanMs), at(T.replace), ...then(T.replace, FLOWER.rockMs)]],
    beam: [[14.17, 15.42, 18.33, 67.08, 68.33, 72.08], [at(T.wakes), ...then(T.wakes, SUN.beamMs), at(T.replace), ...then(T.replace, SUN.cheerMs)]],
    hop: [[67.08, 68.33, 70.42, 72.5], [at(T.replace), ...then(T.replace, SUN.hopMs)]],
    blink: [[67.08, 67.92, 68.75, 69.58, 70.42], [at(T.replace), ...then(T.replace, [SUN.blinkMs, SUN.blinkMs, SUN.blinkMs, SUN.blinkMs])]],
    pop: [[16.67, 18.83, 20, 67.08, 68.92], [at(T.panelPops), ...then(T.panelPops, PANEL.popMs), at(T.replace), at(T.replace + PANEL.foldMs)]],
    push: [[65.83, 66.5, 67.08], [at(T.returnKey), ...then(T.returnKey, PANEL.pressMs)]],
    swipe: [[26.67, 28.75], [at(T.lands), at(T.lands + PANEL.swipeMs)]],
    fly: [[20.83, 26.67, 54.17, 60], [at(T.flyOut), at(T.flyOut + B.flightMs), at(T.flyHome), at(T.flyHome + B.flightMs)]],
    arc: [[20.83, 23.75, 26.67, 54.17, 57.08, 60, 67.08, 69.58, 72.92], [at(T.flyOut), ...then(T.flyOut, [half, half]), at(T.flyHome), ...then(T.flyHome, [half, half]), at(T.replace), ...then(T.replace, B.jumpMs)]],
  };
  for (const [name, [written, worked]] of Object.entries(stops)) {
    written.forEach((w, i) => {
      if (Math.abs(w - worked[i]) > 0.02) throw new Error(`Garden: the ${name} keyframes say ${w}% where TIMING works out to ${worked[i]}%`);
    });
  }
  // A butterfly lands exactly when its flight ends, and the panel is out before any leaves
  // and still out after the last is home.
  const last = Math.max(...B.items.map((b) => b.after ?? 0));
  if (T.lands !== T.flyOut + B.flightMs || T.flyOut < T.panelPops + PANEL.popMs[0] + PANEL.popMs[1] || T.flyHome + last + B.flightMs > T.returnKey) throw new Error('Garden: the butterflies no longer fit between the panel opening and Return');
  // The rays must come round whole, or they would jump when the loop does.
  if (T.loop % (SUN.notchMs * 16) !== 0) throw new Error('Garden: the sun must turn a whole number of times a loop');
}

/** The panel's width at a cover width between 1280 and 1440px. */
const deskAt = (w: 1280 | 1440) => Math.round(PANEL.natural.plain * (w === 1280 ? PANEL.scale.at1280 : PANEL.scale.at1440));
const loops = { animationDuration: ms(TIMING.loop), animationIterationCount: 'infinite', animationFillMode: 'both' } as const;
const g = stylex.create({
  // Where the garden stands on the cover, to the pixel. `--pw` is the
  // panel's width and `--px, --py` its popping corner, for the panel and the butterflies.
  garden: {
    position: 'absolute',
    right: 'clamp(-20px, 2vw, 40px)',
    bottom: { default: -64, '@media (max-width: 760px)': -34 },
    width: { default: 'clamp(250px, 27vw, 420px)', '@media (max-width: 760px)': '220px' },
    '--pw': {
      default: `min(${PANEL.natural.hints * PANEL.scale.wide}px, ${PANEL.room} + ${PANEL.past.wide})`,
      '@media (max-width: 1440px)': `min(clamp(${deskAt(1280)}px, ${deskAt(1280)}px + (100vw - 1280px) * ${+((deskAt(1440) - deskAt(1280)) / 160).toFixed(4)}, ${deskAt(1440)}px), ${PANEL.room} + ${PANEL.past.desk})`,
      '@media (max-width: 1023px)': PANEL.narrow.width,
      '@media (max-width: 760px)': PANEL.phone.width,
    },
    // Each landing butterfly's home: on a wide cover, a narrow one, a phone.
    '--h0x': { default: cq(HOMES[0].home[0]), '@media (max-width: 1023px)': cq(HOMES[0].narrow[0]), '@media (max-width: 760px)': cq(HOMES[0].phone[0]) },
    '--h0y': { default: cq(HOMES[0].home[1]), '@media (max-width: 1023px)': cq(HOMES[0].narrow[1]), '@media (max-width: 760px)': cq(HOMES[0].phone[1]) },
    '--h1x': { default: cq(HOMES[1].home[0]), '@media (max-width: 1023px)': cq(HOMES[1].narrow[0]), '@media (max-width: 760px)': cq(HOMES[1].phone[0]) },
    '--h1y': { default: cq(HOMES[1].home[1]), '@media (max-width: 1023px)': cq(HOMES[1].narrow[1]), '@media (max-width: 760px)': cq(HOMES[1].phone[1]) },
    '--h2x': { default: cq(HOMES[2].home[0]), '@media (max-width: 1023px)': cq(HOMES[2].narrow[0]), '@media (max-width: 760px)': cq(HOMES[2].phone[0]) },
    '--h2y': { default: cq(HOMES[2].home[1]), '@media (max-width: 1023px)': cq(HOMES[2].narrow[1]), '@media (max-width: 760px)': cq(HOMES[2].phone[1]) },
    '--pn': { default: `${PANEL.natural.hints}px`, '@media (max-width: 1440px)': `${PANEL.natural.plain}px`, '@media (max-width: 1023px)': `${PANEL.natural.simple}px` },
    '--pr': { default: PANEL.ratio.wide, '@media (max-width: 1440px)': PANEL.ratio.desk, '@media (max-width: 1023px)': PANEL.ratio.simple },
    '--px': { default: `calc(35.3cqw + ${PANEL.past.wide})`, '@media (max-width: 1440px)': `calc(35.3cqw + ${PANEL.past.desk})`, '@media (max-width: 1023px)': PANEL.narrow.at[0], '@media (max-width: 760px)': PANEL.phone.at[0] },
    '--py': { default: PANEL.bottom, '@media (max-width: 1023px)': PANEL.narrow.at[1], '@media (max-width: 760px)': PANEL.phone.at[1] },
    '--sx': { default: SUN.wide[0], '@media (max-width: 1023px)': SUN.narrow[0], '@media (max-width: 760px)': SUN.phone[0] },
    '--sy': { default: SUN.wide[1], '@media (max-width: 1023px)': SUN.narrow[1], '@media (max-width: 760px)': SUN.phone[1] },
    '--po': { default: '100% 100%', '@media (max-width: 1023px)': PANEL.narrow.corner },
    aspectRatio: `${BOX.width} / ${BOX.height}`,
    zIndex: 1,
    containerType: 'inline-size',
    pointerEvents: 'none',
    color: ink.i12,
    fontFamily: font.mono,
    fontWeight: 450,
    '@media (max-width: 760px)': { right: 0 },
  },
  layer: { position: 'absolute' },
  // A plane: it follows the pointer a little (client.ts sets --mx, --my, −1 to 1), and sways.
  look: { translate: 'calc(var(--mx, 0) * var(--lx)) calc(var(--my, 0) * var(--ly))', transitionProperty: 'translate', transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
  sway: { animationName: { default: sway, [STILL]: 'none' }, animationDuration: ms(DEPTH.swayMs), animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  fill: { position: 'absolute', inset: 0 },
  rel: { position: 'relative' },
  square: { aspectRatio: '1' },
  sprite: { display: 'block', width: '100%', height: 'auto' },

  // The flower: every part is a window onto one sheet, and every joint a box the size of the
  // flower's room that turns on that joint.
  flower: { scale: { default: null, '@media (max-width: 760px)': 'var(--phone)' } },
  part: { position: 'absolute', backgroundRepeat: 'no-repeat' },
  perk: { animationName: { default: perk, [STILL]: 'none' }, ...loops },
  lean: { rotate: { default: null, [STILL]: 'var(--lean)' }, animationName: { default: lean, [STILL]: 'none' }, ...loops },
  open: { animationName: { default: open, [STILL]: 'none' }, animationDelay: 'var(--at)', ...loops },
  swing: { animationName: { default: swing, [STILL]: 'none' }, animationDuration: 'var(--ms)', animationDelay: 'var(--lag)', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  swell: { animationName: { default: swell, [STILL]: 'none' }, animationDuration: 'var(--ms)', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },

  // The sun.
  beam: { animationName: { default: beam, [STILL]: 'none' }, ...loops },
  tick: { animationName: { default: tick, [STILL]: 'none' }, animationDuration: 'var(--turn)', animationTimingFunction: 'steps(16, end)', animationIterationCount: 'infinite' },
  tickBack: { animationName: { default: tick, [STILL]: 'none' }, animationDuration: 'var(--turn)', animationTimingFunction: 'steps(16, end)', animationIterationCount: 'infinite', animationDirection: 'reverse' },
  blink: { animationName: { default: blink, [STILL]: 'none' }, ...loops },
  hop: { transformOrigin: '50% 90%', animationName: { default: hop, [STILL]: 'none' }, ...loops },

  // The panel: paper, square, grained, its shadow pooling below.
  pop: { left: 'calc(var(--px) - var(--pw))', top: 'calc(var(--py) - var(--pw) * var(--pr))', width: 'var(--pw)', height: 'calc(var(--pw) * var(--pr))', transformOrigin: 'var(--po)', animationName: { default: pop, [STILL]: 'none' }, ...loops },
  // The Panel is laid out --pn wide and scaled to --pw: tan(atan2(a, b)) is a ÷ b, two
  // lengths to a number, which a plain calc() can't give.
  fit: { width: 'var(--pn)', transformOrigin: '0 0', scale: 'tan(atan2(var(--pw), var(--pn)))', boxShadow: DEPTH.shadow },
  swipe: { animationName: { default: swipe, [STILL]: 'none' }, animationDelay: 'var(--at)', ...loops },
  // One of Iris's words: the Panel's own pink (panel.added), swiped on under it.
  added: { position: 'relative', display: 'inline-block' },
  addedInk: { position: 'absolute', inset: '0 -2px', backgroundColor: 'rgb(240 134 176 / 0.45)' },
  // The Panel's key hints, hidden at 1440px and under (the rest is the Panel's own `hints`).
  // Its tone names, hidden under 1024px (the rest is the Panel's own `tabs`).
  tabs: { display: { default: 'flex', '@media (max-width: 1023px)': 'none' }, alignItems: 'baseline', gap: 'clamp(14px, 2.6vw, 30px)', flexWrap: 'wrap', paddingBottom: 10, position: 'relative', zIndex: 1 },
  hints: { display: { default: 'flex', '@media (max-width: 1440px)': 'none' }, alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  // Round Replace, to take the press at Return.
  push: { display: 'inline-block', '--press': PANEL.pressScale, animationName: { default: push, [STILL]: 'none' }, ...loops },

  // A butterfly. Under Reduce Motion one with a word sits on it; one without stays home.
  fly: { translate: { default: null, [STILL]: 'var(--still-x) var(--still-y)' }, rotate: { default: null, [STILL]: 'var(--still-tilt)' }, scale: { default: null, [STILL]: 'var(--still-scale)' }, opacity: { default: null, [STILL]: 'var(--still-ink)' }, animationName: { default: fly, [STILL]: 'none' }, animationDelay: 'var(--at)', ...loops },
  arc: { animationName: { default: arc, [STILL]: 'none' }, animationDelay: 'var(--at)', ...loops },
  hover: { animationName: { default: hover, [STILL]: 'none' }, animationDuration: 'var(--hover-ms)', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  flap: { animationName: { default: flap, [STILL]: 'none' }, animationDuration: 'var(--flap)', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
});

// ── The parts ─────────────────────────────────────────────────────────────────────────
/** One of the garden's sprites (sprites.mjs prints them at 6× their dots). Lazy, so they
 *  are only fetched for the cover that is showing. */
function Sprite({ name, dots }: { name: string; dots: number }) {
  return <img src={`/sprite/${name}.png`} width={dots * 6} height={dots * 6} alt="" loading="lazy" decoding="async" {...stylex.props(g.sprite)} />;
}
const HEAD = [0, -flower.stem * FLOWER.stretch] as const;   // the stem's top, where the bloom sits
/** A point in the rig as a share of the flower's room. */
const inRoom = ([x, y]: readonly number[]) => [pct(x - FLOWER.room.left, FLOWER.room.width), pct(y - FLOWER.room.top, FLOWER.room.height)];
/** A joint: a box the size of the flower's room that turns on a point of the rig. */
const on = (point: readonly number[]): React.CSSProperties => ({ transformOrigin: inRoom(point).join(' ') });
/** One part of the flower, its base on `at`, pointing its own way: a window onto the sheet. */
function Part({ name, at, stretch = 1 }: { name: FlowerPart; at: readonly number[]; stretch?: number }) {
  const p = flower.parts[name], sheet = flower.sheet, k = flower.scale;
  const [left, top] = inRoom([at[0] - p.origin[0] / k, at[1] - p.origin[1] / k]);
  return (
    <div {...stylex.props(g.fill)} style={{ ...on(at), rotate: `${p.angle}deg`, scale: stretch === 1 ? undefined : `1 ${stretch}` }}>
      <div
        {...stylex.props(g.part)}
        style={{
          left,
          top,
          width: pct(p.width / k, FLOWER.room.width),
          height: pct(p.height / k, FLOWER.room.height),
          backgroundImage: `url(${sheet.src})`,
          backgroundSize: `${pct(sheet.width, p.width)} ${pct(sheet.height, p.height)}`,
          backgroundPosition: `${pct(p.sheet[0], sheet.width - p.width)} ${pct(p.sheet[1], sheet.height - p.height)}`,
        }}
      />
    </div>
  );
}
/** A swing either side of rest, `lag` behind the stem's. */
const swings = (deg: number, oneWay: number, lag = 0) => vars({ '--deg': `${deg}deg`, '--ms': ms(oneWay), '--lag': ms(-oneWay * 2 + lag) });

/** One plane of the scene: what's on it follows the pointer and sways as far as its depth says. */
function Depth({ plane, children }: { plane: Plane; children: React.ReactNode }) {
  return (
    <div {...stylex.props(g.fill, g.look)} style={vars({ '--lx': `${plane.look[0]}px`, '--ly': `${plane.look[1]}px` })}>
      <div {...stylex.props(g.fill, g.sway)} style={vars({ '--drift': cq(plane.drift) })}>
        {children}
      </div>
    </div>
  );
}

export function Garden() {
  const B = BUTTERFLIES;
  const landing = B.items.filter((b) => b.plane === 'landing');
  /** When a word's butterfly lands, after the first: its marker waits as long. */
  const lag = (word: string) => ms(landing.find((b) => b.word === word)?.after ?? 0);
  /** A butterfly on its plane. */
  const butterfly = (b: Butterfly) => {
    const plane: Plane = b.plane === 'far' ? DEPTH.far : DEPTH.near;
    const size = b.dots * B.dotUnits, half = cq(size / 2);
    /** A point of the panel, across and down it as shares of its width and height. */
    const onPanel = (x: string | number, y: string | number) => [`(var(--px) - var(--pw) * (1 - ${x}))`, `(var(--py) - var(--pw) * var(--pr) * (1 - ${y}))`];
    // Placed where it lands, or where it lives if it never does; `--hx, --hy` is the way home.
    const n = landing.indexOf(b);
    const [x, y] = b.perch ? onPanel(`var(--wx${n}, ${b.perch[0]})`, `var(--wy${n}, ${b.perch[1]})`) : onPanel(b.by![0], b.by![1]);
    const home = b.perch ? [`calc(var(--h${n}x) - ${x})`, `calc(var(--h${n}y) - ${y})`] : ['0px', '0px'];
    const at = ms(b.after ?? 0);
    const landed = { tilt: `${b.perch ? b.perchTilt : b.homeTilt}deg`, scale: b.perch ? `tan(atan2(var(--pw) * var(--pr) * ${b.perched}, ${cq(size)}))` : plane.scale, ink: b.perch ? 1 : plane.ink };
    return (
      <div
        key={b.name}
        {...stylex.props(g.layer, g.square, g.fly)}
        style={{
          left: `calc(${x} - ${half})`,
          top: `calc(${y} - ${half})`,
          width: cq(size),
          ...vars({ '--hx': home[0], '--hy': home[1], '--home-tilt': `${b.homeTilt}deg`, '--home-scale': plane.scale, '--home-ink': plane.ink, '--heading': `${b.heading ?? b.homeTilt}deg`, '--perch-tilt': landed.tilt, '--perched': landed.scale, '--perch-ink': landed.ink, '--at': at }),
          ...vars({ '--still-x': '0px', '--still-y': '0px', '--still-tilt': landed.tilt, '--still-scale': landed.scale, '--still-ink': landed.ink }),
        }}
      >
        <div {...stylex.props(g.arc)} style={vars({ '--arc': cq(-(b.arc ?? 0)), '--jump': cq(-B.jump * plane.scale), '--at': at })}>
          <div {...stylex.props(g.rel, g.hover)} style={vars({ '--hover': cq(B.hover), '--hover-ms': ms(b.hoverMs * plane.pace) })}>
            <div {...stylex.props(g.flap)} style={vars({ '--flap': ms(b.flapMs * plane.pace), '--closed': B.wingsClosed })}>
              <Sprite name={`${b.name}-wings`} dots={b.dots} />
            </div>
            <div {...stylex.props(g.fill)}>
              <Sprite name={`${b.name}-body`} dots={b.dots} />
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div {...stylex.props(g.garden)} aria-hidden="true" data-garden data-loop={TIMING.loop} data-loops={TIMING.loops} data-keys={`${TIMING.keysPress},${TIMING.keyGap},${TIMING.wakes}`}>
      {/* 1. The sun, far away */}
      <Depth plane={DEPTH.sun}>
        <div {...stylex.props(g.layer, g.square)} style={{ left: `calc(var(--sx) - ${cq((SUN.size * DEPTH.sun.scale) / 2)})`, opacity: DEPTH.sun.ink, top: `calc(var(--sy) - ${cq((SUN.size * DEPTH.sun.scale) / 2)})`, width: cq(SUN.size * DEPTH.sun.scale), ...vars({ '--turn': ms(SUN.notchMs * 16) }) }}>
          <div {...stylex.props(g.fill, g.beam)} style={vars({ '--beam': SUN.beam, '--cheer': SUN.cheer })}>
            <div {...stylex.props(g.fill, g.tick)}>
              <Sprite name="sun-rays" dots={44} />
            </div>
            <div {...stylex.props(g.fill, g.blink)}>
              <div {...stylex.props(g.fill, g.tickBack)}>
                <Sprite name="sun-glints" dots={44} />
              </div>
            </div>
          </div>
          <div {...stylex.props(g.fill, g.hop)} style={vars({ '--hop': cq(SUN.hop) })}>
            <Sprite name="sun-face" dots={44} />
          </div>
        </div>
      </Depth>

      {/* 2. The far butterflies, behind the panel */}
      <Depth plane={DEPTH.far}>{B.items.filter((b) => b.plane === 'far').map(butterfly)}</Depth>

      {/* 3 and 4. Iris's panel, popped out of the bloom, and in front of it the butterflies that land on it */}
      <Depth plane={DEPTH.panel}>
        <div {...stylex.props(g.layer, g.pop)} style={vars({ '--from': PANEL.from, '--over': PANEL.over })} inert>
          <div {...stylex.props(g.fit)}>
            <Panel tabs={NOTE.tones} app={{ name: NOTE.app, icon: NOTE.app.toLowerCase() }} hooks={{ tabs: stylex.props(g.tabs) as { className: string }, keys: stylex.props(g.hints) as { className: string }, replaceWrap: stylex.props(g.push) as { className: string } }} seed={51}>
              <p {...stylex.props(panel.message)}>
                {NOTE.words.map((w, k) =>
                  typeof w === 'string' ? (
                    w
                  ) : (
                    <span key={k}>
                      <span {...stylex.props(panel.gone)}>{w.was}</span>{' '}
                      <span {...stylex.props(g.added)} data-word={landing.findIndex((b) => b.word === w.now)}>
                        <span {...stylex.props(g.addedInk, g.swipe)} style={vars({ '--at': lag(w.now) })} />
                        <span {...stylex.props(g.rel)}>{w.now}</span>
                      </span>
                    </span>
                  ),
                )}
              </p>
            </Panel>
          </div>
        </div>
        {landing.map(butterfly)}
      </Depth>

      {/* 5. Iris's flower, closest, part by part: the leaf, the stem carrying the head, the bloom, the ground in front */}
      <div
        {...stylex.props(g.layer, g.flower)}
        data-flower
        style={{
          ...on([0, 0]),
          ...vars({ '--phone': FLOWER.phone }),
          left: pct(FLOWER.foot[0] + FLOWER.room.left * FLOWER.unit, BOX.width),
          top: pct(FLOWER.foot[1] + FLOWER.room.top * FLOWER.unit, BOX.height),
          width: pct(FLOWER.room.width * FLOWER.unit, BOX.width),
          aspectRatio: `${FLOWER.room.width} / ${FLOWER.room.height}`,
        }}
      >
        <div {...stylex.props(g.fill, g.open)} style={{ ...on(FLOWER.leafAt), ...vars({ '--open': `${FLOWER.leafFlick}deg`, '--shut': `${FLOWER.leafFlick * FLOWER.shiverBack}deg`, '--swell': 1, '--at': '0ms' }) }}>
          <div {...stylex.props(g.fill, g.swing)} style={{ ...on(FLOWER.leafAt), ...swings(FLOWER.leaf.deg, FLOWER.leaf.ms, FLOWER.leaf.lagMs) }}>
            <Part name="leaf" at={FLOWER.leafAt} />
          </div>
        </div>
        <div {...stylex.props(g.fill, g.perk)} style={{ ...on([0, 0]), ...vars({ '--perk': FLOWER.perk }) }}>
          <div {...stylex.props(g.fill, g.swing)} style={{ ...on([0, 0]), ...swings(FLOWER.sway.deg, FLOWER.sway.ms) }}>
            <Part name="stem" at={[0, 0]} stretch={FLOWER.stretch} />
            <div {...stylex.props(g.fill, g.lean)} style={{ ...on(HEAD), ...vars({ '--lean': `${FLOWER.leanDeg}deg`, '--rock': `${FLOWER.rockDeg}deg` }) }}>
              <div {...stylex.props(g.fill, g.swing)} style={{ ...on(HEAD), ...swings(FLOWER.head.deg, FLOWER.head.ms, FLOWER.head.lagMs) }}>
                {FLOWER.bloom.map((b, i) =>
                  'open' in b ? (
                    <div key={b.part} {...stylex.props(g.fill, g.open)} style={{ ...on(HEAD), ...vars({ '--open': `${b.open}deg`, '--shut': `${b.open * FLOWER.shiverBack}deg`, '--swell': b.swell, '--at': ms(b.ring * FLOWER.openGap) }) }}>
                      <div {...stylex.props(g.fill, g.swing)} style={{ ...on(HEAD), ...swings(b.breathe, b.ms, i * 230) }}>
                        <Part name={b.part} at={HEAD} />
                      </div>
                    </div>
                  ) : (
                    <div key={b.part} {...stylex.props(g.fill, g.swell)} style={{ ...on(HEAD), ...vars({ '--swell': FLOWER[b.part].swell, '--ms': ms(FLOWER[b.part].ms) }) }}>
                      <Part name={b.part} at={HEAD} />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
        <Part name="ground" at={[0, 0]} />
      </div>
    </div>
  );
}
