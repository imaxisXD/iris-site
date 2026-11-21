// Printed backdrops for the panels: Iris's garden and the page's ghost word, run through a
// riso halftone by scripts/art.mjs. Paper on print, so the panel and the menu stand out.
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, ReactNode } from 'react';
import { Picture } from './parts';
import { Pattern } from './Patterns';
import { font, ink, tex } from './tokens.stylex';

const MOBILE = '@media (max-width: 760px)';
const NARROW = '@media (max-width: 1000px)';

const ART = {
  garden: { width: 2200, height: 1000, sizes: [900, 1800] },
  voice: { width: 900, height: 1200, sizes: [450, 900] },
  corner: { width: 1800, height: 1160, sizes: [700, 1200] },
} as const;

const a = stylex.create({
  img: { display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' },
});

/** One of the printed backdrops, filling its box. Decorative: it says nothing a reader needs. */
export function Art({ name, sizes, position }: { name: keyof typeof ART; sizes: string; position?: string }) {
  const art = ART[name];
  const set = (ext: string) => art.sizes.map((w) => `/art/${name}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img src={`/art/${name}-${art.sizes[0]}.webp`} srcSet={set('webp')} sizes={sizes} alt="" width={art.width} height={art.height} loading="lazy" decoding="async" {...stylex.props(a.img)} style={position ? { objectPosition: position } : undefined} />
    </picture>
  );
}

// ── The panel's stage (section 03) ──────────────────────────────────────────────────
// The garden print behind and to the right of the panel, running out past it; the pink
// VOICE print peeking out low on the left. The panel lies on top, on its own shadow.
/** Torn paper edges: no side runs dead straight, each sheet its own. */
const TORN = [
  'polygon(1.5% 2%, 18% 0.4%, 37% 1.8%, 58% 0%, 79% 1.6%, 98.5% 0.6%, 100% 14%, 98.8% 33%, 100% 52%, 98.6% 71%, 99.6% 88%, 98% 99%, 81% 98%, 62% 100%, 41% 98.4%, 22% 100%, 3% 98.6%, 0.4% 84%, 1.6% 63%, 0% 44%, 1.4% 25%)',
  'polygon(0.6% 1%, 12% 0%, 27% 1.2%, 44% 0.2%, 61% 1.4%, 77% 0.3%, 92% 1.1%, 99.4% 0%, 100% 18%, 99.2% 41%, 100% 63%, 99.3% 84%, 100% 99.2%, 86% 100%, 69% 98.9%, 51% 100%, 33% 99%, 17% 100%, 0.4% 98.8%, 1.2% 79%, 0% 57%, 1% 34%, 0% 14%)',
  'polygon(0% 2.4%, 15% 0.6%, 33% 2%, 52% 0%, 70% 1.6%, 88% 0.2%, 100% 1.8%, 98.9% 22%, 100% 45%, 98.6% 68%, 99.8% 90%, 98.5% 100%, 79% 98.2%, 58% 99.8%, 37% 98%, 18% 99.6%, 1.2% 98%, 0% 76%, 1.4% 52%, 0.2% 28%)',
];
const ps = stylex.create({
  scene: { position: 'relative', paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 6vw, 80px)', paddingInline: { default: 0, [MOBILE]: 12 }, isolation: 'isolate' },
  sheet: { position: 'absolute', zIndex: -1, overflow: 'hidden', isolation: 'isolate' },
  tan: { backgroundColor: ink.tan, backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px' },
  // The sheets lie flat on the page (only the panel on top casts a shadow), dimmed as if in the
  // panel's shade, so the eye goes to the panel.
  lift: { position: 'absolute', zIndex: -1, inset: 0, pointerEvents: 'none', filter: 'brightness(0.99) saturate(0.99)' },
  // The page's own riso screen and streaks over a print, so no sheet reads as flat colour.
  texture: { position: 'absolute', inset: 0, backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px', pointerEvents: 'none' },
  // Back: the tan print with Iris's flower, behind the panel's right two thirds and out past it.
  garden: { clipPath: TORN[1], top: 0, bottom: { default: '9%', [MOBILE]: '5%' }, left: '22%', right: 'calc(-1 * clamp(8px, 2.6vw, 40px))', [MOBILE]: { left: '16%', right: -16 } },
  // Middle: a pale pink sheet with the page's ghost word, behind the panel's left half.
  tone: {
    top: { default: -14, [MOBILE]: -10 },
    left: 'calc(-1 * clamp(12px, 2.6vw, 36px))',
    width: '60%',
    height: '74%',
    transform: 'rotate(1.4deg)',
    clipPath: TORN[2],
    backgroundColor: 'rgb(249 205 226)',
    [MOBILE]: { left: -14, width: '68%' },
  },
  toneWord: {
    position: 'absolute',
    left: '-4%',
    bottom: '-16%',
    fontFamily: font.chunky,
    fontWeight: 900,
    fontSize: 'clamp(120px, 15vw, 210px)',
    lineHeight: 0.8,
    letterSpacing: '-0.02em',
    color: ink.paper,
    opacity: 0.85,
    whiteSpace: 'nowrap',
  },
  // Front: the sky print with VOICE, low on the left.
  // Front: the sky print with VOICE, low on the left, tucked up under the panel. Its edges are
  // torn (a clip-path with a wobble), so it reads as a scrap of print, not a box.
  voice: {
    left: 'calc(-1 * clamp(16px, 3vw, 44px))',
    bottom: 'clamp(14px, 2vw, 26px)',
    width: 'min(30%, 230px)',
    aspectRatio: '3 / 4',
    transform: 'rotate(-2deg)',
    clipPath: TORN[0],
    [MOBILE]: { left: -16, width: '42%', bottom: 8 },
  },
  over: { position: 'relative' },
});
export function PanelScene({ children }: { children: ReactNode }) {
  return (
    <div {...stylex.props(ps.scene)}>
      <span aria-hidden {...stylex.props(ps.lift)}>
      <span aria-hidden {...stylex.props(ps.sheet, ps.garden, ps.tan)}>
        <Pattern kind="loops" color="rgb(212 180 150)" seed={33} scale={1.4} />
        <span {...stylex.props(ps.texture)} />
      </span>
      <span aria-hidden {...stylex.props(ps.sheet, ps.tone)}>
        <Pattern kind="ripples" color="rgb(244 186 214)" seed={35} at={[0.2, 0.75]} />
        <span {...stylex.props(ps.toneWord)}>TONE</span>
        <span {...stylex.props(ps.texture)} />
      </span>
      <span aria-hidden {...stylex.props(ps.sheet, ps.voice)}>
        <Art name="voice" sizes="(max-width: 760px) 42vw, 240px" />
      </span>
      </span>
      <div {...stylex.props(ps.over)}>{children}</div>
    </div>
  );
}

// ── The Fix facts' stages (section 03) ──────────────────────────────────────────────
// Each fact's picture lies on a small collage, cut from the same prints as the panel's
// stage: a torn back sheet with its own pattern, and a scrap across one corner carrying a big
// printed glyph, as a zine pastes a cut-out over a print. Four looks, so the four read as one
// spread without repeating.
const fs = stylex.create({
  stage: { position: 'relative', isolation: 'isolate', display: 'grid', placeItems: 'center', minWidth: 0, padding: 'clamp(30px, 3.6vw, 48px) clamp(18px, 2.8vw, 40px)' },
  sheet: { position: 'absolute', zIndex: -1, overflow: 'hidden', isolation: 'isolate', pointerEvents: 'none' },
  back: { inset: '0 2% 0 0' },
  scrap: { width: 'clamp(110px, 34%, 190px)', aspectRatio: '1 / 1' },
  glyph: { position: 'absolute', fontFamily: font.chunky, fontWeight: 900, fontSize: 'clamp(80px, 8vw, 120px)', lineHeight: 0.8, letterSpacing: '-0.02em', color: ink.paper, opacity: 0.85, whiteSpace: 'nowrap' },
  over: { position: 'relative', width: '100%', minWidth: 0, display: 'grid', justifyItems: 'center' },
  // The picture sits away from the scrap, so the scrap's glyph shows beside it.
  awayLeft: { justifyItems: { default: 'start', [MOBILE]: 'center' } },
  awayRight: { justifyItems: { default: 'end', [MOBILE]: 'center' } },
});

type Corner = 'tl' | 'tr' | 'bl' | 'br';
const SCRAP_AT: Record<Corner, CSSProperties> = {
  tl: { left: -10, top: -14, transform: 'rotate(-3deg)' },
  tr: { right: -8, top: -16, transform: 'rotate(2.5deg)' },
  bl: { left: -12, bottom: -12, transform: 'rotate(2deg)' },
  br: { right: -6, bottom: -14, transform: 'rotate(-2.5deg)' },
};
const GLYPH_AT: Record<Corner, CSSProperties> = {
  tl: { left: '7%', top: '9%' },
  tr: { right: '7%', top: '9%' },
  bl: { left: '7%', bottom: '4%' },
  br: { right: '7%', bottom: '4%' },
};

export const FACT_LOOKS = {
  // The Slack box: a sky print with waves, a pink scrap with @.
  sky: { back: 'rgb(200 216 240)', backInk: 'rgb(182 202 234)', backKind: 'waves', scrap: 'rgb(249 205 226)', scrapInk: 'rgb(244 186 214)', scrapKind: 'ripples', glyph: '@', corner: 'tr', torn: 0 },
  // A word kept: the panel's tan print with petal loops, a khaki scrap with Aa.
  tan: { back: 'rgb(222 196 170)', backInk: 'rgb(210 180 150)', backKind: 'loops', scrap: 'rgb(226 218 196)', scrapInk: 'rgb(214 204 178)', scrapKind: 'stars', glyph: 'Aa', corner: 'tl', torn: 1 },
  // Another language: the TONE sheet's pink with ripples, a sky scrap with ¿?.
  pink: { back: 'rgb(249 214 230)', backInk: 'rgb(244 194 218)', backKind: 'ripples', scrap: 'rgb(200 216 240)', scrapInk: 'rgb(182 202 234)', scrapKind: 'waves', glyph: '¿?', corner: 'bl', torn: 2 },
  // A third of a second: khaki with ✻, a tan scrap with 0.3.
  khaki: { back: 'rgb(230 223 204)', backInk: 'rgb(218 208 182)', backKind: 'stars', scrap: 'rgb(222 196 170)', scrapInk: 'rgb(210 180 150)', scrapKind: 'loops', glyph: '0.3', corner: 'br', torn: 0 },
  // The install steps (section 08): the step's number on the scrap, as the zine prints a folio.
  // Each number at the top of its sheet, so the three read across in a row; 3 at the right, not
  // the left, so it doesn't sit beside 2 across the gap (reading as 23) or under step 3's dialog.
  step1: { back: 'rgb(200 216 240)', backInk: 'rgb(182 202 234)', backKind: 'waves', scrap: 'rgb(222 196 170)', scrapInk: 'rgb(210 180 150)', scrapKind: 'loops', glyph: '1', corner: 'tl', torn: 1 },
  step2: { back: 'rgb(230 223 204)', backInk: 'rgb(218 208 182)', backKind: 'stars', scrap: 'rgb(249 205 226)', scrapInk: 'rgb(244 186 214)', scrapKind: 'ripples', glyph: '2', corner: 'tr', torn: 2 },
  step3: { back: 'rgb(249 214 230)', backInk: 'rgb(244 194 218)', backKind: 'ripples', scrap: 'rgb(200 216 240)', scrapInk: 'rgb(182 202 234)', scrapKind: 'waves', glyph: '3', corner: 'tr', torn: 0 },
} as const;
export type FactLook = keyof typeof FACT_LOOKS;

export function FactStage({ look, seed, children }: { look: FactLook; seed: number; children: ReactNode }) {
  const L = FACT_LOOKS[look];
  return (
    <div {...stylex.props(fs.stage)}>
      <span aria-hidden {...stylex.props(fs.sheet, fs.back)} style={{ backgroundColor: L.back, clipPath: TORN[L.torn] }}>
        <Pattern kind={L.backKind} color={L.backInk} seed={seed} scale={1.6} count={L.backKind === 'ripples' ? 9 : undefined} at={L.backKind === 'ripples' ? [0.85, 0.2] : undefined} />
        <span {...stylex.props(ps.texture)} />
      </span>
      <span aria-hidden {...stylex.props(fs.sheet, fs.scrap)} style={{ ...SCRAP_AT[L.corner as Corner], backgroundColor: L.scrap, clipPath: TORN[(L.torn + 1) % 3] }}>
        <Pattern kind={L.scrapKind} color={L.scrapInk} seed={seed + 1} scale={2.4} />
        <span {...stylex.props(fs.glyph)} style={GLYPH_AT[L.corner as Corner]}>{L.glyph}</span>
        <span {...stylex.props(ps.texture)} />
      </span>
      <div {...stylex.props(fs.over, L.corner.endsWith('r') ? fs.awayLeft : fs.awayRight)}>{children}</div>
    </div>
  );
}

// ── A Mac's top right corner (section 07) ───────────────────────────────────────────
// The bezel, the desktop (the garden at night), the menu bar with Iris's flower in it, and
// Iris's menu hanging from the flower, as the app draws it. Sized in container units, so
// the whole screen scales as one.
const BAR = 5.4; // the menu bar's height, in % of the corner's width
const FLOWER_AT = 60; // the flower's centre, in % from the screen's right edge
const MENU_W = 46; // the menu's width, in %: at most 294px, so its 577px picture stays a true 2×

const mc = stylex.create({
  // As wide as the sheet allows, or as the sheet's height allows at its shape (1 / 0.95), whichever
  // is less; on narrow pages, the full width.
  box: { position: 'relative', flex: 'none', width: { default: 'min(100cqw, 100cqh / 0.95)', [NARROW]: '100%' }, maxWidth: 640, containerType: 'inline-size' },
  bezel: {
    position: 'relative',
    aspectRatio: '1 / 0.95',
    backgroundColor: 'rgb(24 22 22)',
    paddingTop: '2.4cqw',
    paddingRight: '2.4cqw',
    borderTopRightRadius: '9cqw',
    boxShadow: 'inset -1px 1px 0 rgb(255 255 255 / 0.12), 0 24px 48px -28px rgb(42 26 22 / 0.55)',
    [MOBILE]: { aspectRatio: '1 / 1.08' },
  },
  screen: { position: 'relative', height: '100%', overflow: 'hidden', borderTopRightRadius: '6.6cqw' },
  desk: { position: 'absolute', inset: 0 },
  bar: {
    position: 'absolute',
    insetInline: 0,
    top: 0,
    height: `${BAR}cqw`,
    backgroundColor: 'rgb(246 244 242 / 0.7)',
    backdropFilter: 'blur(14px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
    color: 'rgb(0 0 0 / 0.85)',
    fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
    fontSize: '2.55cqw',
    fontWeight: 500,
  },
  item: { position: 'absolute', top: '50%', transform: 'translate(50%, -50%)', display: 'block' },
  clock: { position: 'absolute', right: '3.4cqw', top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  menu: { position: 'absolute', top: `${BAR + 0.3}cqw`, right: `${FLOWER_AT - MENU_W / 2}cqw`, width: `${MENU_W}cqw`, filter: 'drop-shadow(0 10px 18px rgb(0 0 0 / 0.28))' },
  menuImg: { width: '100%', height: 'auto' },
});

/** Iris's menu bar flower (MenuBarIcon.swift), drawn the same way: the pink plate a little
 *  off register, the crayon hatching, the stem and the leaf. */
const plates = [
  [[11.2, 4.7], [10.97, 6.19], [10.43, 7.5], [9.54, 8.39], [8.45, 8.48], [7.5, 7.65], [6.96, 6.24], [6.86, 4.7], [7.08, 3.25], [7.61, 1.97], [8.47, 1.1], [9.54, 1.01], [10.47, 1.82], [10.99, 3.2]],
  [[8.21, 7.28], [8.06, 8.35], [7.33, 9.38], [6.26, 10.27], [4.92, 10.96], [3.41, 11.29], [2.12, 11.06], [1.47, 10.28], [1.62, 9.24], [2.34, 8.23], [3.38, 7.37], [4.68, 6.7], [6.15, 6.37], [7.42, 6.59]],
  [[16.39, 10.22], [15.58, 10.81], [14.46, 11.07], [13.08, 10.99], [11.57, 10.44], [10.34, 9.46], [9.83, 8.33], [10.09, 7.42], [10.88, 6.85], [11.97, 6.59], [13.32, 6.67], [14.79, 7.2], [15.99, 8.16], [16.49, 9.26]],
];
const hatches = [
  [[7.83, 1.6], [10.64, 2.32], [7.02, 3.04], [11.12, 3.76], [6.71, 4.48], [11.16, 5.2], [6.82, 5.92], [10.82, 6.64], [7.63, 7.36]],
  [[4.3, 6.75], [7.85, 7.47], [2.14, 8.19], [7.74, 8.91], [1.81, 9.63], [6.29, 10.35]],
  [[10.53, 6.75], [14.92, 7.47], [10.06, 8.19], [15.98, 8.91], [11.01, 9.63], [16.29, 10.35]],
];
const stem = [[9, 10.4], [8.7, 13.6], [9.2, 17.4]];
const leaf = [[9.2, 16.6], [11.4, 14.8], [13.6, 13.6], [12.6, 15.6], [9.5, 16.3]];
/** A Catmull-Rom curve through the points, as cubic Béziers (MenuBarIcon.smoothPath). */
function smooth(p: number[][], closed = false) {
  const n = p.length, at = (i: number) => (closed ? p[((i % n) + n) % n] : p[Math.min(Math.max(i, 0), n - 1)]);
  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${r(p1[0] + (p2[0] - p0[0]) / 6)},${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)},${r(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  return closed ? d + 'Z' : d;
}
function MenuBarFlower({ size }: { size: string }) {
  const ink = 'rgb(0 0 0 / 0.85)';
  return (
    <svg viewBox="0 0 18 18" style={{ width: size, height: size, display: 'block', overflow: 'visible' }}>
      <g transform="translate(-0.8 -0.6)" fill="rgb(240 134 176)">{plates.map((p, i) => <path key={i} d={smooth(p, true)} />)}</g>
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {hatches.map((h, i) => <path key={i} d={smooth(h)} strokeWidth={0.7} />)}
        <path d={smooth(stem)} strokeWidth={1.25} />
        <path d={smooth(leaf)} strokeWidth={1.05} />
      </g>
    </svg>
  );
}
// The system's own items, simply drawn: battery, Control Center, Spotlight, Wi-Fi.
const sys = {
  battery: (
    <svg viewBox="0 0 27 13" style={{ width: '4.6cqw', display: 'block' }} fill="none" stroke="currentColor">
      <rect x="0.6" y="0.6" width="22.4" height="11.8" rx="3.4" strokeWidth="1.1" strokeOpacity="0.55" />
      <rect x="2.4" y="2.4" width="16.6" height="8.2" rx="1.8" fill="currentColor" stroke="none" />
      <path d="M24.6 4.6v3.8" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  ),
  control: (
    <svg viewBox="0 0 16 16" style={{ width: '2.8cqw', display: 'block' }}>
      <rect x="0.8" y="1.2" width="14.4" height="5.8" rx="2.9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.1" cy="4.1" r="1.7" fill="currentColor" />
      <rect x="0.8" y="9" width="14.4" height="5.8" rx="2.9" fill="currentColor" />
      <circle cx="11.9" cy="11.9" r="1.7" fill="rgb(246 244 242)" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" style={{ width: '2.7cqw', display: 'block' }} fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="6.6" cy="6.6" r="5" strokeWidth="1.7" />
      <path d="M10.4 10.4l4.4 4.4" strokeWidth="1.9" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 18 14" style={{ width: '3.1cqw', display: 'block' }} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
      <path d="M1.2 5.2a11 11 0 0 1 15.6 0" />
      <path d="M4 8.2a7 7 0 0 1 10 0" />
      <path d="M6.8 11.1a3 3 0 0 1 4.4 0" />
      <circle cx="9" cy="12.9" r="0.4" fill="currentColor" />
    </svg>
  ),
};

export function MacCorner({ menu, note }: { menu: ReactNode; note?: ReactNode }) {
  const items: [ReactNode, number][] = [
    [<MenuBarFlower size="3.7cqw" />, FLOWER_AT],
    [sys.battery, 51.6],
    [sys.control, 44.8],
    [sys.search, 39.2],
    [sys.wifi, 33.4],
  ];
  return (
    <div {...stylex.props(mc.box)}>
      {note}
      <div {...stylex.props(mc.bezel)}>
        <div {...stylex.props(mc.screen)}>
          <span aria-hidden {...stylex.props(mc.desk)}>
            <Art name="corner" sizes="(max-width: 760px) 100vw, 560px" />
          </span>
          <div aria-hidden {...stylex.props(mc.bar)}>
            {items.map(([icon, right], i) => (
              <span key={i} {...stylex.props(mc.item)} style={{ right: `${right}cqw` }}>
                {icon}
              </span>
            ))}
            <span {...stylex.props(mc.clock)}>Thu 13 Nov 9:41</span>
          </div>
          <div {...stylex.props(mc.menu)}>{menu}</div>
        </div>
      </div>
    </div>
  );
}

