// /10, the foot: Iris's pink foot (`PageFoot`, the band at the bottom of every Settings page),
// printed through the screen like the other plates, ink words on it. Its last line is the
// zine's sign-off, written in a hurry, and Iris fixes it as you arrive: the flower comes up at
// the end of the line, each slip is struck through with its fix beside it on a paper marker,
// the way the panel marks a change, then the fix goes in and the line reads clean. ⌃⌥G beside
// it does it again.
//
// Contrast on plate pink (rgb 236 110 176): ink words 5.9:1, past WCAG AA at every size; the
// focus ring turns ink here (global.css). Paper markers under ink words: 16:1.

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each time is ms after the line scrolls into view (client.ts).
 *
 *     0ms   the sign-off as written: "thanks for reading. now go write somthing in
 *           you're own voice"
 *   250ms   Iris's flower pops up at the end of the line, 0 → 1.08 → 1 from its foot,
 *           then sways
 *   900ms   the first slip is struck through, left to right; its fix appears beside it
 *           on a paper marker swiped in (one slip every 380ms)
 *  2900ms   Replace: the struck words fold away, the markers lift off
 *  3500ms   the line reads clean: "Thanks for reading. Now go write something in your
 *           own voice."
 *
 * Under Reduce Motion the line is simply the fixed one. Without the script it plays once.
 * ───────────────────────────────────────────────────────── */
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { diff, links } from './content';
import { BrushButton, KeyRow, PenLink, Picture } from './parts';
import { markerMask, PenRule, Printed } from './pen';
import { font, ink, tex } from './tokens.stylex';

const TIMING = {
  flowerPops: 250,    // the flower comes up at the end of the line
  firstSlip:  900,    // the first slip is struck through, its fix beside it
  slipGap:    380,    // each next slip
  replace:    2900,   // the struck words fold away, the markers lift
};

/* The line, as written and as Iris fixes it */
const LINE = {
  draft: "thanks for reading. now go write somthing in you're own voice",
  fixed: 'Thanks for reading. Now go write something in your own voice.',
};

/* Iris's flower at the end of the line */
const FLOWER = { popMs: 620, swayDeg: 3, swayMs: 2400 };

/* A slip: the pen through it, its fix on a marker */
const SLIP = {
  strikeMs: 220,   // the pen strike drawn across the word
  fixMs:    300,   // the fix opening up beside it
  swipeMs:  280,   // the marker swiped in under the fix
  foldMs:   420,   // the struck word folding away at Replace
  liftMs:   520,   // the marker lifting off after it
};

const STILL = '@media (prefers-reduced-motion: reduce)';
const MOBILE = '@media (max-width: 760px)';
const ms = (v: number) => `${v}ms`;

const pop = stylex.keyframes({
  '0%': { scale: '0' },
  '65%': { scale: '1.08' },
  '100%': { scale: '1' },
});
const sway = stylex.keyframes({
  from: { rotate: `-${FLOWER.swayDeg}deg` },
  to: { rotate: `${FLOWER.swayDeg}deg` },
});
const strike = stylex.keyframes({
  from: { backgroundSize: '0% 2px' },
  to: { backgroundSize: '100% 2px' },
});
const open = stylex.keyframes({
  from: { maxWidth: '0em', opacity: 0 },
  to: { maxWidth: 'var(--w)', opacity: 1 },
});
const fold = stylex.keyframes({
  from: { maxWidth: 'var(--w)', opacity: 1 },
  to: { maxWidth: '0em', opacity: 0 },
});
const swipe = stylex.keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
});
const unpad = stylex.keyframes({
  from: { marginLeft: '0.27em' },
  to: { marginLeft: '0em' },
});
const lift = stylex.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

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

  // The sign-off Iris fixes.
  line: { margin: 0, fontFamily: font.brush, fontWeight: 400, fontSize: 'clamp(26px, 2.7vw, 38px)', lineHeight: 1.2, maxWidth: '34ch' },
  word: { display: 'inline-block', whiteSpace: 'nowrap', verticalAlign: 'bottom', overflow: 'clip', overflowClipMargin: '6px' },
  // A fix beside its struck word: a space's width between them, closing at Replace.
  beside: { marginLeft: 0, animationName: { default: unpad, [STILL]: 'none' }, animationDuration: ms(SLIP.foldMs), animationDelay: ms(TIMING.replace), animationFillMode: 'both' },
  // Struck: shown at first, folding away at Replace. At rest (and under Reduce Motion) gone.
  gone: { maxWidth: '0em', opacity: 0, animationName: { default: fold, [STILL]: 'none' }, animationDuration: ms(SLIP.foldMs), animationDelay: ms(TIMING.replace), animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)' },
  pen: {
    backgroundImage: 'linear-gradient(rgb(42 26 22), rgb(42 26 22))',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 58%',
    backgroundSize: '100% 2px',
    animationName: { default: strike, [STILL]: 'none' },
    animationDuration: ms(SLIP.strikeMs),
    animationDelay: 'var(--at)',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  // The fix: opens up beside the struck word; at rest just the word.
  fix: { maxWidth: 'var(--w)', animationName: { default: open, [STILL]: 'none' }, animationDuration: ms(SLIP.fixMs), animationDelay: 'calc(var(--at) + 120ms)', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  fixWord: { position: 'relative', display: 'inline-block', isolation: 'isolate', paddingInline: 2 },
  marker: { position: 'absolute', left: -3, right: -4, bottom: '0.12em', height: '0.5em', zIndex: -1, opacity: 0, animationName: { default: lift, [STILL]: 'none' }, animationDuration: ms(SLIP.liftMs), animationDelay: ms(TIMING.replace + 200), animationFillMode: 'both' },
  swipe: { position: 'absolute', inset: 0, animationName: { default: swipe, [STILL]: 'none' }, animationDuration: ms(SLIP.swipeMs), animationDelay: 'calc(var(--at) + 160ms)', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  flower: { display: 'inline-block', width: '1.05em', marginLeft: '0.15em', verticalAlign: '-0.12em', transformOrigin: '45% 97%', animationName: { default: pop, [STILL]: 'none' }, animationDuration: ms(FLOWER.popMs), animationDelay: ms(TIMING.flowerPops), animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)' },
  sway: { display: 'block', transformOrigin: '45% 97%', animationName: { default: sway, [STILL]: 'none' }, animationDuration: ms(FLOWER.swayMs), animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
  flowerImg: { width: '100%' },
  again: { display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '4px 0', borderWidth: 0, backgroundColor: 'transparent', fontFamily: font.mono, fontSize: 12.5, color: ink.i12, cursor: 'pointer', [STILL]: { display: 'none' } },

  cta: { display: 'flex', alignItems: 'center', gap: '14px 22px', flexWrap: 'wrap' },
  ctaMeta: { fontSize: 12.5, lineHeight: 1.5 },

  rule: { marginTop: 'clamp(20px, 2.6vw, 30px)' },
  bottom: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px 40px', flexWrap: 'wrap', paddingTop: 18 },
  links: { display: 'flex', flexWrap: 'wrap', gap: '12px 26px', alignItems: 'center' },
  maker: { display: 'flex', alignItems: 'flex-end', gap: 12 },
  stepped: { fontSize: 13, lineHeight: 1.4, fontVariationSettings: '"wght" 600', display: 'flex', flexDirection: 'column' },
  name: { fontFamily: font.brush, fontSize: 30, lineHeight: 0.9 },
  credits: { fontSize: 11.5, lineHeight: 1.6, margin: 0, marginTop: 14, maxWidth: '96ch' },
  folio: { fontVariationSettings: '"wdth" 75, "wght" 300', fontSize: 'clamp(48px, 6vw, 84px)', lineHeight: 0.8, letterSpacing: '-0.04em' },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
});

/** The sign-off with Iris's marks in it: each slip struck, its fix beside it.
 *
 *  Spaces between words are ordinary spaces, outside the boxes that fold, so a line that
 *  wraps drops its space as text does. The one gap that isn't is between a struck word and
 *  its fix: a margin on the fix that closes at Replace, when the struck word is gone. */
function FixedLine() {
  const segs = diff(LINE.draft, LINE.fixed);
  const isWord = (t: string) => !/^[^\w]/.test(t);
  let slip = -1;
  const out: React.ReactNode[] = [];
  segs.forEach((seg, i) => {
    const afterGone = segs[i - 1]?.kind === 'gone';
    if (i > 0 && isWord(seg.text) && !afterGone) out.push(' ');
    if (seg.kind === 'same') return out.push(<span key={i}>{seg.text}</span>);
    if (seg.kind === 'gone') slip++;
    const at = TIMING.firstSlip + Math.max(0, slip) * TIMING.slipGap;
    const vars = { '--at': ms(at), '--w': `${seg.text.length * 0.62 + 1.1}em` } as React.CSSProperties;
    if (seg.kind === 'gone')
      return out.push(
        <span key={i} {...stylex.props(f.word, f.gone)} style={vars} aria-hidden>
          <span {...stylex.props(f.pen)} style={vars}>{seg.text}</span>
        </span>,
      );
    out.push(
      <span key={i} {...stylex.props(f.word, f.fix)} style={vars}>
        <span {...stylex.props(f.fixWord, afterGone && isWord(seg.text) && f.beside)}>
          <span aria-hidden {...stylex.props(f.marker)}>
            <span {...stylex.props(f.swipe)} style={vars}>
              <Printed mask={markerMask(31 + i)} color="paper" />
            </span>
          </span>
          {seg.text}
        </span>
      </span>,
    );
  });
  return <>{out}</>;
}

export function Footer() {
  return (
    <footer {...stylex.props(f.foot)} aria-labelledby="foot-line">
      <div {...stylex.props(f.wrap)}>
        <div {...stylex.props(f.top)}>
          <div data-fixline>
            <p id="foot-line" {...stylex.props(f.line)} aria-label={LINE.fixed}>
              <FixedLine />
              <span aria-hidden {...stylex.props(f.flower)}>
                <span {...stylex.props(f.sway)}>
                  <Picture name="hero-flower" alt="" scale={6} xstyle={f.flowerImg} />
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
            <span aria-hidden {...stylex.props(f.folio)} style={{ marginLeft: 18 }}>/10</span>
          </div>
        </div>
        <p {...stylex.props(f.credits)}>
          Iris uses Gemma 4 (Gemma Terms of Use) and Apple MLX (MIT). Set in Martian Mono, Caveat Brush, Rubik Doodle Shadow, Londrina Solid, Knewave and Mansalva (SIL OFL). MIT license.
        </p>
      </div>
    </footer>
  );
}
