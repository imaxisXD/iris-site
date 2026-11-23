// The parts of an Iris page, as DESIGN.md names them, for the web.
import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assets from './assets.json';
import { links, windows } from './content';
import { HandRect, PenArrow, PenRule, Printed, markerMask, ribbonMask, rng, seedOf, slabMasks, slabStyle, type InkName } from './pen';
import { font, ink, tex } from './tokens.stylex';

const MOBILE = '@media (max-width: 760px)';

// ── Hand lettering ────────────────────────────────────────────────────────────────────
export type Hand = 'fat' | 'sketched' | 'hollow' | 'scribbled' | 'small';

const hw = stylex.create({
  word: { display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap', lineHeight: 1, userSelect: 'none' },
  letter: {
    position: 'relative',
    display: 'inline-block',
    isolation: 'isolate',
    fontFamily: font.fat,
    color: ink.i12,
    marginRight: '-0.03em',
  },
  fat: {},
  first: { fontSize: '1.18em' },
  // The app's small i is the brush face's own lowercase i, at full size.
  small: {},
  hollow: {
    color: 'transparent',
    WebkitTextStroke: 'var(--pen, 0.045em) rgb(42 26 22)',
    '::before': {
      content: 'attr(data-l)',
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: -1,
      color: ink.pink,
      WebkitTextStroke: '0',
      transform: 'translate(0.05em, 0.04em)',
      backgroundImage: tex.screen,
      backgroundSize: '64px 64px',
    },
  },
  sketched: {
    fontFamily: font.sketch,
    color: 'transparent',
    WebkitTextStroke: '0.022em rgb(42 26 22)',
    '::after': {
      content: 'attr(data-l)',
      position: 'absolute',
      left: 0,
      top: 0,
      color: 'transparent',
      WebkitTextStroke: '0.014em rgb(42 26 22)',
      transform: 'translate(0.03em, -0.025em) rotate(1.5deg)',
    },
  },
  scribbled: {
    color: 'transparent',
    backgroundImage: 'repeating-linear-gradient(-58deg, rgb(42 26 22) 0 0.035em, transparent 0.035em 0.1em)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextStroke: '0.02em rgb(42 26 22)',
  },
});

const turns: Hand[] = ['sketched', 'fat', 'hollow', 'scribbled'];

/** Every letter drawn its own way, like the zine's GRiND: a big fat first cap, then the
 *  letters take turns; any i is a small lowercase i. Decoration: screen readers skip it. */
export function HandWord({ word, size, pattern, seed, pen, label }: { word: string; size: string; pattern?: Hand[]; seed?: number; pen?: string; label?: string }) {
  const r = rng(seed ?? seedOf(word));
  const letters = [...word];
  let turn = 0;
  const hands: Hand[] = letters.map((ch, i) => {
    if (pattern?.[i]) return pattern[i];
    if (ch.toLowerCase() === 'i' && i > 0) return 'small';
    if (i === 0) return 'fat';
    return turns[turn++ % turns.length];
  });
  return (
    <span {...stylex.props(hw.word)} style={{ fontSize: size, ['--pen' as string]: pen }} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      {letters.map((ch, i) => {
        const hand = hands[i];
        const shown = hand === 'small' ? ch.toLowerCase() : ch.toUpperCase();
        // As the app's HandLayout: a drop of up to ±0.04em and a tilt of up to ±4°, and
        // Knewave's rightward lean taken out (the app skews each glyph back by 0.2), so the
        // letters stand upright. The sketched hand is another face, already upright.
        const drop = (r() - 0.5) * 0.08;
        const tilt = (r() - 0.5) * 8;
        // (The app skews by 0.2, about 11°; the browser's Knewave leans further, so 18° here
        // is what stands it upright: checked against the app's render.)
        const upright = hand === 'sketched' ? '' : ' skewX(18deg)';
        return (
          <span
            key={i}
            data-l={shown}
            aria-hidden
            {...stylex.props(hw.letter, hw[hand], i === 0 && !pattern && hw.first)}
            style={{ transform: `translateY(${drop.toFixed(3)}em) rotate(${tilt.toFixed(1)}deg)${upright}` }}
          >
            {shown}
          </span>
        );
      })}
    </span>
  );
}

const wm = stylex.create({
  // As the app's IrisLogo: the doodle I, a little room, then RIS.
  mark: { display: 'inline-flex', alignItems: 'baseline', gap: '0.01em', lineHeight: 1, color: ink.i12, textDecoration: 'none' },
  // The doodle I with its outline drawn solid, the shadow's hatching closed up, as it prints in the app.
  // The doodle I as the app prints it: a hollow box in a heavy pen, its shadow thickening the
  // left side. Drawn, not set, so it reads the same at every size.
  i: { display: 'inline-block', height: '0.84em', width: 'auto', overflow: 'visible', alignSelf: 'baseline', translate: '0 0.12em' },
});
/** The wordmark: the doodle I, a little room, a hollow R, a small i and a hollow S. */
export function Wordmark({ size = '40px' }: { size?: string }) {
  return (
    <span role="img" aria-label="Iris" {...stylex.props(wm.mark)} style={{ fontSize: size }}>
      <svg aria-hidden viewBox="0 0 52 100" {...stylex.props(wm.i)}>
        {/* The doodle I as the app draws it: a wide box in a heavy pen, its shadow a dark strip
            down the left with the hatching just showing at its edge. */}
        <path d="M3.4,8 C3,36 3.8,66 3.2,96 L13,96.4 L13.6,7.4 Z" fill="rgb(42 26 22)" />
        <g stroke="rgb(42 26 22)" strokeWidth={1.8} strokeLinecap="round">
          {[16, 30, 44, 58, 72, 86].map((y) => <path key={y} d={`M0.8,${y} L4.6,${y + 0.4}`} />)}
        </g>
        <path d="M13.4,5.4 C23.6,4.2 37,4.4 47.6,5.2 C48.4,34 47.8,66 48.2,94.8 C37.6,95.6 24.4,95.2 13.8,95.4 C13,66 14,34 13.4,5.4 Z" fill="none" stroke="rgb(42 26 22)" strokeWidth={7.6} strokeLinejoin="round" />
      </svg>
      <HandWord word="RIS" size="0.9em" pattern={['hollow', 'small', 'hollow']} seed={4} pen="0.075em" />
    </span>
  );
}

// ── Ghost words, page titles, running heads ───────────────────────────────────────────
const gw = stylex.create({
  ghost: {
    position: 'absolute',
    fontFamily: font.chunky,
    fontWeight: 900,
    lineHeight: 0.84,
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: 'transparent',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    backgroundSize: '128px 128px, auto',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'pre',
    zIndex: 0,
  },
  khaki: { backgroundImage: `${tex.streaks}, linear-gradient(${ink.khaki}, ${ink.khaki})` },
  sky: { backgroundImage: `${tex.streaks}, linear-gradient(rgb(255 252 249 / 0.32), rgb(255 252 249 / 0.32))` },
  pink: { backgroundImage: `${tex.streaks}, linear-gradient(rgb(249 205 226), rgb(249 205 226))` },
  tan: { backgroundImage: `${tex.streaks}, linear-gradient(rgb(234 219 203), rgb(234 219 203))` },
});
/** One giant chunky word broken over two lines, pale and salted, cut off by the page's edge. */
export function GhostWord({ lines, tone, style }: { lines: [string, string]; tone: 'khaki' | 'sky' | 'pink' | 'tan'; style: React.CSSProperties }) {
  return (
    <span aria-hidden {...stylex.props(gw.ghost, gw[tone])} style={style}>
      {lines.join('\n')}
    </span>
  );
}

const pt = stylex.create({
  title: {
    fontFamily: font.mono,
    // As the app's PageTitle (DS.Font.display): weight 400, width 75, tracking −0.8 at 30pt,
    // the lines close but clear.
    fontStretch: '75%',
    fontWeight: 400,
    textTransform: 'uppercase',
    fontSize: { default: 'clamp(40px, 6.4vw, 92px)', [MOBILE]: 'clamp(28px, 7.8vw, 40px)' },
    lineHeight: 0.98,
    letterSpacing: '-0.027em',
    color: ink.i12,
    margin: 0,
    position: 'relative',
    zIndex: 1,
  },
  line: { display: 'block' },
  // Each line steps right about an em, behind a ✻ set like the words (the app's 64pt at 66pt).
  step: { paddingLeft: { default: '0.97em', [MOBILE]: '0.5em' } },
  star: { fontStretch: '75%', fontWeight: 400, marginRight: '0.21em' },
  // A mono space is wider than the gap after the ✻: pull it back so both sides match.
  starInline: { marginLeft: '-0.3em' },
  small: { fontSize: { default: 'clamp(34px, 4.4vw, 64px)', [MOBILE]: 'clamp(28px, 7.6vw, 38px)' } },
});
/** A stair headline in condensed caps: the second line steps right behind a ✻. With `lead`,
 *  the ✻ stands in the first line instead, after the lead word, where a comma would be:
 *  "Fix ✻ or change / the tone". `attrs` and `starAttrs` go onto the heading and the ✻ (the
 *  cover's entry, Entry.ts). */
type Attrs = Record<string, unknown> & { style?: React.CSSProperties };
export function PageTitle({ lines, lead, small = false, id, level = 2, xstyle, attrs, starAttrs }: { lines: [ReactNode, ReactNode]; lead?: string; small?: boolean; id?: string; level?: 1 | 2; xstyle?: stylex.StyleXStyles; attrs?: Attrs; starAttrs?: Attrs }) {
  const H = level === 1 ? 'h1' : 'h2';
  const star = <span aria-hidden {...starAttrs} {...stylex.props(pt.star, lead != null && lines[0] !== '' && pt.starInline)} style={starAttrs?.style}>✻</span>;
  return (
    <H id={id} {...attrs} {...stylex.props(pt.title, small && pt.small, xstyle)} style={attrs?.style}>
      <span {...stylex.props(pt.line)}>
        {lead != null && <>{lead}{' '}{star}</>}
        {lines[0]}{' '}
      </span>
      <span {...stylex.props(pt.line, pt.step)}>
        {lead == null && star}
        {lines[1]}
      </span>
    </H>
  );
}

const rh = stylex.create({
  head: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'clamp(16px, 4vw, 56px)',
    alignItems: { default: 'start', [MOBILE]: 'stretch' },
    fontSize: { default: 12, [MOBILE]: 11.5 },
    lineHeight: 1.45,
    color: ink.i11,
    position: 'relative',
    zIndex: 1,
    [MOBILE]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  },
  col: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: { default: 200, [MOBILE]: 'none' } },
  rule: { width: 88, [MOBILE]: { marginTop: 'auto' } },
  hideSmall: { [MOBILE]: { display: 'none' } },
});
/** The zine's strip of small columns over a page: where you are, what's on it, one fact. */
/** Only what helps a reader: the section's name, then at most two facts not said elsewhere. */
export function RunningHead({ cols, seed }: { cols: ReactNode[]; seed: number }) {
  return (
    <div {...stylex.props(rh.head)}>
      {cols.map((c, i) => (
        <div key={i} {...stylex.props(rh.col, i === 2 && rh.hideSmall)}>
          <span>{c}</span>
          <span {...stylex.props(rh.rule)}>
            <PenRule seed={seed + i} />
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Labels, keys, figures ─────────────────────────────────────────────────────────────
const il = stylex.create({
  label: {
    position: 'relative',
    display: 'inline-block',
    paddingBlock: '5px',
    paddingInline: '10px',
    fontSize: 13,
    lineHeight: 1.35,
    color: ink.paper,
    isolation: 'isolate',
    whiteSpace: 'nowrap',
  },
  wrap: { whiteSpace: 'normal' },
  text: { position: 'relative', zIndex: 1 },
});
const strip = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20' preserveAspectRatio='none'><path d='M0.3,0.6L100,0L99.6,20L0,19.5Z'/></svg>")}")`;
/** A printed ink strip with paper-coloured words: a name, or the one fact to remember. */
export function InkLabel({ children, wrap = false, color = 'ink' }: { children: ReactNode; wrap?: boolean; color?: 'ink' | 'espresso' }) {
  return (
    <span {...stylex.props(il.label, wrap && il.wrap)}>
      <Printed mask={strip} color={color} />
      <span {...stylex.props(il.text)}>{children}</span>
    </span>
  );
}

const kc = stylex.create({
  row: { display: 'inline-flex', gap: 6, alignItems: 'flex-end', verticalAlign: 'middle' },
  cap: {
    position: 'relative',
    display: 'inline-grid',
    placeItems: 'center',
    minWidth: '1.9em',
    height: '1.9em',
    paddingInline: '0.4em',
    fontSize: 13,
    fontWeight: 560,
    color: ink.i12,
    isolation: 'isolate',
    lineHeight: 1,
  },
  labeled: { width: { default: 82, [MOBILE]: 62 }, height: { default: 50, [MOBILE]: 38 }, minWidth: 0, placeItems: 'stretch', padding: { default: '6px 8px', [MOBILE]: '4px 6px' }, fontSize: { default: 13, [MOBILE]: 11 } },
  labeledLetter: { width: { default: 50, [MOBILE]: 38 } },
  sym: { justifySelf: 'end', fontSize: { default: 15, [MOBILE]: 12 }, lineHeight: 1 },
  word: { alignSelf: 'end', fontSize: { default: 12, [MOBILE]: 10.5 }, fontWeight: 450 },
  letter: { placeSelf: 'center', fontSize: { default: 18, [MOBILE]: 15 } },
  face: { position: 'relative', zIndex: 1 },
});
const capMask = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' preserveAspectRatio='none'><path d='M3,1.2C14,0.6 27,0.8 37.4,1.4C38.8,1.6 39,3 39,4L38.6,36.4C38.5,38 37.6,38.8 36,38.8L4,39C2,39 1,38 1.1,36.2L1,3.8C1,2.2 1.6,1.3 3,1.2Z'/></svg>")}")`;
/** A key, one per key, like a real keyboard: crema with the pink plate a few dots off. */
export function Keycap({ k, word, labeled = false, seed }: { k: string; word?: string; labeled?: boolean; seed?: number }) {
  const sd = seed ?? seedOf(k + (word ?? ''));
  const inner = labeled ? (
    word ? (
      <>
        <span {...stylex.props(kc.face, kc.sym)}>{k}</span>
        <span {...stylex.props(kc.face, kc.word)}>{word}</span>
      </>
    ) : (
      <span {...stylex.props(kc.face, kc.letter)}>{k}</span>
    )
  ) : (
    <span {...stylex.props(kc.face)}>{k}</span>
  );
  return (
    <kbd {...stylex.props(kc.cap, labeled && kc.labeled, labeled && !word && kc.labeledLetter)}>
      <Printed mask={capMask} color="pink" style={{ transform: 'translate(-1.5px, 1.5px)', opacity: 0.8 }} />
      <Printed mask={capMask} color="crema" />
      <HandRect seed={sd} width={1.5} />
      {inner}
    </kbd>
  );
}
const KEYWORDS: Record<string, string> = { '⌃': 'control', '⌥': 'option', '⌘': 'command', '⇧': 'shift', '↵': 'return', '⇥': 'tab' };
/** The same keys on Windows, as Iris for Windows writes them (the app's keys.rs): a shortcut
 *  that works everywhere is Ctrl+Win(+Shift)+G (⌃⌥G turned over is the Xbox Game Bar's), and a
 *  command inside Iris takes Ctrl where the Mac takes ⌘. */
export function windowsKeys(keys: string[]): string[] {
  const everywhere = keys.includes('⌃') && keys.includes('⌥');
  if (everywhere) return ['Ctrl', 'Win', ...keys.filter((k) => k !== '⌃' && k !== '⌥').map((k) => (k === '⇧' ? 'Shift' : k))];
  const win: Record<string, string> = { '⌘': 'Ctrl', '⌃': 'Ctrl', '⌥': 'Alt', '⇧': 'Shift', '↵': 'Enter', '⇥': 'Tab' };
  return keys.map((k) => win[k] ?? k);
}
/** Keys to press, as separate caps, read out in words: the Mac's, or on Windows Windows' own
 *  (global.css shows the one for this computer). */
export function KeyRow({ keys, labeled = false }: { keys: string[]; labeled?: boolean }) {
  const caps = (list: string[], os: 'mac' | 'windows') => (
    <span data-os-only={os} key={os}>
      <span {...stylex.props(kc.row)} role="img" aria-label={list.map((k) => (os === 'mac' ? KEYWORDS[k] ?? k : k)).join(' ')}>
        {list.map((k, i) =>
          os === 'mac' ? (
            <Keycap key={i} k={k} word={labeled ? KEYWORDS[k] : undefined} labeled={labeled} seed={i * 7 + k.charCodeAt(0)} />
          ) : (
            // Windows' keys carry their names (Ctrl, Win): labeled, the name sits where the
            // Mac's word does, with no symbol over it.
            <Keycap key={i} k={labeled && k.length > 1 ? '' : k} word={labeled && k.length > 1 ? k.toLowerCase() : undefined} labeled={labeled} seed={i * 7 + k.charCodeAt(0)} />
          ),
        )}
      </span>
    </span>
  );
  return (
    <>
      {caps(keys, 'mac')}
      {caps(windowsKeys(keys), 'windows')}
    </>
  );
}

/** Words that differ by computer: the Mac's, or Windows' on Windows (global.css). */
export function ForOs({ mac, windows: win, block = false }: { mac: ReactNode; windows: ReactNode; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return (
    <>
      <Tag data-os-only="mac">{mac}</Tag>
      <Tag data-os-only="windows">{win}</Tag>
    </>
  );
}

const sf = stylex.create({
  fig: { display: 'inline-flex', alignItems: 'flex-start', gap: 8, color: 'inherit' },
  num: { fontStretch: '75%', fontWeight: 400, fontSize: 'clamp(54px, 7vw, 88px)', lineHeight: 0.82, letterSpacing: '-0.03em' },
  unit: { display: 'flex', flexDirection: 'column', fontSize: 12, lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 4 },
});
/** A figure big, its unit stacked small beside it, like the zine's "18G / IN". */
export function StackedFigure({ value, unit }: { value: string; unit: [string, string] }) {
  return (
    <span {...stylex.props(sf.fig)}>
      <span {...stylex.props(sf.num)}>{value}</span>
      <span {...stylex.props(sf.unit)}>
        <span>{unit[0]}</span>
        <span>{unit[1]}</span>
      </span>
    </span>
  );
}

// ── Marker, links, buttons ────────────────────────────────────────────────────────────
const mk = stylex.create({
  word: { position: 'relative', display: 'inline-block', isolation: 'isolate', paddingInline: '0.12em' },
  swipe: { position: 'absolute', left: '-0.1em', right: '-0.25em', top: '42%', bottom: '-0.08em', zIndex: -1 },
  text: { position: 'relative' },
});
/** A word over a quick pink marker swipe: the chosen one, or the one Iris says. */
export function Marked({ children, seed, color = 'pink' }: { children: ReactNode; seed?: number; color?: 'pink' | 'crema' }) {
  return (
    <span {...stylex.props(mk.word)}>
      <span aria-hidden {...stylex.props(mk.swipe)}>
        <Printed mask={markerMask(seed ?? seedOf(String(children)))} color={color} />
      </span>
      <span {...stylex.props(mk.text)}>{children}</span>
    </span>
  );
}

const pl = stylex.create({
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: ink.i12,
    textDecoration: 'none',
    fontSize: 14,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
    ':active': { transform: 'scale(0.98)' },
  },
  // Its own layer, so the ribbon can swell behind the words on hover (global.css).
  words: { position: 'relative', paddingBottom: 4, isolation: 'isolate' },
  ribbon: { position: 'absolute', zIndex: -1, left: 0, right: 0, bottom: -3, height: 6 },
  arrow: { display: 'inline-flex', transform: 'translateY(-2px)' },
});
/** Words with a printed pink pen stroke under them, and the turned-up arrow when they leave.
 *  On a pink plate the stroke is printed in another ink (`ribbon`), or it would vanish. */
export function PenLink({ href, children, out = true, ribbon = 'pink' }: { href: string; children: string; out?: boolean; ribbon?: InkName }) {
  return (
    <a href={href} {...stylex.props(pl.link)} {...(out ? { rel: 'noopener' } : {})} data-penlink>
      <span {...stylex.props(pl.words)}>
        {children}
        <span aria-hidden data-penlink-ribbon {...stylex.props(pl.ribbon)}>
          <Printed mask={ribbonMask(seedOf(children))} color={ribbon} />
        </span>
      </span>
      {out && (
        <span data-penlink-arrow {...stylex.props(pl.arrow)}>
          <PenArrow up size={16} />
        </span>
      )}
    </a>
  );
}

const bt = stylex.create({
  primary: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: { default: 14, [MOBILE]: 10 },
    minHeight: { default: 52, [MOBILE]: 46 },
    paddingBlock: { default: 12, [MOBILE]: 10 },
    paddingLeft: { default: 24, [MOBILE]: 20 },
    paddingRight: { default: 40, [MOBILE]: 34 },
    fontSize: { default: 16, [MOBILE]: 15 },
    fontWeight: 560,
    color: ink.paper,
    textDecoration: 'none',
    isolation: 'isolate',
    transitionProperty: 'transform',
    transitionDuration: '160ms',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    ':active': { transform: 'scale(0.97)' },
    '@media (prefers-reduced-motion: reduce)': { ':active': { transform: 'none' } },
  },
  layer: { position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' },
  rose: { transform: 'translate(-2.5px, -2px)', zIndex: -2, opacity: 0.85 },
  inkLayer: { zIndex: -1 },
  label: { position: 'relative' },
  hint: { position: 'relative', display: 'inline-flex' },
  reset: { borderWidth: 0, backgroundColor: 'transparent', fontFamily: 'inherit', cursor: 'pointer' },
});
/** The next step: one loaded stroke of a dry brush in espresso, rose printed off register. */
export function BrushButton({ href, children, hint, id, download, data }: { href?: string; children: ReactNode; hint?: ReactNode; id?: string; download?: boolean; data?: Record<string, string> }) {
  // One shape per pass, so the screen runs on unbroken from end to end.
  const pass = (color: InkName) => <Printed mask={slabMasks.middle} color={color} style={slabStyle(18, 36)} />;
  const face = (
    <>
      <span aria-hidden {...stylex.props(bt.layer, bt.rose)} data-rose>
        {pass('rose')}
      </span>
      <span aria-hidden {...stylex.props(bt.layer, bt.inkLayer)} data-inkpass>
        {pass('ink')}
      </span>
      <span {...stylex.props(bt.label)}>{children}</span>
      {hint && <span {...stylex.props(bt.hint)}>{hint}</span>}
    </>
  );
  if (!href)
    return (
      <button type="button" id={id} {...stylex.props(bt.primary, bt.reset)} data-brush {...data}>
        {face}
      </button>
    );
  return (
    <a href={href} id={id} {...stylex.props(bt.primary)} data-brush {...(download ? { download: '' } : {})} {...data}>
      {face}
    </a>
  );
}

// ── Getting Iris ──────────────────────────────────────────────────────────────────────
// Iris runs on a Mac or a Windows PC, so a phone or tablet can't use the download. Where there's
// no pointer that hovers (the same test as the foot's "psst"), Download Iris becomes Send to my
// computer: the share sheet (AirDrop, Messages, Mail), or with no share sheet or no script an
// email to yourself with both downloads. The swap is CSS, so nothing changes after the page
// shows, and the hidden one is out of reach. On a computer the button downloads its own Iris
// (global.css, on the head script's data-os); where the computer isn't known it says it's the
// Mac's, and the Windows line beside it downloads the other.
const TOUCH = '@media not all and (hover: hover) and (pointer: fine)';
const gi = stylex.create({
  mac: { display: { default: 'contents', [TOUCH]: 'none' } },
  touch: { display: { default: 'none', [TOUCH]: 'contents' } },
});
/** Shown on a computer: anything with a mouse or trackpad. */
export const OnMac = ({ children }: { children: ReactNode }) => <span {...stylex.props(gi.mac)}>{children}</span>;
/** Shown on a phone or tablet. */
export const OnTouch = ({ children }: { children: ReactNode }) => <span {...stylex.props(gi.touch)}>{children}</span>;
const sendToComputer = `mailto:?subject=${encodeURIComponent('Iris, for my computer')}&body=${encodeURIComponent(`Download Iris on your computer:\n\nMac: ${links.download}\nWindows (beta): ${links.downloadWindows}\n\nMore about Iris: ${links.code}`)}`;
/** The page's one action: Download Iris for this computer, Send to my computer on a phone or
 *  tablet. `ribbon` underlines Download it here instead, as the links beside it are. */
export function GetIris({ ribbon }: { ribbon?: InkName }) {
  return (
    <>
      <OnMac>
        <span data-os-only="mac">
          <span data-os-known>
            <BrushButton href={links.download} download>
              Download Iris
            </BrushButton>
          </span>
          <span data-os-unknown>
            <BrushButton href={links.download} download>
              Download for Mac
            </BrushButton>
          </span>
        </span>
        <span data-os-only="windows">
          <BrushButton href={links.downloadWindows} download>
            Download Iris
          </BrushButton>
        </span>
      </OnMac>
      <OnTouch>
        <BrushButton href={sendToComputer} data={{ 'data-send-to-mac': '' }}>
          Send to my computer
        </BrushButton>
        <PenLink href={links.download} out={false} ribbon={ribbon}>
          Download it here instead
        </PenLink>
      </OnTouch>
    </>
  );
}

// ── Beta ──────────────────────────────────────────────────────────────────────────────
// A rubber stamp, inked once and pressed a few degrees off straight: a double frame and the
// word in condensed caps, both printed in ink (the drawings' espresso black) through the riso
// screen, so it runs thin and speckled where the stamp didn't take. Ink, not espresso, so the
// small word holds on the sky. Hollow, so it can't be taken for an InkLabel (a name) or a pill:
// "beta" is a status, and DESIGN.md keeps statuses out of badges.
const bs = stylex.create({
  stamp: {
    position: 'relative',
    display: 'inline-grid',
    placeItems: 'center',
    verticalAlign: '0.05em',
    paddingBlock: '3px 2px',
    paddingInline: '7px 6px',
    marginInline: '2px',
    rotate: '-4deg',
    isolation: 'isolate',
    lineHeight: 1,
  },
  word: {
    position: 'relative',
    fontSize: '0.78em',
    fontWeight: 700,
    fontStretch: '75%',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    // The word is ink through the same screen as the frame, never a flat colour.
    color: 'transparent',
    backgroundColor: ink.i12,
    backgroundImage: tex.inkDark,
    backgroundSize: '210px 210px',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
  },
});
/** The stamp's frame, as one shape: an outer wobbly edge and an inner one, the space between inked. */
function stampFrame(seed: number) {
  const r = rng(seed);
  const j = (n: number) => (n + (r() - 0.5) * 1.4).toFixed(1);
  const box = (a: number, b: number, c: number, d: number) => `M${j(a)},${j(b)}L${j(c)},${j(b)}L${j(c)},${j(d)}L${j(a)},${j(d)}Z`;
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'><path fill-rule='evenodd' d='${box(1, 1, 99, 39)}${box(5, 6, 95, 34)}'/></svg>`,
  )}")`;
}
/** "Beta", stamped beside a name. */
export function BetaStamp({ seed = 7 }: { seed?: number }) {
  return (
    <span {...stylex.props(bs.stamp)}>
      <Printed mask={stampFrame(seed)} color="ink" />
      <span {...stylex.props(bs.word)}>beta</span>
    </span>
  );
}

const pf = stylex.create({
  line: { display: 'block' },
  // The icon and its words side by side; on a narrow screen the words wrap beside the icon,
  // never under it.
  os: { display: 'flex', alignItems: 'center', gap: 7 },
  words: { minWidth: 0 },
  // A computer's line is its download: no underline, the ink of the words round it.
  link: { color: 'inherit', textDecoration: 'none' },
});
const os = stylex.create({
  icon: { display: 'inline-block', flex: 'none', verticalAlign: 'middle' },
});
/** The two computers Iris is for, drawn by Iris's pen (scripts/app-icons.mjs), never their
 *  makers' logos: the Mac warm, its menu bar and Dock; the Windows PC blue, its taskbar and
 *  Start. Decoration beside the computer's name, so screen readers skip it. */
// /app/* is cached for a week, so each picture's address carries a stamp of its contents: a
// redrawn computer shows at once instead of the old one from the cache.
export const stamped = (file: string) =>
  `${file}?v=${createHash('sha1').update(readFileSync(path.resolve(import.meta.dirname ?? '.', '../public', file.slice(1)))).digest('hex').slice(0, 8)}`;
export function OsIcon({ os: name, size = 22 }: { os: 'mac' | 'windows'; size?: number }) {
  return <img src={stamped(`/app/${name}.png`)} alt="" width={size} height={size} decoding="async" {...stylex.props(os.icon)} />;
}
/** What's said beside every Download Iris: the price, then which computers. Each computer's
 *  line downloads its own Iris, so the one the button isn't for is a click away. */
export function Platforms({ showPrice = true, compact = false }: { showPrice?: boolean; compact?: boolean } = {}) {
  const size = compact ? 20 : 22;
  return (
    <>
      {showPrice && <span {...stylex.props(pf.line)}>Free forever</span>}
      <a href={links.download} download {...stylex.props(pf.os, pf.link)}>
        <OsIcon os="mac" size={size} />
        <span {...stylex.props(pf.words)}>{compact ? 'Mac M1+ (macOS 15+)' : 'For Mac (M1 or newer · macOS 15+)'}</span>
      </a>
      <a href={links.downloadWindows} download {...stylex.props(pf.os, pf.link)}>
        <OsIcon os="windows" size={size} />
        <span {...stylex.props(pf.words)}>
          Windows <BetaStamp /> {windows.status}
        </span>
      </a>
    </>
  );
}

const sb = stylex.create({
  btn: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingInline: 18,
    fontSize: 14,
    color: ink.i12,
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', '@media (hover: hover)': { default: 'transparent', ':hover': 'rgb(42 26 22 / 0.05)' } },
    transitionProperty: 'transform, background-color',
    transitionDuration: '150ms',
    ':active': { transform: 'scale(0.97)' },
  },
});
/** Another action: a pen outline. */
export function PenButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} {...stylex.props(sb.btn)} rel="noopener">
      <HandRect seed={seedOf(String(href))} width={1.5} />
      {children}
    </a>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────────────
const sh = stylex.create({
  head: { display: 'flex', flexDirection: 'column', gap: { default: 10, [MOBILE]: 8 } },
  top: { display: 'flex', alignItems: 'baseline', gap: 14 },
  title: { fontFamily: font.brush, fontSize: { default: 'clamp(26px, 2.6vw, 34px)', [MOBILE]: 25 }, lineHeight: 1.1, margin: 0, fontWeight: 400, color: ink.i12 },
  detail: { fontSize: { default: 14, [MOBILE]: 13.5 }, lineHeight: { default: 1.65, [MOBILE]: 1.6 }, color: ink.i11, margin: 0, maxWidth: '46ch' },
});
/** A small section: brush title, a heading rule, then one or two lines. */
export function SectionHead({ title, children, seed }: { title: ReactNode; children?: ReactNode; seed: number }) {
  return (
    <div {...stylex.props(sh.head)}>
      <div {...stylex.props(sh.top)}>
        <h3 {...stylex.props(sh.title)}>{title}</h3>
      </div>
      <PenRule seed={seed} strong />
      {children && <p {...stylex.props(sh.detail)}>{children}</p>}
    </div>
  );
}

// ── Pictures ──────────────────────────────────────────────────────────────────────────
type AssetName = keyof typeof assets;
const pic = stylex.create({ img: { display: 'block', maxWidth: '100%', height: 'auto' } });
/** One of Iris's own drawings or screens, as AVIF with WebP behind it. `scale` is how many
 *  image pixels make one CSS pixel (Iris renders at 2x). */
export function Picture({ name, alt, sizes, eager = false, scale = 2, width, xstyle, style }: { name: AssetName; alt: string; sizes?: string; eager?: boolean; scale?: number; width?: number; xstyle?: stylex.StyleXStyles; style?: React.CSSProperties }) {
  const a = assets[name];
  const set = (ext: string) => a.sizes.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const cssWidth = width ?? Math.round(a.width / scale);
  const s = sizes ?? `(max-width: 760px) 100vw, ${cssWidth}px`;
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={s} />
      <img
        src={`/img/${name}-${a.width}.webp`}
        srcSet={set('webp')}
        sizes={s}
        width={cssWidth}
        height={Math.round((a.height / a.width) * cssWidth)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchPriority: 'high' as const } : {})}
        {...stylex.props(pic.img, xstyle)}
        style={style}
      />
    </picture>
  );
}

// ── Tape ──────────────────────────────────────────────────────────────────────────────
const tp = stylex.create({
  tape: {
    position: 'absolute',
    display: 'inline-block',
    paddingBlock: 6,
    paddingInline: 16,
    fontFamily: font.brush,
    fontSize: 19,
    lineHeight: 1,
    color: ink.i12,
    mixBlendMode: 'multiply',
    zIndex: 3,
    whiteSpace: 'nowrap',
  },
  words: { position: 'relative' },
});
const tapeMask = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30' preserveAspectRatio='none'><path d='M1,2L4,0.5L6,2.4L9,0.4L97,0.8L99,3L97.6,5.6L99.6,8L98,12L99.8,16L97.8,20L99.6,24L98,27L99,29.6L3,29.4L1,27L2.6,24L0.4,20L2.2,16L0.2,12L2,8L0.4,5Z'/></svg>")}")`;
/** A strip of pale masking tape with torn ends, a degree or two off straight. */
export function Tape({ children, style }: { children?: ReactNode; style: React.CSSProperties }) {
  return (
    <span {...stylex.props(tp.tape)} style={style}>
      <Printed mask={tapeMask} color="tape" style={{ opacity: 0.92 }} />
      {children && <span {...stylex.props(tp.words)}>{children}</span>}
    </span>
  );
}

// ── Apps by name ──────────────────────────────────────────────────────────────────────
// The apps the page names, each with its icon drawn the way Iris draws (scripts/app-icons.mjs),
// as the app shows an app's icon before its name. The name is the text; the icon is decoration.
const APPS = { slack: 'Slack', mail: 'Mail', messages: 'Messages', notes: 'Notes', chrome: 'Chrome', safari: 'Safari', textedit: 'TextEdit' } as const;
export type AppKey = keyof typeof APPS;
const an = stylex.create({
  name: { whiteSpace: 'nowrap' },
  icon: { display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3em', marginTop: '-0.18em' },
});
export function AppName({ app, size = 20 }: { app: AppKey; size?: number }) {
  return (
    <span {...stylex.props(an.name)}>
      <img src={`/app/${app}.png`} alt="" width={size} height={size} loading="lazy" decoding="async" {...stylex.props(an.icon)} />
      {APPS[app]}
    </span>
  );
}
