// The parts of an Iris page, as DESIGN.md names them, for the web.
import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import assets from './assets.json';
import { HandRect, PenArrow, PenRule, Printed, markerMask, ribbonMask, rng, seedOf, slabMasks } from './pen';
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
    marginInline: '-0.02em',
  },
  fat: {},
  first: { fontSize: '1.18em' },
  small: { fontSize: '0.66em', marginInline: '0.02em' },
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
      transform: 'translate(-0.05em, 0.045em)',
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
        const tilt = (r() - 0.5) * 12;
        const drop = (r() - 0.5) * 0.09;
        return (
          <span
            key={i}
            data-l={shown}
            aria-hidden
            {...stylex.props(hw.letter, hw[hand], i === 0 && !pattern && hw.first)}
            style={{ transform: `translateY(${drop.toFixed(3)}em) rotate(${tilt.toFixed(1)}deg)` }}
          >
            {shown}
          </span>
        );
      })}
    </span>
  );
}

const wm = stylex.create({
  mark: { display: 'inline-flex', alignItems: 'baseline', gap: '0.02em', lineHeight: 1, color: ink.i12, textDecoration: 'none' },
  i: { fontFamily: font.logo, fontSize: '1em', color: ink.i12 },
});
/** The wordmark: the doodle I, a little room, a hollow R, a small i and a hollow S. */
export function Wordmark({ size = '40px' }: { size?: string }) {
  return (
    <span role="img" aria-label="Iris" {...stylex.props(wm.mark)} style={{ fontSize: size }}>
      <span aria-hidden {...stylex.props(wm.i)}>I</span>
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
    fontVariationSettings: '"wdth" 75, "wght" 420',
    textTransform: 'uppercase',
    fontSize: 'clamp(40px, 6.4vw, 92px)',
    lineHeight: 0.98,
    letterSpacing: '-0.01em',
    color: ink.i12,
    margin: 0,
    position: 'relative',
    zIndex: 1,
  },
  line: { display: 'block' },
  step: { paddingLeft: '1.1em' },
  star: { fontVariationSettings: '"wdth" 75, "wght" 560', marginRight: '0.28em' },
  small: { fontSize: 'clamp(34px, 4.4vw, 64px)' },
});
/** A stair headline in condensed caps: the second line steps right behind a ✻. */
export function PageTitle({ lines, small = false, id, level = 2, xstyle }: { lines: [string, string]; small?: boolean; id?: string; level?: 1 | 2; xstyle?: stylex.StyleXStyles }) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <H id={id} {...stylex.props(pt.title, small && pt.small, xstyle)}>
      <span {...stylex.props(pt.line)}>{lines[0]} </span>
      <span {...stylex.props(pt.line, pt.step)}>
        <span aria-hidden {...stylex.props(pt.star)}>✻</span>
        {lines[1]}
      </span>
    </H>
  );
}

const rh = stylex.create({
  head: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto',
    gap: 'clamp(16px, 4vw, 56px)',
    alignItems: 'start',
    fontSize: 12,
    lineHeight: 1.45,
    color: ink.i11,
    position: 'relative',
    zIndex: 1,
    [MOBILE]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) auto' },
  },
  col: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 200 },
  rule: { width: 88 },
  hideSmall: { [MOBILE]: { display: 'none' } },
  folio: { fontVariationSettings: '"wght" 300', fontSize: 15, color: ink.i12 },
});
/** The zine's strip of small columns over a page: where you are, what's on it, one fact. */
export function RunningHead({ cols, folio, seed }: { cols: [string, string, string]; folio: string; seed: number }) {
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
      <span aria-hidden {...stylex.props(rh.folio)}>{folio}</span>
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
    fontVariationSettings: '"wght" 560',
    color: ink.i12,
    isolation: 'isolate',
    lineHeight: 1,
  },
  labeled: { width: 82, height: 50, minWidth: 0, placeItems: 'stretch', padding: '6px 8px', fontSize: 13 },
  labeledLetter: { width: 50 },
  sym: { justifySelf: 'end', fontSize: 15, lineHeight: 1 },
  word: { alignSelf: 'end', fontSize: 12, fontVariationSettings: '"wght" 450' },
  letter: { placeSelf: 'center', fontSize: 18 },
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
/** Keys to press, as separate caps, read out in words. */
export function KeyRow({ keys, labeled = false }: { keys: string[]; labeled?: boolean }) {
  const spoken = keys.map((k) => KEYWORDS[k] ?? k).join(' ');
  return (
    <span {...stylex.props(kc.row)} role="img" aria-label={spoken}>
      {keys.map((k, i) => (
        <Keycap key={i} k={k} word={labeled ? KEYWORDS[k] : undefined} labeled={labeled} seed={i * 7 + k.charCodeAt(0)} />
      ))}
    </span>
  );
}

const sf = stylex.create({
  fig: { display: 'inline-flex', alignItems: 'flex-start', gap: 8, color: 'inherit' },
  num: { fontVariationSettings: '"wdth" 75, "wght" 400', fontSize: 'clamp(54px, 7vw, 88px)', lineHeight: 0.82, letterSpacing: '-0.03em' },
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
  words: { position: 'relative', paddingBottom: 4 },
  ribbon: { position: 'absolute', left: 0, right: 0, bottom: -3, height: 6, opacity: { default: 1, ':hover': 1 } },
  arrow: { display: 'inline-flex', transform: 'translateY(-2px)' },
});
/** Words with a printed pink pen stroke under them, and the turned-up arrow when they leave. */
export function PenLink({ href, children, out = true }: { href: string; children: string; out?: boolean }) {
  return (
    <a href={href} {...stylex.props(pl.link)} {...(out ? { rel: 'noopener' } : {})} data-penlink>
      <span {...stylex.props(pl.words)}>
        {children}
        <span aria-hidden {...stylex.props(pl.ribbon)}>
          <Printed mask={ribbonMask(seedOf(children))} color="pink" />
        </span>
      </span>
      {out && (
        <span {...stylex.props(pl.arrow)}>
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
    gap: 14,
    minHeight: 52,
    paddingBlock: 12,
    paddingLeft: 24,
    paddingRight: 40,
    fontSize: 16,
    fontVariationSettings: '"wght" 560',
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
  cap: { position: 'relative', flex: 'none' },
  mid: { position: 'relative', flex: 1 },
  label: { position: 'relative' },
  hint: { position: 'relative', display: 'inline-flex' },
  reset: { borderWidth: 0, backgroundColor: 'transparent', fontFamily: 'inherit', cursor: 'pointer' },
});
/** The next step: one loaded stroke of a dry brush in espresso, rose printed off register. */
export function BrushButton({ href, children, hint, id, download, data }: { href?: string; children: ReactNode; hint?: ReactNode; id?: string; download?: boolean; data?: Record<string, string> }) {
  const pass = (color: 'ink' | 'rose') => (
    <>
      <span {...stylex.props(bt.cap)} style={{ width: 18 }}>
        <Printed mask={slabMasks.left} color={color} />
      </span>
      <span {...stylex.props(bt.mid)}>
        <Printed mask={slabMasks.middle} color={color} />
      </span>
      <span {...stylex.props(bt.cap)} style={{ width: 36 }}>
        <Printed mask={slabMasks.right} color={color} />
      </span>
    </>
  );
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
    backgroundColor: { default: 'transparent', ':hover': 'rgb(42 26 22 / 0.05)' },
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
  head: { display: 'flex', flexDirection: 'column', gap: 10 },
  top: { display: 'flex', alignItems: 'baseline', gap: 14 },
  num: { fontSize: 14, color: ink.pinkText, fontVariantNumeric: 'tabular-nums' },
  title: { fontFamily: font.brush, fontSize: 'clamp(26px, 2.6vw, 34px)', lineHeight: 1.1, margin: 0, fontWeight: 400, color: ink.i12 },
  detail: { fontSize: 14, lineHeight: 1.65, color: ink.i11, margin: 0, maxWidth: '46ch' },
});
/** A numbered section: pink folio, brush title, a heading rule, then one or two lines. */
export function SectionHead({ n, title, children, seed }: { n: string; title: ReactNode; children?: ReactNode; seed: number }) {
  return (
    <div {...stylex.props(sh.head)}>
      <div {...stylex.props(sh.top)}>
        <span {...stylex.props(sh.num)}>{n}</span>
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
