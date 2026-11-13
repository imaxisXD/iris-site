// The foot: Iris's pink foot (`PageFoot`, the band at the bottom of every Settings page),
// printed through the screen like the other plates, ink words on it. Its last line is the
// zine's sign-off, written in a hurry, and Iris proofreads it as you arrive: each fix is
// written in above its slip, the slip is struck through, then the fixes drop into place and
// the line reads clean. ⌃⌥G beside it does it again.
//
// Nothing moves the page: every word Iris touches sits in a slot as wide as the longer of its
// two versions, both stacked in it, and the line's height leaves room for the fixes written
// above, so the line never reflows and the foot never changes height.
//
// Contrast on plate pink (rgb 236 110 176): ink words 5.9:1, past WCAG AA at every size; the
// focus ring is ink (global.css). Paper markers under ink words: 16:1.

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each time is ms after the line scrolls into view (client.ts).
 *
 *     0ms   the sign-off as written: "thanks for reading. now go write somthing in
 *           ur own voice"
 *   250ms   Iris's flower pops up at the end of the line, 0 → 1.1 → 1 from its foot
 *   900ms   proofreading, one slip every 420ms (five slips):
 *             the pen strikes the slip through, left to right
 *             its fix is written in above it, small, on a paper marker
 *             the flower nods at it
 *  3200ms   Replace: the slips fall away and the fixes drop into place, a wave left to
 *           right (90ms apart), each over-shooting a touch and settling
 *  3950ms   a tick lands after "voice.", 0 → 1.25 → 1
 *  4100ms   a butterfly flies in from the upper right and settles on the flower
 *
 * Under Reduce Motion the line is simply the fixed one, the butterfly already on the
 * flower. Without the script it plays once.
 * ───────────────────────────────────────────────────────── */
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { diff, links } from './content';
import { BrushButton, KeyRow, PenLink, Picture } from './parts';
import { HandTick, markerMask, PenRule, Printed } from './pen';
import { font, ink, tex } from './tokens.stylex';

const TIMING = {
  flowerPops:  250,    // the flower comes up at the end of the line
  firstSlip:   900,    // the first slip is struck, its fix written in above
  slipGap:     420,    // each next slip
  replace:     3200,   // the fixes drop into place, left to right
  waveGap:     90,     // between one word dropping and the next
  tick:        3950,   // the tick lands after the line
  butterfly:   4100,   // the butterfly sets off for the flower
};

/* The line, as written and as Iris fixes it */
const LINE = {
  // Every fix is at least as wide as its slip, so the clean line has no gaps in it.
  draft: 'thanks for reading. now go write somthing in ur own voice',
  fixed: 'Thanks for reading. Now go write something in your own voice.',
  lineHeight: 1.85,   // room above every line for the fixes written in over it
};

/* A slip and its fix */
const SLIP = {
  strikeMs:   240,    // the pen drawn through the slip
  writeMs:    320,    // the fix written in above it, left to right
  writeAfter: 140,    // after the strike starts
  swipeMs:    280,    // the paper marker under the fix
  swipeAfter: 180,
  above:      '-0.92em',   // where the fix is written, over its slip
  aboveScale: 0.62,        // and how small
  aboveTilt:  '-5deg',
  dropMs:     560,    // the fix dropping into place, with a little overshoot
  fallMs:     280,    // the slip falling away, just ahead of its fix
  fallLead:   80,     // how far ahead
  liftMs:     300,    // the marker lifting off as the fix lands
};

/* Iris's flower at the end of the line */
const FLOWER = { popMs: 620, nodDeg: -9, swayDeg: 3, swayMs: 2400 };

/* The tick, and the butterfly that comes to see */
const TICK = { popMs: 420, size: '0.62em' };
const FLY = { flightMs: 900, from: 'translate(2.6em, -2.2em) rotate(24deg)', wingMs: 150, size: '0.62em' };

const STILL = '@media (prefers-reduced-motion: reduce)';
const MOBILE = '@media (max-width: 760px)';
const ms = (v: number) => `${v}ms`;

const pop = stylex.keyframes({ '0%': { scale: '0' }, '65%': { scale: '1.1' }, '100%': { scale: '1' } });
const sway = stylex.keyframes({ from: { rotate: `-${FLOWER.swayDeg}deg` }, to: { rotate: `${FLOWER.swayDeg}deg` } });
const nod = stylex.keyframes({ '0%': { rotate: '0deg' }, '35%': { rotate: `${FLOWER.nodDeg}deg` }, '100%': { rotate: '0deg' } });
const strike = stylex.keyframes({ from: { backgroundSize: '0% 2px' }, to: { backgroundSize: '100% 2px' } });
const write = stylex.keyframes({ from: { clipPath: 'inset(-0.4em 100% -0.4em -0.2em)' }, to: { clipPath: 'inset(-0.4em -0.4em -0.4em -0.2em)' } });
const drop = stylex.keyframes({
  '0%': { transform: `translateY(${SLIP.above}) scale(${SLIP.aboveScale}) rotate(${SLIP.aboveTilt})` },
  '70%': { transform: 'translateY(0.06em) scale(1.05) rotate(0deg)' },
  '100%': { transform: 'none' },
});
const fall = stylex.keyframes({ from: { opacity: 1, transform: 'none' }, to: { opacity: 0, transform: 'translateY(0.4em) rotate(7deg)' } });
const swipe = stylex.keyframes({ from: { clipPath: 'inset(0 100% 0 0)' }, to: { clipPath: 'inset(0 0 0 0)' } });
const lift = stylex.keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });
const flyIn = stylex.keyframes({ from: { transform: FLY.from, opacity: 0 }, '20%': { opacity: 1 }, to: { transform: 'none', opacity: 1 } });
const flap = stylex.keyframes({ from: { scale: '1 1' }, to: { scale: '0.3 1' } });

const f = stylex.create({
  foot: {
    position: 'relative',
    backgroundColor: ink.platePink,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    color: ink.i12,
    marginTop: 'clamp(64px, 8vw, 112px)',
  },
  wrap: { width: '100%', maxWidth: 1280, marginInline: 'auto', paddingInline: 'clamp(20px, 5vw, 72px)', paddingBlock: 'clamp(30px, 3.5vw, 44px) 20px' },
  top: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '28px 56px', alignItems: 'end', [MOBILE]: { gridTemplateColumns: '1fr' } },

  // The sign-off Iris proofreads.
  line: { margin: 0, fontFamily: font.brush, fontWeight: 400, fontSize: 'clamp(26px, 2.7vw, 38px)', lineHeight: LINE.lineHeight, maxWidth: '34ch' },
  // A word Iris touches: both versions stacked in one slot, as wide as the longer.
  slot: { display: 'inline-grid', verticalAlign: 'baseline', justifyItems: 'start' },
  layer: { gridArea: '1 / 1', whiteSpace: 'nowrap' },
  // The slip: struck through, then falling away. At rest (and under Reduce Motion) gone.
  was: {
    justifySelf: 'center',   // the room for a longer fix shared either side, not one gap after it
    opacity: 0,
    backgroundImage: 'linear-gradient(rgb(42 26 22), rgb(42 26 22))',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 58%',
    backgroundSize: '100% 2px',
    animationName: { default: `${strike}, ${fall}`, [STILL]: 'none' },
    animationDuration: `${ms(SLIP.strikeMs)}, ${ms(SLIP.fallMs)}`,
    animationDelay: `var(--at), calc(var(--drop) - ${SLIP.fallLead}ms)`,
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.55, 0, 0.75, 0.3)',
  },
  // The fix: written in above its slip, then dropping into place. At rest, just the word.
  now: {
    position: 'relative',
    isolation: 'isolate',
    paddingInline: 2,
    transformOrigin: '0 100%',
    animationName: { default: `${write}, ${drop}`, [STILL]: 'none' },
    animationDuration: `${ms(SLIP.writeMs)}, ${ms(SLIP.dropMs)}`,
    animationDelay: `calc(var(--at) + ${SLIP.writeAfter}ms), var(--drop)`,
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.34, 1.3, 0.64, 1)',
  },
  marker: { position: 'absolute', left: -3, right: -4, bottom: '0.12em', height: '0.55em', zIndex: -1, opacity: 0, animationName: { default: lift, [STILL]: 'none' }, animationDuration: ms(SLIP.liftMs), animationDelay: 'var(--drop)', animationFillMode: 'both' },
  swipe: { position: 'absolute', inset: 0, animationName: { default: swipe, [STILL]: 'none' }, animationDuration: ms(SLIP.swipeMs), animationDelay: `calc(var(--at) + ${SLIP.swipeAfter}ms)`, animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' },

  // The tick after the line.
  tick: { display: 'inline-block', marginLeft: '0.18em', verticalAlign: '0.05em', transformOrigin: '30% 90%', animationName: { default: pop, [STILL]: 'none' }, animationDuration: ms(TICK.popMs), animationDelay: ms(TIMING.tick), animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.34, 1.5, 0.64, 1)' },
  // The flower: pops up, nods at each fix, sways.
  flower: { position: 'relative', display: 'inline-block', width: '1.05em', marginLeft: '0.1em', verticalAlign: '-0.12em', transformOrigin: '45% 97%', animationName: { default: pop, [STILL]: 'none' }, animationDuration: ms(FLOWER.popMs), animationDelay: ms(TIMING.flowerPops), animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' },
  nod: { display: 'block', transformOrigin: '45% 97%', animationName: { default: nod, [STILL]: 'none' }, animationDuration: ms(TIMING.slipGap), animationDelay: ms(TIMING.firstSlip), animationIterationCount: 'var(--slips)', animationTimingFunction: 'ease-in-out' },
  sway: { display: 'block', transformOrigin: '45% 97%', animationName: { default: sway, [STILL]: 'none' }, animationDuration: ms(FLOWER.swayMs), animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  flowerImg: { width: '100%' },
  // The butterfly that comes to see, landing on the bloom.
  fly: { position: 'absolute', right: '-0.18em', top: '-0.28em', width: FLY.size, height: FLY.size, transformOrigin: '50% 50%', animationName: { default: flyIn, [STILL]: 'none' }, animationDuration: ms(FLY.flightMs), animationDelay: ms(TIMING.butterfly), animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.3, 0.7, 0.3, 1)' },
  flyPart: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  wings: { animationName: { default: flap, [STILL]: 'none' }, animationDuration: ms(FLY.wingMs), animationDelay: ms(TIMING.butterfly), animationIterationCount: Math.round(FLY.flightMs / FLY.wingMs) + 1, animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  again: { display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 4, padding: '4px 0', borderWidth: 0, backgroundColor: 'transparent', fontFamily: font.mono, fontSize: 12.5, color: ink.i12, cursor: 'pointer', [STILL]: { display: 'none' } },

  cta: { display: 'flex', alignItems: 'center', gap: '14px 22px', flexWrap: 'wrap' },
  ctaMeta: { fontSize: 12.5, lineHeight: 1.5 },

  rule: { marginTop: 'clamp(20px, 2.6vw, 30px)' },
  bottom: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 40px', flexWrap: 'wrap', paddingTop: 18 },
  links: { display: 'flex', flexWrap: 'wrap', gap: '12px 26px', alignItems: 'center' },
  maker: { display: 'flex', alignItems: 'flex-end', gap: 12 },
  stepped: { fontSize: 13, lineHeight: 1.4, fontWeight: 600, display: 'flex', flexDirection: 'column' },
  name: { fontFamily: font.brush, fontSize: 30, lineHeight: 0.9 },
  credits: { fontSize: 11.5, lineHeight: 1.6, margin: 0, marginTop: 14, maxWidth: '96ch' },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
});

/** The sign-off with Iris's proof marks in it. A slip and its fix share one slot; a fix
 *  with no slip (the full stop) gets a slot of its own. */
type Part = string | { was: string; now: string };
function proof(): Part[] {
  const segs = diff(LINE.draft, LINE.fixed);
  const parts: Part[] = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s.kind === 'same') parts.push(s.text);
    else if (s.kind === 'gone' && segs[i + 1]?.kind === 'new') parts.push({ was: s.text, now: segs[++i].text });
    else parts.push(s.kind === 'gone' ? { was: s.text, now: '' } : { was: '', now: s.text });
  }
  return parts;
}
const PARTS = proof();
const SLIPS = PARTS.filter((p) => typeof p !== 'string').length;

function FixedLine() {
  let slip = -1;
  return (
    <>
      {PARTS.map((part, i) => {
        const text = typeof part === 'string' ? part : part.now || part.was;
        const space = i > 0 && !/^[^\w]/.test(text) ? ' ' : '';
        if (typeof part === 'string') return <span key={i}>{space + part}</span>;
        slip++;
        const vars = {
          '--at': ms(TIMING.firstSlip + slip * TIMING.slipGap),
          '--drop': ms(TIMING.replace + slip * TIMING.waveGap),
        } as React.CSSProperties;
        return (
          <span key={i}>
            {space}
            <span {...stylex.props(f.slot)} style={vars} data-slip>
              {part.was && (
                <span aria-hidden {...stylex.props(f.layer, f.was)} data-slip-was>
                  {part.was}
                </span>
              )}
              <span {...stylex.props(f.layer, f.now)} data-slip-now>
                <span aria-hidden {...stylex.props(f.marker)}>
                  <span {...stylex.props(f.swipe)}>
                    <Printed mask={markerMask(31 + i)} color="paper" />
                  </span>
                </span>
                {part.now}
              </span>
            </span>
          </span>
        );
      })}
    </>
  );
}

export function Footer() {
  return (
    <footer {...stylex.props(f.foot)} aria-labelledby="foot-line">
      <div {...stylex.props(f.wrap)}>
        <div {...stylex.props(f.top)}>
          <div data-fixline>
            <p id="foot-line" {...stylex.props(f.line)} aria-label={LINE.fixed}>
              <FixedLine />
              <span aria-hidden {...stylex.props(f.tick)}>
                <HandTick size={22} color="rgb(42 26 22)" />
              </span>
              <span aria-hidden {...stylex.props(f.flower)}>
                <span {...stylex.props(f.nod)} style={{ '--slips': SLIPS } as React.CSSProperties}>
                  <span {...stylex.props(f.sway)}>
                    <Picture name="hero-flower" alt="" scale={6} xstyle={f.flowerImg} />
                  </span>
                </span>
                <span {...stylex.props(f.fly)}>
                  <img src="/sprite/monarch-wings.png" alt="" loading="lazy" decoding="async" {...stylex.props(f.flyPart, f.wings)} />
                  <img src="/sprite/monarch-body.png" alt="" loading="lazy" decoding="async" {...stylex.props(f.flyPart)} />
                </span>
              </span>
            </p>
            <button type="button" {...stylex.props(f.again)} data-fixline-again>
              <KeyRow keys={['⌃', '⌥', 'G']} />
              fix it again
            </button>
          </div>
          <div {...stylex.props(f.cta)}>
            <BrushButton href={links.download} download>
              Download Iris
            </BrushButton>
            <span {...stylex.props(f.ctaMeta)}>
              Free and open source
              <br />
              macOS 15 or later, Apple silicon
            </span>
          </div>
        </div>

        <div {...stylex.props(f.rule)}>
          <PenRule seed={101} strong />
        </div>
        <div {...stylex.props(f.bottom)}>
          <nav aria-label="More about Iris" {...stylex.props(f.links)}>
            <PenLink ribbon="paper" out={false} href="#install">Install</PenLink>
            <PenLink ribbon="paper" out={false} href="#new">What's new</PenLink>
            <PenLink ribbon="paper" out={false} href="#private">Privacy</PenLink>
            <PenLink ribbon="paper" href={links.code}>The code</PenLink>
            <PenLink ribbon="paper" href={links.problem}>Report a problem</PenLink>
          </nav>
          <div {...stylex.props(f.maker)}>
            <span {...stylex.props(f.stepped)} aria-hidden>
              <span>made</span>
              <span style={{ paddingLeft: '1em' }}>— by</span>
            </span>
            <span {...stylex.props(f.name)}>
              <span {...stylex.props(f.srOnly)}>Made by </span>Abhishek
            </span>
          </div>
        </div>
        <p {...stylex.props(f.credits)}>
          Iris uses Gemma 4 (Gemma Terms of Use) and Apple MLX (MIT). Set in Martian Mono, Caveat Brush, Rubik Doodle Shadow, Londrina Solid, Knewave and Mansalva (SIL OFL). MIT license.
        </p>
      </div>
    </footer>
  );
}
