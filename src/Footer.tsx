// The foot. The page ends on the sky with Iris's name, big, cut off by the page's edge, and the
// zine's back cover: a torn-off stub with the keys on it. As the page lifts off it, night turns
// to day: the sun climbs out from behind the S, rough rings spread from it like warmth, then the
// butterflies fly in and land on the letters, each letter dipping a little under its butterfly. Over the foot your pointer
// is a butterfly too (client.ts). ⌃ ⌥ G here plays it again.
//
// Nothing here changes size: everything that moves is drawn over the wordmark's fixed box.
//
// Contrast: ink on sky 6.4:1; the wordmark is a logo.

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD: night to day, as the page lifts off the foot
 *
 * Act one follows the scroll, both ways. Its playhead is how much of the foot shows
 * (--reveal, 0 covered … 1 shown); scroll back up and it plays backwards.
 *
 *   0.00   night: the sky deep blue-black, paper stars twinkling, the sun down
 *          behind the S, IRIS a silhouette
 *   0.10   the stars start to go out, the farthest first
 *   0.15   dawn: a soft pale-blue halo comes up round the sun, still behind the S
 *   0.30   the sun's rays peek over the S
 *   0.35   the night lifts, slowly
 *   0.55   the sun half out of the S; its halo at its brightest
 *   0.70   the sun clears the S; the rings start to spread round it, inner first
 *   0.80   the halo softens as the sky turns blue
 *   0.90   day: blue sky, sun up, every ring out, the stars gone
 *
 * Act two plays once it's day (0.90 shown), in ms from then (client.ts):
 *
 *    200ms   the butterflies fly in from the sky, one by one (260ms apart), each on
 *            its own arc, and land on I, R and S; the letter dips as it lands
 *   1500ms   all landed; then each wanders off on its own: every 1.5–3s a random
 *            spot in the sky over the letters, tilting the way it goes, now and then
 *            pausing
 *
 * Under Reduce Motion it is simply day: the sky blue, the sun up, the butterflies on
 * their letters. ⌃ ⌥ G at the foot plays act two again.
 * ───────────────────────────────────────────────────────── */
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { links } from './content';
import { rng } from './pen';
import { GetIris, KeyRow, PageTitle, PenLink, Platforms, Wordmark } from './parts';
import { font, ink, tex } from './tokens.stylex';

export const TIMING = {
  flyIn:       200,    // the first butterfly sets off, once the sun is up
  flyGap:      260,    // each next one
};

/* The wordmark, in its own units: its box is MARK.w × MARK.h at 100px type. Read off the drawn
 * letters (not their text boxes): the I's top at (18, 12), the R's crest (66, 14), the S's
 * top (138, 12). */
const MARK = { w: 155, h: 100, size: 'clamp(150px, 27vw, 420px)', crop: 0.26 };   // crop: the share cut off by the page's edge

/* The sun, behind the S */
const SUN = {
  x: 140, y: -6, size: 34,   // where it ends up
  down: 240,                 // how far below its place it sits when set, as a share of its size: behind the S
  turnMs: 24000,             // one turn of the rays
};

/* The butterflies: where each lands (on a letter's top), where it comes from, and the arc's
 * highest point on the way, as shares of its own size. `letter` is the letter it lands on. */
const BUTTERFLIES = {
  flightMs: 1150,
  flapMs: 150,      // wings in flight
  restFlapMs: 900,  // wings once landed
  items: [
    { sprite: 'monarch', letter: 0, x: 18,  y: 7, size: 13, tilt: -10, from: ['-420%', '-520%'], arc: ['-160%', '-260%'] },
    { sprite: 'rose',    letter: 1, x: 64,  y: 9, size: 11, tilt: 12,  from: ['260%', '-640%'],  arc: ['140%', '-300%'] },
    { sprite: 'white',   letter: 3, x: 128, y: 8, size: 10, tilt: 6,   from: ['620%', '-380%'],  arc: ['320%', '-240%'] },
  ],
};

/* The rings round the sun: rough brush loops in the pale sky ink, spreading out from it */
const RINGS = {
  count: 6,
  first: 30,         // the smallest ring's radius, in wordmark units
  gap: 17,           // between rings
  width: 5.5,        // the brush's width
  wobble: 2.4,       // how far a loop strays from round
};

/* The back-cover stub */

/* Act one's beats, as shares of the foot shown: each part moves from `from` to `to`. */
const SCROLL = {
  starsOut:  { from: 0.10, to: 0.55 },   // the stars go out (the farthest first)
  dawnIn:    { from: 0.15, to: 0.55 },   // the sun's halo warms up
  sunRises:  { from: 0.30, to: 0.75 },   // the sun climbs out of the S
  nightLifts:{ from: 0.35, to: 0.90 },   // the dark goes
  ringsOut:  { from: 0.70, to: 0.90 },   // the rings spread, inner first
  dawnOut:   { from: 0.80, to: 0.95 },   // and softens as it's day
  day:       0.90,                       // act two starts
};
/** Each beat as 0 → 1 while the playhead goes from its `from` to its `to` (held at 0 or 1 outside),
 *  written out so StyleX can read it. */
const BEAT = {
  starsOut: `clamp(0, (var(--reveal, 1) - ${SCROLL.starsOut.from}) / (${SCROLL.starsOut.to} - ${SCROLL.starsOut.from}), 1)`,
  dawnIn: `clamp(0, (var(--reveal, 1) - ${SCROLL.dawnIn.from}) / (${SCROLL.dawnIn.to} - ${SCROLL.dawnIn.from}), 1)`,
  sunRises: `clamp(0, (var(--reveal, 1) - ${SCROLL.sunRises.from}) / (${SCROLL.sunRises.to} - ${SCROLL.sunRises.from}), 1)`,
  nightLifts: `clamp(0, (var(--reveal, 1) - ${SCROLL.nightLifts.from}) / (${SCROLL.nightLifts.to} - ${SCROLL.nightLifts.from}), 1)`,
  ringsOut: `clamp(0, (var(--reveal, 1) - ${SCROLL.ringsOut.from}) / (${SCROLL.ringsOut.to} - ${SCROLL.ringsOut.from}), 1)`,
  dawnOut: `clamp(0, (var(--reveal, 1) - ${SCROLL.dawnOut.from}) / (${SCROLL.dawnOut.to} - ${SCROLL.dawnOut.from}), 1)`,
};

/* The foot coming forward as it's uncovered */
const REVEAL = { rise: 70, shrink: 0.05, playAt: SCROLL.day };

/* The night */
const NIGHT = { color: 'rgb(26 28 54)', depth: 0.78 };   // the dark over the sky, at its deepest

/* The stars: paper ✻s scattered in the night sky (shares of the foot), each going out in turn */
const STARS = {
  twinkleMs: 1800,
  items: [
    { x: 54, y: 10, size: 13, k: 0.0 },
    { x: 68, y: 22, size: 9,  k: 0.15 },
    { x: 78, y: 6,  size: 16, k: 0.3 },
    { x: 90, y: 18, size: 10, k: 0.45 },
    { x: 61, y: 38, size: 8,  k: 0.6 },
    { x: 96, y: 40, size: 12, k: 0.75 },
    { x: 46, y: 26, size: 7,  k: 0.9 },
  ],
};

/* The dawn: a soft halo round the sun in a paler sky blue, rising with it */
const HALO = { color: 'rgb(170 200 240)', reach: '-120%', strength: 0.35 };   // a pale sky blue, soft

/* The butterflies wandering once they've landed: a random spot in this box (shares of the
 * butterfly's own size, from where it landed) every so often (client.ts) */
export const WANDER = { x: [-520, 520], y: [-560, -40], hopMs: [1500, 3000], pause: 0.25, tiltDeg: 22 };

/* The letter under a butterfly, dipping as it lands */
export const DIP = { by: '0.05em', ms: 420 };

const STILL = '@media (prefers-reduced-motion: reduce)';
const MOBILE = '@media (max-width: 760px)';
const pct = (v: number, of: number) => `${+((v / of) * 100).toFixed(3)}%`;
const ms = (v: number) => `${Math.round(v)}ms`;
const vars = (v: Record<string, string | number>) => v as React.CSSProperties;

const turn = stylex.keyframes({ from: { rotate: '0deg' }, to: { rotate: '360deg' } });
const flyIn = stylex.keyframes({
  '0%': { translate: 'var(--fx) var(--fy)', rotate: '-30deg', opacity: 0 },
  '15%': { opacity: 1 },
  '55%': { translate: 'var(--ax) var(--ay)', rotate: '18deg' },
  '85%': { translate: '0 -18%', rotate: '-6deg' },
  '100%': { translate: '0 0', rotate: '0deg', opacity: 1 },
});
const twinkle = stylex.keyframes({ from: { scale: '0.7', opacity: 0.55 }, to: { scale: '1.1', opacity: 1 } });
const flap = stylex.keyframes({ from: { scale: '1 1' }, to: { scale: '0.3 1' } });
const rest = stylex.keyframes({ '0%': { scale: '1 1' }, '8%': { scale: '0.45 1' }, '16%': { scale: '1 1' }, '100%': { scale: '1 1' } });

const f = stylex.create({
  // Pinned to the bottom of the window, under the page (Page.tsx's sheet), so the page lifts off
  // it as you reach the end.
  foot: {
    position: 'sticky',
    bottom: 0,
    zIndex: 0,
    overflow: 'clip',
    backgroundColor: ink.sky,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    color: ink.i12,
  },
  // As it's uncovered (--reveal 0 → 1, client.ts) it comes forward: up, to full size, out of
  // the page's shade.
  depth: {
    transformOrigin: '50% 100%',
    translate: `0 calc((1 - var(--reveal, 1)) * ${REVEAL.rise}px)`,
    scale: `calc(1 - (1 - var(--reveal, 1)) * ${REVEAL.shrink})`,
    [STILL]: { translate: 'none', scale: 'none' },
  },
  // The night over the sky, lifting as the sun comes up. Over everything, so the sun climbs
  // out of the dark too.
  shade: { position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', backgroundColor: NIGHT.color, opacity: { default: `calc((1 - ${BEAT.nightLifts}) * ${NIGHT.depth})`, [STILL]: 0 } },
  // A star: paper ✻, going out in its turn (--k), twinkling till then.
  star: {
    position: 'absolute',
    zIndex: 4,
    pointerEvents: 'none',
    color: ink.paper,
    fontFamily: font.mono,
    fontWeight: 600,
    lineHeight: 1,
    translate: '-50% -50%',
    opacity: { default: `clamp(0, 1 - (${BEAT.starsOut} * 1.6 - var(--k) * 0.6), 1)`, [STILL]: 0 },
  },
  twinkle: { display: 'block', animationName: { default: twinkle, [STILL]: 'none' }, animationDuration: ms(STARS.twinkleMs), animationDelay: 'var(--tw)', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  wrap: {
    width: '100%',
    maxWidth: 1280,
    marginInline: 'auto',
    paddingInline: 'clamp(20px, 5vw, 72px)',
    paddingTop: 'clamp(40px, 5vw, 64px)',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '24px clamp(24px, 4vw, 56px)',
    alignItems: 'end',
    [MOBILE]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  // The last call.
  // Above the wordmark's layers, so on a phone, where the wordmark sits under it, the sun's rings
  // go behind the stub instead of being drawn over its words.
  call: { position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start', paddingBottom: 'clamp(28px, 3vw, 40px)' },
  cta: { display: 'flex', alignItems: 'center', gap: '14px 22px', flexWrap: 'wrap' },
  ctaMeta: { fontSize: 12.5, lineHeight: 1.5 },
  links: { display: 'flex', flexWrap: 'wrap', gap: '12px 26px', alignItems: 'center' },

  // The wordmark, cut off by the page's bottom edge, the sun behind it, butterflies on it.
  markCell: { position: 'relative', justifySelf: 'end', maxWidth: '100%', [MOBILE]: { justifySelf: 'center' } },
  mark: { position: 'relative', display: 'block', lineHeight: 0, marginBottom: `calc(-${MARK.crop} * ${MARK.size})` },
  letters: { display: 'block', position: 'relative', zIndex: 1 },
  layer: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  behind: { zIndex: 0 },
  front: { zIndex: 2 },
  sprite: { position: 'absolute', inset: 0, width: '100%', height: '100%' },

  // The sun follows the scroll: down behind the S while the foot is covered, up as it shows.
  // The halo behind the sun: the dawn, brightest while it's rising.
  halo: { position: 'absolute', inset: HALO.reach, borderRadius: '50%', pointerEvents: 'none', backgroundImage: `radial-gradient(closest-side, ${HALO.color}, transparent)`, opacity: { default: `calc(${BEAT.dawnIn} * (1 - ${BEAT.dawnOut} * 0.6) * ${HALO.strength})`, [STILL]: 0.15 } },
  sun: { position: 'absolute', translate: { default: `0 calc((1 - ${BEAT.sunRises}) * ${SUN.down}%)`, [STILL]: 'none' } },
  // A wandering butterfly drifts to each new spot; the script sets where and how long.
  wander: { transitionProperty: 'translate, rotate', transitionDuration: 'var(--d, 2000ms)', transitionTimingFunction: 'cubic-bezier(0.45, 0.05, 0.3, 1)' },
  // Each ring spreads as the sun climbs, the inner ones first (--k: its place, 0 … 1).
  rings: {
    position: 'absolute',
    overflow: 'visible',
    transformOrigin: '50% 50%',
    scale: { default: `calc(0.25 + 0.75 * clamp(0, (${BEAT.ringsOut} - var(--k) * 0.5) * 2, 1))`, [STILL]: 'none' },
    opacity: { default: `clamp(0, (${BEAT.ringsOut} - var(--k) * 0.5) * 2.5, 1)`, [STILL]: 1 },
  },

  // The zine's back cover: a stub torn off along a perforation, the keys on it.
  stub: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    gap: '4px 18px',
    alignItems: 'center',
    padding: '12px 16px 12px 22px',
    backgroundColor: ink.paper,
    color: ink.i12,
    transform: 'rotate(-1.2deg)',
    boxShadow: '0 1px 1px rgb(42 26 22 / 0.08), 0 10px 22px -12px rgb(42 26 22 / 0.4)',
    // Perforated along its left edge: a row of bites out of the paper.
    maskImage: 'radial-gradient(circle at 0 6px, transparent 3.5px, black 4px)',
    maskSize: '100% 12px',
    maskRepeat: 'repeat-y',
    WebkitMaskImage: 'radial-gradient(circle at 0 6px, transparent 3.5px, black 4px)',
    WebkitMaskSize: '100% 12px',
    WebkitMaskRepeat: 'repeat-y',
  },
  perf: { position: 'absolute', left: 9, top: 6, bottom: 6, borderLeftWidth: 1.5, borderLeftStyle: 'dashed', borderLeftColor: 'rgb(42 26 22 / 0.45)' },
  stubWord: { fontFamily: font.brush, fontSize: 26, lineHeight: 1, textTransform: 'none', letterSpacing: 0, fontWeight: 400 },
  keys: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  keysNote: { fontFamily: font.brush, fontSize: 17, lineHeight: 1 },
  stubSmall: { fontSize: 10.5, lineHeight: 1.5, maxWidth: '30ch', margin: 0 },
  rays: {
    animationName: { default: turn, [STILL]: 'none' },
    animationDuration: ms(SUN.turnMs),
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  fly: {
    position: 'absolute',
    animationName: { default: flyIn, [STILL]: 'none' },
    animationDuration: ms(BUTTERFLIES.flightMs),
    animationDelay: 'var(--at)',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.35, 0.6, 0.3, 1)',
  },
  // In flight the wings beat fast; landed, a slow beat now and then (the second animation
  // takes over when the flight ends).
  wings: {
    animationName: { default: `${flap}, ${rest}`, [STILL]: 'none' },
    animationDuration: `${ms(BUTTERFLIES.flapMs)}, ${ms(BUTTERFLIES.restFlapMs * 4)}`,
    animationDelay: `var(--at), calc(var(--at) + ${BUTTERFLIES.flightMs}ms)`,
    animationIterationCount: `${Math.round(BUTTERFLIES.flightMs / BUTTERFLIES.flapMs)}, infinite`,
    animationDirection: 'alternate, normal',
    animationTimingFunction: 'ease-in-out',
  },
});

/** Each ring a loop drawn by hand: its radius strays as it goes round, and it overshoots where
 *  it started, as a brush does. Centred on 0,0, in wordmark units. */
function roughRings() {
  const r = rng(71);
  return Array.from({ length: RINGS.count }, (_, k) => {
    const base = RINGS.first + k * RINGS.gap, n = 40, start = r() * Math.PI * 2;
    const phase = [r() * 6, r() * 6, r() * 6];
    let d = '';
    for (let i = 0; i <= n + 3; i++) {
      const t = start + (i / n) * Math.PI * 2;
      const rad = base + RINGS.wobble * (Math.sin(t * 3 + phase[0]) * 0.6 + Math.sin(t * 5 + phase[1]) * 0.3 + Math.sin(t * 2 + phase[2]) * 0.4) + (i > n ? 1.6 : 0);
      d += `${i ? 'L' : 'M'}${(Math.cos(t) * rad).toFixed(2)},${(Math.sin(t) * rad).toFixed(2)}`;
    }
    return d;
  });
}

/** The zine's back cover, torn off: the keys and the small print. */
function Stub() {
  return (
    <div {...stylex.props(f.stub)}>
      <span aria-hidden {...stylex.props(f.perf)} />
      {/* Where a back cover has its barcode, the one thing to take away: the keys. */}
      <span {...stylex.props(f.keys)}>
        <KeyRow keys={['⌃', '⌥', 'G']} />
        <span {...stylex.props(f.keysNote)}>in any text box</span>
      </span>
      <span>
        <span {...stylex.props(f.stubWord)}>
          Made by Abhishek
        </span>
        <p {...stylex.props(f.stubSmall)}>Gemma 4 (Gemma Terms of Use), Apple MLX (MIT), fonts under the SIL OFL. MIT license.</p>
      </span>
    </div>
  );
}

/** The giant wordmark with the sun behind it and the butterflies that land on it. */
function Mark() {
  const at = (x: number, y: number, size: number): React.CSSProperties => ({ left: pct(x - size / 2, MARK.w), top: pct(y - size / 2, MARK.h), width: pct(size, MARK.w), aspectRatio: '1' });
  return (
    <span
      {...stylex.props(f.mark)}
      data-reveal
      data-landings={BUTTERFLIES.items.map((b, i) => `${b.letter}:${TIMING.flyIn + i * TIMING.flyGap + BUTTERFLIES.flightMs}`).join(',')}
      data-dip={`${DIP.by},${DIP.ms}`}
      data-wander-box={JSON.stringify(WANDER)}
    >
      <span aria-hidden {...stylex.props(f.layer, f.behind)}>
        {roughRings().map((d, i) => {
          const R = RINGS.first + i * RINGS.gap + RINGS.wobble + RINGS.width;
          return (
            <svg
              key={i}
              viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
              {...stylex.props(f.rings)}
              style={{ ...at(SUN.x, SUN.y, R * 2), height: 'auto', ...vars({ '--k': i / (RINGS.count - 1) }) }}
            >
              <path d={d} fill="none" stroke="rgb(150 184 230)" strokeWidth={RINGS.width} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          );
        })}
        <span {...stylex.props(f.sun)} style={at(SUN.x, SUN.y, SUN.size)}>
          <span {...stylex.props(f.halo)} />
          <img src="/sprite/sun-rays.png" alt="" loading="lazy" decoding="async" {...stylex.props(f.sprite, f.rays)} />
          <img src="/sprite/sun-glints.png" alt="" loading="lazy" decoding="async" {...stylex.props(f.sprite, f.rays)} />
          <img src="/sprite/sun-face.png" alt="" loading="lazy" decoding="async" {...stylex.props(f.sprite)} />
        </span>
      </span>
      <span {...stylex.props(f.letters)} data-foot-mark>
        <Wordmark size={MARK.size} />
      </span>
      <span aria-hidden {...stylex.props(f.layer, f.front)}>
        {BUTTERFLIES.items.map((b, i) => (
          <span
            key={b.sprite}
            {...stylex.props(f.fly)}
            style={{
              ...at(b.x, b.y, b.size),
              ...vars({ '--at': ms(TIMING.flyIn + i * TIMING.flyGap), '--fx': b.from[0], '--fy': b.from[1], '--ax': b.arc[0], '--ay': b.arc[1] }),
            }}
          >
            <span {...stylex.props(f.sprite, f.wander)} data-wander>
              <span {...stylex.props(f.sprite)} style={{ rotate: `${b.tilt}deg` }}>
                <img src={`/sprite/${b.sprite}-wings.png`} alt="" loading="lazy" decoding="async" {...stylex.props(f.sprite, f.wings)} data-wander-wings />
                <img src={`/sprite/${b.sprite}-body.png`} alt="" loading="lazy" decoding="async" {...stylex.props(f.sprite)} />
              </span>
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

export function Footer() {
  return (
    <footer {...stylex.props(f.foot)} aria-labelledby="foot-title" data-foot data-play-at={REVEAL.playAt}>
      <span aria-hidden {...stylex.props(f.shade)} />
      {STARS.items.map((st, i) => (
        <span key={i} aria-hidden {...stylex.props(f.star)} style={{ left: `${st.x}%`, top: `${st.y}%`, fontSize: st.size, ...vars({ '--k': st.k, '--tw': ms(-i * 530) }) }}>
          <span {...stylex.props(f.twinkle)}>✻</span>
        </span>
      ))}
      <div {...stylex.props(f.wrap, f.depth)}>
        <div {...stylex.props(f.call)}>
          <PageTitle id="foot-title" lines={['Go write', 'something']} small />
          <div {...stylex.props(f.cta)}>
            <GetIris ribbon="paper" />
            <span {...stylex.props(f.ctaMeta)}>
              <Platforms />
            </span>
          </div>
          <nav aria-label="More about Iris" {...stylex.props(f.links)}>
            <PenLink ribbon="paper" out={false} href="#install">Install</PenLink>
            <PenLink ribbon="paper" out={false} href="#questions">Questions</PenLink>
            <PenLink ribbon="paper" out={false} href="#private">Privacy</PenLink>
            <PenLink ribbon="paper" href={links.code}>The code</PenLink>
            <PenLink ribbon="paper" href={links.problem}>Report a problem</PenLink>
          </nav>
          <Stub />
        </div>
        <div {...stylex.props(f.markCell)}>
          <Mark />
        </div>
      </div>
      {/* The pointer, as a butterfly, while it's over the foot (client.ts). */}
      <span aria-hidden data-cursor-fly hidden style={{ position: 'fixed', left: 0, top: 0, width: 34, height: 34, pointerEvents: 'none', zIndex: 40 }}>
        <img data-cursor-wings src="/sprite/rose-wings.png" alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <img src="/sprite/rose-body.png" alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </span>
    </footer>
  );
}
