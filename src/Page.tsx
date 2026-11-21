// The Iris zine, issue for the web: one page per spread, printed like the app.
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { crossMask, HandArrow, HandRect, HandTick, markerMask, PenArrow, penLine, PenRule, Printed, ringMask, rng, seedOf, svgUrl } from './pen';
import {
  AppName,
  BetaStamp,
  GetIris,
  GhostWord,
  HandWord,
  InkLabel,
  KeyRow,
  Marked,
  OnMac,
  OsIcon,
  OnTouch,
  PageTitle,
  PenButton,
  PenLink,
  Picture,
  Platforms,
  RunningHead,
  SectionHead,
  StackedFigure,
  Tape,
  Wordmark,
} from './parts';
import { Footer } from './Footer';
import { FactStage, type FactLook, MacCorner, PanelScene } from './Backdrop';
import { Bud, CHAPTERS, Desk, doneCss, Flight, FLOWER_PX, ON_FOOT, SHUT_MS, WALL } from './Desk';
import { DONE, LANDS, SaysNote } from './Done';
import { Pattern } from './Patterns';
import { Branch, type BranchSpec, type Depth } from './Branches';
import { CloseButterfly, COVER_CLOUDS, CoverCloud, Dust, FLUTTER, Lens, Petals } from './Atmosphere';
import { ENTER, withEnter } from './Entry';
import type { CoverCloudName } from './Atmosphere';
import { Garden } from './Garden';
import { draft, issues, links, month, pageTones, pressTones, tones, windows } from './content';
import { Marks, MessageStack, Panel, panel } from './Panel';
import { font, ink, tex } from './tokens.stylex';

const MOBILE = '@media (max-width: 760px)';
const NARROW = '@media (max-width: 1000px)';
const STILL = '@media (prefers-reduced-motion: reduce)';
// Hover looks only where there's a pointer that hovers: on touch a tap would leave them stuck.
const HOVER = '@media (hover: hover)';


const s = stylex.create({
  // The page is one sheet of paper lying over the foot: as you reach the end it lifts off,
  // its edge casting a shadow on what's under it.
  page: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: ink.paper,
    backgroundImage: tex.paper,
    backgroundSize: '64px 64px',
    // No margin at the foot: the last chapter's plate (Questions) runs straight to the page's edge.
    boxShadow: '0 2px 2px rgb(42 26 22 / 0.1), 0 18px 30px -6px rgb(42 26 22 / 0.28), 0 46px 70px -10px rgb(42 26 22 / 0.3)',
  },
  // ⌃ ⌥ G on the page (PressPanel)
  // The ⌃ ⌥ G panel's message area: as tall as the paragraph's longest version (client.ts).
  pressBody: { position: 'relative', maxHeight: '42vh', overflowY: 'auto' },
  // Takes focus when it opens (as the app's panel does), so Tab, Return and Esc are its keys;
  // the focus is the panel itself, so no ring is drawn round it.
  press: { position: 'absolute', zIndex: 30, top: 0, left: 0, pointerEvents: 'auto', ':focus': { outline: 'none' }, ':focus-visible': { outline: 'none' } },
  // Everything Iris shows on the page, in the page's own coordinates (client.ts places each part).
  pressIris: { position: 'absolute', zIndex: 30, top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' },
  pressAt: { position: 'absolute', top: 0, left: 0 },
  pressNote: { zIndex: 31 },
  pressScale: { width: 720, zoom: 0.76 }, // 720: Panel.tsx's PANEL_LAYOUT
  psst: { position: 'fixed', zIndex: 20, right: 16, bottom: 16, display: { default: 'flex', [MOBILE]: 'none' }, alignItems: 'center', gap: 8, paddingBlock: 8, paddingInline: 14, backgroundColor: ink.paper, color: ink.i12, fontFamily: font.brush, fontSize: 20, lineHeight: 1.1, transform: 'rotate(-2deg)', boxShadow: '0 1px 1px rgb(42 26 22 / 0.08), 0 12px 28px -12px rgb(42 26 22 / 0.45)', maxWidth: 'calc(100vw - 24px)', cursor: 'pointer' },

  // Layout
  wrap: { width: '100%', maxWidth: 1280, marginInline: 'auto', paddingInline: 'clamp(20px, 5vw, 72px)', position: 'relative' },
  spread: { position: 'relative', paddingBlock: { default: 'clamp(56px, 7vw, 96px)', [MOBILE]: 44 }, scrollMarginTop: { default: 0, [MOBILE]: 52 }, overflow: 'clip' },
  spreadGap72: { gap: { default: 'clamp(40px, 6vw, 72px)', [MOBILE]: 26 } },
  spreadGap64: { gap: { default: 'clamp(40px, 6vw, 64px)', [MOBILE]: 26 } },
  menuIntro: { gridArea: 'intro', gap: { default: 30, [MOBILE]: 20 } },
  stack: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  body: { fontSize: { default: 15, [MOBILE]: 14 }, lineHeight: { default: 1.7, [MOBILE]: 1.65 }, color: ink.i11, margin: 0, maxWidth: '52ch' },
  meta: { fontSize: 12.5, lineHeight: 1.6, color: ink.i10, margin: 0 },
  srOnly: { position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
  // Hidden until the first Tab lands on it, then a paper slip over the cover's corner.
  skip: {
    ':focus': { position: 'fixed', zIndex: 10, top: 12, left: 12, width: 'auto', height: 'auto', overflow: 'visible', clipPath: 'none', paddingBlock: 10, paddingInline: 14, backgroundColor: ink.paper, color: ink.i12, fontSize: 13, boxShadow: '0 6px 16px -6px rgb(42 26 22 / 0.35)' },
  },
  // Cover
  plate: {
    position: 'relative',
    isolation: 'isolate',
    backgroundColor: ink.sky,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    overflow: 'clip',
    overflowClipMargin: '160px',
  },
  ghostClip: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: { default: 1, [MOBILE]: 0.55 } },
  plateInner: { minHeight: 'min(760px, 92svh)', display: 'flex', flexDirection: 'column', paddingTop: { default: 24, [MOBILE]: 18 }, paddingBottom: { default: 'clamp(56px, 8vw, 96px)', [MOBILE]: 272 }, [MOBILE]: { minHeight: 0 } },
  masthead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 2 },
  nav: { display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.4vw, 32px)', fontSize: 13, [MOBILE]: { display: 'none' } },
  navLink: { color: ink.i12, textDecoration: 'none', paddingBlock: 6, backgroundImage: 'linear-gradient(rgb(42 26 22 / 0.0), rgb(42 26 22 / 0.0))', textDecorationLine: { default: 'none', [HOVER]: { default: 'none', ':hover': 'underline' } }, textDecorationThickness: '1.5px', textUnderlineOffset: '5px' },
  coverBody: { paddingTop: { default: 'clamp(48px, 7vw, 104px)', [MOBILE]: 22 }, display: 'flex', flexDirection: 'column', gap: { default: 28, [MOBILE]: 16 }, position: 'relative', zIndex: 2, maxWidth: 'min(1000px, 72%)', [NARROW]: { maxWidth: '100%' } },
  coverTitle: { fontSize: { default: 'clamp(40px, 5.5vw, 92px)', [MOBILE]: 'clamp(26px, 7.6vw, 38px)' }, whiteSpace: { default: 'nowrap', [MOBILE]: 'normal' } },
  promise: { margin: 0, marginTop: { default: -12, [MOBILE]: -4 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { default: '8px 18px', [MOBILE]: '6px 12px' }, fontSize: { default: 14, [MOBILE]: 12.5 }, color: ink.i12 },
  promiseItem: { display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' },
  lede: { fontSize: { default: 'clamp(15px, 1.4vw, 17px)', [MOBILE]: 14 }, lineHeight: { default: 1.6, [MOBILE]: 1.5 }, color: ink.i12, margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px' },
  cta: { display: 'flex', flexWrap: 'wrap', alignItems: { default: 'center', [MOBILE]: 'flex-start' }, flexDirection: { default: 'row', [MOBILE]: 'column' }, gap: { default: '18px 28px', [MOBILE]: 10 } },
  ctaMeta: { fontSize: { default: 12.5, [MOBILE]: 11.5 }, lineHeight: { default: 1.5, [MOBILE]: 1.45 }, color: ink.i12 },
  keysNote: { display: 'flex', alignItems: { default: 'flex-end', [MOBILE]: 'center' }, gap: { default: 14, [MOBILE]: '8px 12px' }, flexWrap: 'wrap' },
  keysWords: { fontFamily: font.brush, fontSize: { default: 22, [MOBILE]: 18 }, lineHeight: 1, color: ink.i12, paddingBottom: { default: 6, [MOBILE]: 0 } },
  // Butterflies may loop past the plate's right edge: cut them there, never widen the page.
  // Only sideways, so the garden still stands below the plate.
  coverClip: { overflowX: 'clip' },
  // The cover's pause button: About's paper disc, in the plate's bottom left corner, a 32px target.
  airPause: {
    position: 'absolute',
    zIndex: 4,
    left: 'max(clamp(20px, 5vw, 72px), (100% - 1280px) / 2 + clamp(20px, 5vw, 72px))',
    bottom: { default: 18, [MOBILE]: 14 },
    display: 'grid',
    placeItems: 'center',
    width: 32,
    height: 32,
    padding: 0,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transitionProperty: 'scale',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out',
    scale: { default: '1', ':active': '0.96' },
  },

  // Moment
  // Square to the page: a turned video is resampled every frame, and its text goes soft.
  print: { position: 'relative', padding: 10, [MOBILE]: { padding: 6 } },
  video: { display: 'block', width: '100%', height: 'auto', backgroundColor: ink.paper },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: { default: 30, [MOBILE]: 18 } },
  step: { display: 'flex', flexDirection: 'column', gap: { default: 8, [MOBILE]: 6 }, transitionProperty: 'opacity', transitionDuration: '250ms' },
  stepButton: { display: 'block', padding: '2px 0', margin: 0, borderWidth: 0, backgroundColor: 'transparent', textAlign: 'start', cursor: 'pointer', color: 'inherit', font: 'inherit' },
  // A thin pen track under each step; the playing step's fills as the video goes.
  stepTrack: { position: 'relative', display: 'block', height: 2, maxWidth: { default: 260, [MOBILE]: '100%' }, backgroundColor: 'rgb(42 26 22 / 0.14)', overflow: 'hidden' },
  stepBar: { position: 'absolute', inset: 0, backgroundColor: ink.pinkText, transformOrigin: '0 50%', scale: 'var(--p, 0) 1' },
  stepTitle: { fontFamily: font.brush, fontSize: { default: 28, [MOBILE]: 23 }, lineHeight: 1, color: ink.i12, display: 'flex', alignItems: 'center', gap: { default: 12, [MOBILE]: 8 }, flexWrap: 'wrap' },
  stepText: { fontSize: { default: 14, [MOBILE]: 13.5 }, lineHeight: { default: 1.65, [MOBILE]: 1.55 }, color: ink.i11, margin: 0, maxWidth: { default: '44ch', [MOBILE]: 'none' } },
  caption: { fontSize: { default: 12, [MOBILE]: 11.5 }, color: ink.i10, marginTop: { default: 18, [MOBILE]: 12 }, display: 'flex', gap: 10, alignItems: { default: 'baseline', [MOBILE]: 'center' } },
  toggle: { marginLeft: 'auto', flex: 'none', minHeight: 24, letterSpacing: '0.08em', textTransform: 'uppercase', textDecorationLine: 'underline', textUnderlineOffset: '4px' },

  // Tones
  tonesHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap', position: 'relative' },
  corner: { position: 'relative', minWidth: 300, height: 170, flex: 'none', [MOBILE]: { display: 'none' } },
  panelStage: { position: 'relative', marginTop: { default: 'clamp(24px, 4vw, 48px)', [MOBILE]: 14 }, display: 'grid', gridTemplateColumns: 'minmax(0, 680px) minmax(0, 1fr)', gap: { default: 'clamp(20px, 3vw, 40px)', [MOBILE]: 20 }, alignItems: 'start', [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  hint: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.08em', borderWidth: 0, backgroundColor: 'transparent', padding: 0, fontFamily: font.mono, cursor: 'pointer', color: { default: ink.i10, [HOVER]: { default: ink.i10, ':hover': ink.i12 } } },
  note: { position: 'absolute', left: -6, top: -52, display: 'flex', alignItems: 'flex-end', gap: 4, fontFamily: font.brush, fontSize: 22, color: ink.i12, transform: 'rotate(-3deg)', [MOBILE]: { display: 'none' } },
  aside: { display: 'flex', flexDirection: 'column', gap: 18 },
  // The margin notes beside the panel: each placed level with what it points at.
  notes: { position: 'relative', alignSelf: 'stretch', minHeight: 380, [NARROW]: { minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 } },
  marginNote: { position: 'absolute', left: 0, right: 0, margin: 0, display: 'flex', alignItems: 'flex-start', gap: 10, transformOrigin: '0 50%', rotate: { default: 'var(--tilt, 0deg)', [NARROW]: '0deg' }, [NARROW]: { position: 'static' } },
  // Stacked under the panel on narrow pages, the notes don't point sideways.
  noteArrow: { display: 'flex', flex: 'none', [NARROW]: { display: 'none' } },
  marginWord: { display: 'block', fontFamily: font.brush, fontSize: { default: 'clamp(22px, 2vw, 27px)', [MOBILE]: 22 }, lineHeight: 1.05, color: ink.i12 },
  marginMore: { display: 'block', marginTop: 4, fontSize: 13, lineHeight: 1.5, color: ink.i11, maxWidth: { default: '30ch', [NARROW]: 'none' } },

  // The example under Fix's lead: one line, marked the way the panel marks it.
  example: { padding: '16px 20px', maxWidth: 560, rotate: '-0.6deg' },
  exampleText: { position: 'relative', margin: 0, fontSize: 'clamp(14px, 1.3vw, 16px)', fontWeight: 540, lineHeight: 1.8, color: ink.i12 },
  // A fact: its picture and its words, on the grid's two rows (subgrid), so pictures and
  // headings line up across each row however long the words run.
  // On a phone each fact becomes a swipeable card on a horizontal scroll-snap rail, keeping the
  // full asymmetrical riso collage intact while cutting ~2,500px of vertical scroll.
  fact: {
    display: { default: 'grid', [MOBILE]: 'flex' },
    flexDirection: { default: null, [MOBILE]: 'column' },
    gridTemplateRows: { default: 'subgrid', [MOBILE]: 'auto' },
    gridRow: { default: 'span 2', [MOBILE]: 'auto' },
    rowGap: { default: 18, [MOBILE]: 16 },
    gap: { default: null, [MOBILE]: 16 },
    minWidth: 0,
    [MOBILE]: { flex: '0 0 85%', scrollSnapAlign: 'start' },
  },
  factArt: { width: 'min(100%, 470px)', display: 'grid', justifyItems: 'center' },
  // The whole panel, laid out at its own width (Panel.tsx's PANEL_LAYOUT) and zoomed to fit the
  // tile by client.ts, so its footer stays on one line; 0.62 until the script has measured.
  factPanel: { width: '100%', contain: 'inline-size' }, // its 720px layout never widens the tile
  factPanelInner: { width: 780, zoom: 0.58 },
  youWrote: { position: 'relative', margin: 0, paddingBottom: 12, fontSize: 12, lineHeight: 1.6, color: ink.i10 },
  // The Mac window round a fact.
  win: { width: '100%', borderRadius: 10, overflow: 'hidden' },
  winBar: { position: 'relative', display: 'flex', alignItems: 'center', paddingBlock: 8, paddingInline: 12, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgb(42 26 22 / 0.1)' },
  lights: { display: 'flex', gap: 6 },
  light: { width: 9, height: 9, borderRadius: '50%', borderWidth: 1.3, borderStyle: 'solid', borderColor: ink.i8 },
  winTitle: { flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'safe center', gap: 6, marginLeft: 8, marginRight: 31, fontSize: 11, color: ink.i10, whiteSpace: 'nowrap' },
  winBody: { position: 'relative', padding: '12px 14px 14px', display: 'grid', gap: 10 },
  chatPrev: { margin: 0, fontSize: 12, color: ink.i10 },
  chatWho: { color: ink.i12, fontWeight: 600, marginRight: 6 },
  // The text box being written in.
  textBox: { fontSize: 'clamp(13px, 1.3vw, 14.5px)', fontWeight: 540, lineHeight: 1.9, color: ink.i12, paddingBlock: 8, paddingInline: 10, borderWidth: 1.5, borderStyle: 'solid', borderColor: 'rgb(42 26 22 / 0.22)', borderRadius: 8 },
  mailText: { fontSize: 'clamp(13px, 1.3vw, 14.5px)', fontWeight: 540, lineHeight: 1.9, color: ink.i12, paddingBottom: 26 },
  leftAlone: { margin: 0, fontFamily: font.brush, fontSize: 19, lineHeight: 1, color: ink.i11, rotate: '-1.5deg', justifySelf: 'end' },
  // Iris's note, hung over the window's bottom edge as it sits by a text box.
  overlap: { position: 'relative', marginTop: { default: -26, [MOBILE]: -14 }, width: { default: '108%', [MOBILE]: '100%' }, display: 'grid', justifyItems: 'center', rotate: { default: '-1deg', [MOBILE]: '0deg' } },
  irisNote: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { default: '8px 14px', [MOBILE]: '6px 10px' }, paddingBlock: { default: 12, [MOBILE]: 10 }, paddingInline: { default: 16, [MOBILE]: 12 }, maxWidth: '100%' },
  noteIcon: { position: 'relative', display: 'grid', placeItems: 'center' },
  noteText: { position: 'relative', display: 'grid', gap: 4, flex: '1 1 0', minWidth: 'min(150px, 100%)' },
  noteTitle: { fontFamily: font.brush, fontSize: { default: 24, [MOBILE]: 21 }, lineHeight: 1, color: ink.i12 },
  noteLine: { fontSize: 11.5, lineHeight: 1.4, color: ink.i10 },
  noteEnd: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 14, marginLeft: 'auto' },
  keepBtn: { position: 'relative', paddingBlock: 6, paddingInline: 12, fontSize: 13, fontWeight: 600, color: ink.i12 },
  noBtn: { fontSize: 13, color: ink.i10 },
  fixedWord: { position: 'relative', isolation: 'isolate', display: 'inline-block', paddingInline: 3 },
  undo: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: ink.i11 },
  facts3: {
    marginTop: { default: 'clamp(48px, 6vw, 80px)', [MOBILE]: 0 },
    display: { default: 'grid', [MOBILE]: 'flex' },
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: { default: 'clamp(36px, 4vw, 56px) clamp(28px, 4vw, 64px)', [MOBILE]: 26 },
    [NARROW]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [MOBILE]: {
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      scrollPaddingInline: 'clamp(20px, 5vw, 72px)',
      marginInline: 'calc(-1 * clamp(20px, 5vw, 72px))',
      paddingInline: 'clamp(20px, 5vw, 72px)',
      paddingTop: 22,
      paddingBottom: 18,
      scrollbarWidth: 'none',
    },
  },
  railWrap: { display: { default: 'contents', [MOBILE]: 'flex' }, flexDirection: 'column', gap: 6 },
  railWrapFix: { [MOBILE]: { marginTop: 8 } },
  railControls: { display: { default: 'none', [MOBILE]: 'flex' }, alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 },
  railMeta: { display: 'flex', alignItems: 'center', gap: 12 },
  railFolio: { fontSize: 11.5, fontWeight: 560, letterSpacing: '0.08em', color: ink.i10, fontVariantNumeric: 'tabular-nums' },
  railPips: { display: 'flex', alignItems: 'center', gap: 6 },
  railPip: {
    appearance: 'none',
    borderWidth: 0,
    padding: 0,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgb(42 26 22 / 0.22)',
    cursor: 'pointer',
    transitionProperty: 'width, background-color',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  railArrows: { display: 'flex', alignItems: 'center', gap: 8 },
  railArrow: {
    position: 'relative',
    appearance: 'none',
    borderWidth: 0,
    backgroundColor: ink.paper,
    backgroundImage: tex.paper,
    backgroundSize: '64px 64px',
    color: ink.i12,
    width: 34,
    height: 34,
    display: 'grid',
    placeItems: 'center',
    fontFamily: font.mono,
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
    ':disabled': { opacity: 0.32, cursor: 'default' },
  },
  tanPlate: {
    position: 'relative',
    isolation: 'isolate',
    backgroundColor: ink.tan,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    padding: 'clamp(24px, 3vw, 40px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    color: ink.i12,
  },
  above: { position: 'relative', zIndex: 1 },

  // Private
  pinkPlate: {
    position: 'relative',
    isolation: 'isolate',
    // A lighter pink than the plate elsewhere, so the section reads soft, with ink on it.
    backgroundColor: 'rgb(246 172 207)',
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    color: ink.i12,
    scrollMarginTop: { default: 0, [MOBILE]: 52 },
    overflow: 'clip',
  },
  onPink: { color: ink.i12 },
  // Under the title: what Iris does with your words on the left, the figures on the right.
  privateBody: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: { default: '28px clamp(32px, 6vw, 96px)', [MOBILE]: 24 }, alignItems: 'start', marginTop: { default: 'clamp(36px, 5vw, 64px)', [MOBILE]: 24 }, position: 'relative', zIndex: 1, [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  figures: { display: 'flex', gap: 'clamp(20px, 3vw, 44px)', flexWrap: 'wrap', marginTop: 8 },
  privateGhost: { display: { default: 'contents', [MOBILE]: 'none' } },
  // The privacy stickers: paper slips stuck on the pink, each a drawing and a word.
  stickers: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: { default: 'clamp(12px, 1.6vw, 18px)', [MOBILE]: 10 }, maxWidth: { default: 440, [MOBILE]: '100%' } },
  sticker: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: { default: 12, [MOBILE]: 8 },
    padding: { default: '10px 14px 10px 10px', [MOBILE]: '10px 10px 10px 8px' },
    rotate: { default: 'var(--tilt, 0deg)', [MOBILE]: '0deg' },
    // Paper slips, the white of Iris's panels, the drawings in ink with a sky plate under.
    backgroundColor: ink.paper,
    backgroundImage: tex.paper,
    backgroundSize: '64px 64px',
    boxShadow: '0 1px 1px rgb(42 26 22 / 0.08), 0 10px 18px -10px rgb(42 26 22 / 0.45)',
    clipPath: 'polygon(0.8% 2%, 30% 0.4%, 62% 1.8%, 99.2% 0.6%, 100% 50%, 99% 98.4%, 66% 100%, 34% 98.6%, 0.4% 99.6%, 1.4% 48%)',
  },
  stickerArt: { position: 'relative', flex: 'none', width: { default: 'clamp(54px, 5vw, 68px)', [MOBILE]: 42 }, aspectRatio: '1' },
  stickerSvg: { display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' },
  // Our red brush X on what Iris doesn't need, on the pin's corner, the pin left readable.
  stickerCross: { position: 'absolute', inset: '52% -8% -8% 52%' },
  stickerWord: { fontFamily: font.brush, fontSize: { default: 'clamp(18px, 1.6vw, 21px)', [MOBILE]: 17 }, lineHeight: 1.05, color: ink.i12 },
  pinkBody: { fontSize: { default: 16, [MOBILE]: 14.5 }, lineHeight: { default: 1.75, [MOBILE]: 1.65 }, margin: 0, maxWidth: '44ch', color: ink.i12 },

  // Make it yours: the list beside a torn sheet of How it works' green, Iris's Settings window
  // lying on it. On wide pages the sheet is as tall as the list and the window fills it to its foot.
  // On narrow pages the window comes between the title and the list, so a tap shows its page in view.
  yoursGrid: { display: 'grid', gridTemplateColumns: { default: 'minmax(0, 0.72fr) minmax(0, 1.28fr)', [NARROW]: 'minmax(0, 1fr)' }, gridTemplateRows: { default: 'auto 1fr', [NARROW]: 'auto' },
    gridTemplateAreas: { default: '"title stage" "list stage"', [NARROW]: '"title" "stage" "list"' }, columnGap: 'clamp(32px, 4vw, 64px)', rowGap: { default: 40, [MOBILE]: 24 }, alignItems: 'start' },
  yoursList: { [MOBILE]: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 14px' } },
  yoursText: { [MOBILE]: { fontSize: 12.5, lineHeight: 1.5 } },
  yoursStage: { gridArea: 'stage', position: 'relative', isolation: 'isolate', alignSelf: { default: 'stretch', [NARROW]: 'start' }, containerType: 'inline-size',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px',
    // The window sits on the sheet with the sheet showing round it, below as at the sides.
    padding: { default: 'clamp(56px, 5.4vw, 76px) clamp(16px, 4.5%, 44px) clamp(16px, 4.5%, 44px)', [MOBILE]: '42px 12px 12px' },
    clipPath: 'polygon(0.6% 1%, 27% 0%, 55% 1.4%, 81% 0.2%, 99.4% 1.2%, 100% 31%, 99.2% 66%, 100% 99%, 70% 99.8%, 41% 98.8%, 16% 100%, 0.4% 99%, 1.2% 62%, 0% 28%)' },
  yoursNote: { position: 'absolute', zIndex: 1, left: { default: 'clamp(28px, 5vw, 64px)', [MOBILE]: 14 }, top: { default: 'clamp(14px, 1.6vw, 22px)', [MOBILE]: 10 }, whiteSpace: 'nowrap', display: 'flex', alignItems: 'flex-start', gap: 4, fontFamily: font.brush, fontSize: { default: 22, [MOBILE]: 18 }, lineHeight: 1, color: ink.paper, transform: 'rotate(-3deg)' },
  yoursStep: { cursor: 'pointer' },
  // At least 62% as tall as it's wide (on narrow pages, just that). The pages have no foot, so
  // below a short one the window runs on in the same paper; a long one fades into that paper
  // just above the window's foot, which ends cleanly, corners and shadow and all.
  yoursFrame: { flex: '1 1 auto', display: 'flex', minHeight: '62cqw', filter: 'drop-shadow(0 14px 22px rgb(0 0 0 / 0.3)) drop-shadow(0 0 0.5px rgb(0 0 0 / 0.5))' },
  yoursWindow: { position: 'relative', flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgb(250 247 244)',
  },
  // The paper over a long page's last lines, so it fades out inside the window, not through it.
  yoursFade: { position: 'absolute', zIndex: 1, insetInline: 0, bottom: 0, height: '16%', pointerEvents: 'none', backgroundImage: 'linear-gradient(to bottom, rgb(250 247 244 / 0), rgb(250 247 244) 85%)' },
  yoursPage: { position: 'absolute', insetInline: 0, top: 0 },
  yoursLights: { position: 'absolute', zIndex: 2, left: '2.4%', top: '2.2%', display: 'flex', gap: '1.1%', width: '100%' },
  yoursLight: { width: '1.9%', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'rgb(42 26 22 / 0.16)', boxShadow: 'inset 0 0 0 1px rgb(42 26 22 / 0.12)' },
  yoursShot: { display: 'block', width: '100%', height: 'auto' },
  methodText: { fontSize: 13.5, lineHeight: 1.6, color: ink.i11, margin: 0 },

  // How it works: the steps, and the desk beside them as tall as they are.
  // On narrow pages the desk comes right under the title, so tapping a step shows it in view.
  momentGrid: { display: 'grid', gridTemplateColumns: { default: 'minmax(max-content, 0.85fr) minmax(0, 1.8fr)', [NARROW]: 'minmax(0, 1fr)' }, gridTemplateRows: { default: 'auto 1fr', [NARROW]: 'auto' }, gridTemplateAreas: { default: '"title stage" "steps stage"', [NARROW]: '"title" "stage" "steps"' }, columnGap: 'clamp(32px, 4vw, 52px)', rowGap: { default: 44, [NARROW]: 24 }, alignItems: 'stretch' },
  deskFigure: { gridArea: 'stage', margin: 0, display: 'flex', flexDirection: 'column', minWidth: 0 },
  deskStage: {
    position: 'relative', isolation: 'isolate', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    padding: { default: 'clamp(24px, 3vw, 44px) 0 0 clamp(24px, 3vw, 44px)', [MOBILE]: '14px 10px 0 10px' },
    backgroundColor: 'rgb(248 200 222)', backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px',
    // At least this tall, so the Mac can take the sheet's whole width.
    minHeight: 'clamp(460px, 40vw, 600px)',
    containerType: 'size', [NARROW]: { containerType: 'normal', flex: 'none', minHeight: 0 },
    clipPath: 'polygon(0.4% 1%, 21% 0%, 48% 1.4%, 76% 0.2%, 99.4% 1.2%, 100% 31%, 99.2% 66%, 100% 99.2%, 74% 100%, 46% 98.8%, 20% 99.8%, 0.6% 98.6%, 0% 70%, 1.2% 36%)',
  },
  // Menu
  // On narrow pages the title and explanation come first, then the Mac menu bar, then setup steps.
  menuGrid: { display: 'grid', gridTemplateColumns: { default: 'minmax(0, 1.2fr) minmax(0, 1fr)', [NARROW]: 'minmax(0, 1fr)' }, gridTemplateRows: { default: 'auto 1fr', [NARROW]: 'auto' }, gridTemplateAreas: { default: '"stage intro" "stage steps"', [NARROW]: '"intro" "stage" "steps"' }, columnGap: 'clamp(32px, 5vw, 80px)', rowGap: { default: 30, [MOBILE]: 24 }, alignItems: 'stretch' },
  // The arrow's tip lands on the menu bar's flower (40% across the screen, in the corner's own
  // units, so it follows the flower at every size); the words trail off up and to the right.
  // A torn tan sheet under the Mac, rings spreading from where Iris's flower sits. The Mac sits
  // in its bottom left corner, cut by the sheet's torn edges.
  macStage: { gridArea: 'stage', position: 'relative', isolation: 'isolate', backgroundColor: ink.tan, backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px', // The Mac runs to the sheet's bottom and left edges; room is left above it and to its right.
    padding: { default: 'clamp(52px, 4.6vw, 66px) clamp(28px, 4vw, 56px) 0 0', [MOBILE]: '56px 14px 0 0' }, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
    // As tall as the words beside it; the Mac grows to fill it (Backdrop.tsx), keeping its shape.
    alignSelf: 'stretch', containerType: 'size', [NARROW]: { containerType: 'normal' }, clipPath: 'polygon(0.6% 1.4%, 24% 0.2%, 52% 1.6%, 79% 0%, 99.4% 1%, 100% 34%, 99.2% 68%, 100% 99%, 72% 99.8%, 44% 98.6%, 18% 100%, 0.4% 98.8%, 1.2% 64%, 0% 30%)', justifySelf: 'stretch' },
  menuNote: { position: 'absolute', zIndex: 1, left: 'calc(40cqw - 14px)', bottom: 'calc(100% + 3px)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'flex-start', gap: 4, fontFamily: font.brush, fontSize: { default: 22, [MOBILE]: 18 }, lineHeight: 1, color: ink.i12, transformOrigin: '0 100%', transform: 'rotate(-4deg)' },
  menuImg: { width: '100%', height: 'auto' },
  setupList: { listStyle: 'none', margin: 0, padding: 0 },
  setupItem: { display: 'flex', flexDirection: 'column', gap: 4, paddingBlock: { default: 14, [MOBILE]: 10 } },
  setupTitle: { fontFamily: font.brush, fontSize: { default: 24, [MOBILE]: 21 }, lineHeight: 1.1, color: ink.i12 },

  // Install
  installHead: { display: 'flex', alignItems: { default: 'flex-end', [MOBILE]: 'flex-start' }, flexDirection: { default: 'row', [MOBILE]: 'column' }, justifyContent: 'space-between', gap: { default: '28px 48px', [MOBILE]: 16 }, flexWrap: 'wrap' },
  installSteps: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: { default: 'grid', [MOBILE]: 'flex' },
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: { default: 'clamp(36px, 4vw, 56px) clamp(24px, 3vw, 48px)', [MOBILE]: 26 },
    [NARROW]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [MOBILE]: {
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      scrollPaddingInline: 'clamp(20px, 5vw, 72px)',
      marginInline: 'calc(-1 * clamp(20px, 5vw, 72px))',
      paddingInline: 'clamp(20px, 5vw, 72px)',
      paddingTop: 22,
      paddingBottom: 18,
      scrollbarWidth: 'none',
    },
  },
  installFoot: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: { default: 'clamp(40px, 6vw, 96px)', [MOBILE]: 32 }, alignItems: 'start', [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  specs: { margin: 0, display: 'flex', flexDirection: 'column', fontSize: { default: 13.5, [MOBILE]: 12.5 } },
  needs: { display: 'flex', flexDirection: 'column', gap: { default: 36, [MOBILE]: 24 } },
  needGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  needTitle: { margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: font.brush, fontWeight: 400, fontSize: { default: 28, [MOBILE]: 24 }, lineHeight: 1, color: ink.i12 },
  needAction: { display: 'flex', paddingTop: 14 },
  specRow: { display: 'grid', gridTemplateColumns: 'auto 1fr', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom', backgroundSize: '100% 6px' },
  specTerm: { fontSize: { default: 11.5, [MOBILE]: 11 }, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink.i10, paddingBlock: { default: 12, [MOBILE]: 10 }, paddingRight: { default: 24, [MOBILE]: 14 } },
  specDef: { margin: 0, paddingBlock: { default: 12, [MOBILE]: 10 }, textAlign: 'right', color: ink.i12, lineHeight: 1.5 },
  why: { padding: { default: 'clamp(22px, 3vw, 32px)', [MOBILE]: '20px 18px' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, rotate: { default: '0.8deg', [MOBILE]: '0deg' } },
  whyTitle: { position: 'relative', fontFamily: font.brush, fontSize: { default: 28, [MOBILE]: 24 }, lineHeight: 1, color: ink.i12 },
  whyText: { position: 'relative', margin: 0, fontSize: { default: 14, [MOBILE]: 13.5 }, lineHeight: { default: 1.7, [MOBILE]: 1.65 }, color: ink.i11, maxWidth: '52ch' },
  // The drawings on the steps' collages.
  finderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 10, paddingBlock: '14px 6px' },
  finderItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  finderIcon: { height: 60, display: 'grid', placeItems: 'center' },
  finderName: { fontSize: 11, color: ink.i12 },
  dragNote: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: font.brush, fontSize: 20, lineHeight: 1, color: ink.i12, rotate: '-4deg', marginTop: -18 },
  macBtn: { position: 'relative', display: 'inline-flex', alignItems: 'center', paddingBlock: 4, paddingInline: 10, fontSize: 11, color: ink.i12, whiteSpace: 'nowrap', isolation: 'isolate' },
  macRing: { position: 'absolute', inset: '-55% -22%', zIndex: -1, opacity: 0.9 },
  // The dialog, and System Settings behind it, lower down and to the right. On a phone the
  // collage is the page's width, so both take more of it and their lines stop wrapping early.
  askStack: { display: 'grid', width: '100%', justifyItems: 'start' },
  dialog: { width: { default: '64%', [MOBILE]: '84%' }, minWidth: 210, display: 'grid', justifyItems: 'center', gap: 6, padding: '14px 14px 16px', borderRadius: 10, textAlign: 'center', rotate: '-1.5deg', zIndex: 1 },
  dialogTitle: { position: 'relative', fontSize: 12.5, fontWeight: 600, color: ink.i12 },
  dialogLine: { position: 'relative', fontSize: 10.5, lineHeight: 1.45, color: ink.i10 },
  dialogButtons: { position: 'relative', display: 'flex', gap: 12, marginTop: 8 },
  askSettings: { width: { default: '86%', [MOBILE]: '100%' }, justifySelf: 'end', marginTop: -8 },
  secLabel: { fontSize: 11.5, fontWeight: 600, color: ink.i12, paddingTop: 10 },
  secRow: { display: 'grid', justifyItems: 'start', gap: 10, paddingBottom: 6 },

  // New
  shelfGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 'clamp(32px, 5vw, 72px)', alignItems: 'end', marginTop: 'clamp(40px, 6vw, 64px)', [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  shelf: { position: 'relative', height: 'clamp(300px, 34vw, 420px)', [MOBILE]: { height: 300 } },
  book: {
    position: 'absolute',
    width: 'clamp(118px, 13vw, 168px)',
    [MOBILE]: { width: 104 },
    aspectRatio: '3 / 4.1',
    borderWidth: 0,
    padding: 0,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontFamily: font.mono,
    transitionProperty: 'transform',
    transitionDuration: { default: '450ms', [STILL]: '0s' },
    transitionTimingFunction: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
    transform: { default: null, '@media (hover: hover) and (prefers-reduced-motion: no-preference)': { default: null, ':hover': 'translateY(-8px) rotate(-1deg)' } },
  },
  cover: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '12px 12px 12px 18px', textAlign: 'left', color: ink.i12, boxShadow: '6px 10px 18px -8px rgb(42 26 22 / 0.4)' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, backgroundColor: 'rgb(42 26 22 / 0.18)' },
  pages: { position: 'absolute', right: -6, top: 4, bottom: -2, width: 6, backgroundColor: ink.paper, backgroundImage: 'repeating-linear-gradient(90deg, rgb(42 26 22 / 0.25) 0 1px, transparent 1px 2px)', transform: 'skewY(-10deg)', transformOrigin: 'left' },
  mast: { display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.12em', fontWeight: 600 },
  coverVer: { marginTop: 'auto', fontStretch: '75%', fontWeight: 420, fontSize: { default: 'clamp(30px, 3.4vw, 44px)', [MOBILE]: 24 }, lineHeight: 0.9, letterSpacing: '-0.03em' },
  coverTitleText: { fontFamily: font.brush, fontSize: { default: 'clamp(15px, 1.5vw, 19px)', [MOBILE]: 13 }, lineHeight: 1.1, marginTop: 6 },
  yours: { position: 'absolute', bottom: '34%', right: { default: -22, [MOBILE]: -4 } },
  facts: { display: 'flex', flexDirection: 'column', gap: 16 },
  factsNo: { fontSize: 12, letterSpacing: '0.14em', color: ink.i10 },
  bigVer: { display: 'flex', alignItems: 'baseline', gap: 6, fontStretch: '75%', fontWeight: 400, fontSize: 'clamp(72px, 10vw, 136px)', lineHeight: 0.8, letterSpacing: '-0.04em', color: ink.i12 },
  v: { fontFamily: font.brush, fontSize: '0.5em', color: ink.pinkText, letterSpacing: 0 },
  factsTitle: { fontFamily: font.brush, fontSize: 32, lineHeight: 1.05, color: ink.i12, margin: 0 },
  changes: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  change: { display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, fontSize: 13.5, lineHeight: 1.55, color: ink.i11 },
  changeTitle: { color: ink.i12, display: 'block' },
  // Sticky compact mobile jump bar: hidden on desktop, slides in on phones once past the cover.
  jumpBar: {
    display: { default: 'none', [MOBILE]: 'flex' },
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    flexDirection: 'column',
    backgroundColor: 'rgb(255 252 249 / 0.96)',
    backgroundImage: tex.paper,
    backgroundSize: '64px 64px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 8px 20px -14px rgb(42 26 22 / 0.45)',
    paddingTop: 'max(6px, env(safe-area-inset-top))',
  },
  jumpInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingInline: 14,
    paddingBottom: 7,
    minHeight: 40,
  },
  jumpBrand: {
    appearance: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: '2px 0',
    margin: 0,
    cursor: 'pointer',
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  jumpLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    flex: '1 1 auto',
    minWidth: 0,
  },
  jumpBtn: {
    position: 'relative',
    isolation: 'isolate',
    appearance: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: font.mono,
    fontSize: 11,
    fontWeight: 500,
    color: ink.i10,
    padding: '6px 7px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flex: 'none',
  },
  jumpMark: {
    position: 'absolute',
    zIndex: -1,
    left: 2,
    right: 2,
    bottom: 3,
    height: 9,
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    pointerEvents: 'none',
  },
  jumpGet: {
    position: 'relative',
    isolation: 'isolate',
    appearance: 'none',
    borderWidth: 0,
    backgroundColor: ink.i12,
    backgroundImage: tex.inkDark,
    backgroundSize: '210px 210px',
    color: ink.paper,
    fontFamily: font.mono,
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 2,
    cursor: 'pointer',
    flex: 'none',
    whiteSpace: 'nowrap',
  },
  jumpRule: { display: 'block', width: '100%', lineHeight: 0 },
});


// ── Cover ─────────────────────────────────────────────────────────────────────────────
/** Where one of the cover's clouds sits (Atmosphere.tsx's COVER_CLOUDS), held to the frame
 *  edges it runs off and scaled with the cover (`--u`, global.css), and how it drifts. `out`:
 *  how much further out through its top or bottom edge it sits. */
function coverCloud(name: CoverCloudName, x: 'left' | 'right', y: 'top' | 'bottom', delay: number, out = '0px'): React.CSSProperties {
  const { box: [l, t, w, h], drift: [dx, dy, s] } = COVER_CLOUDS[name];
  const u = (v: number) => `calc(${v} * var(--u))`;
  return {
    [x]: u(x === 'left' ? l : 1440 - l - w),
    [y]: `calc(${y === 'top' ? t : 760 - t - h} * var(--u) - ${out})`,
    width: u(w),
    ['--dx' as string]: u(dx),
    ['--dy' as string]: u(dy),
    ['--dd' as string]: `${s}s`,
    ['--dl' as string]: `${delay}s`,
  };
}
function Cover() {
  return (
    <header {...stylex.props(s.coverClip)}>
      <div {...stylex.props(s.plate)}>
        <span {...stylex.props(s.ghostClip)} {...ENTER.ghost}>
          <GhostWord lines={['TO', 'NE']} tone="sky" style={{ left: '0.3vw', top: 70, fontSize: 'clamp(180px, 30vw, 440px)' }} />
        </span>
        {/* The air in the sky, behind the words (About's meadow, Atmosphere.tsx): riso cumulus
            hanging from the top-left corner and rising behind the garden (the one the sun is
            tucked under is the garden's, in the sun's own plane), dust drifting in its light, a
            few petals on the breeze. */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'clip', pointerEvents: 'none' }}>
        <div data-air-depth="far" style={{ position: 'absolute', inset: 0 }}>
          <div data-air="live">
            {/* Narrower, the headline sits higher and further left, under the cloud's deepest
                part: the cloud rises a little with it (--lift, global.css), so it stays clear. */}
            <span data-cover-cloud {...withEnter(ENTER.cloudLeft, coverCloud('left', 'left', 'top', -18, 'var(--lift)'))}>
              <CoverCloud name="left" />
            </span>
            {/* On a short cover the words come down toward it: it sinks (--sink, global.css). */}
            <span data-cover-cloud {...withEnter(ENTER.cloudBank, coverCloud('bank', 'right', 'bottom', -31, 'var(--sink)'))}>
              <CoverCloud name="bank" />
            </span>
            <Dust seed={21} count={30} area={[38, 100, 12, 92]} />
            <Petals seed={33} count={5} band={[16, 64]} />
          </div>
          {/* Before sunrise: the night over the sky, lifting as the cover comes in (Entry.ts). */}
          <span data-dawn {...ENTER.dawn} />
        </div>
        </div>
        <div {...stylex.props(s.wrap, s.plateInner)}>
          <div {...stylex.props(s.masthead)}>
            <a href="/" aria-label="Iris, home" {...withEnter(ENTER.wordmark, { textDecoration: 'none' })}>
              <Wordmark size="clamp(34px, 3.4vw, 44px)" />
            </a>
            <nav aria-label="On this page" {...stylex.props(s.nav)} {...ENTER.nav}>
              <a href="#moment" {...stylex.props(s.navLink)}>How it works</a>
              <a href="#private" {...stylex.props(s.navLink)}>Privacy</a>
              <a href="#install" {...stylex.props(s.navLink)}>Install</a>
              <a href="#questions" {...stylex.props(s.navLink)}>Questions</a>
            </nav>
          </div>
          <div {...stylex.props(s.coverBody)}>
            <PageTitle level={1} lines={['Fix your grammar', 'Change your tone']} xstyle={s.coverTitle} attrs={ENTER.title} starAttrs={ENTER.star} />
            <p {...stylex.props(s.lede)} {...ENTER.lede}>
              <span data-tones="lede">Works right inside any app on your Mac. No copy-pasting.</span>
            </p>
            {/* The promise, said plainly: Iris has no server to send anything to. */}
            <p {...stylex.props(s.promise)} {...ENTER.promise}>
              <span {...ENTER.promiseStamp}>
                <InkLabel>100% on your Mac</InkLabel>
              </span>
              {['No cloud', 'No sign-up', 'Works offline'].map((t) => (
                <span key={t} {...stylex.props(s.promiseItem)}>
                  <HandTick size={15} color="rgb(42 26 22)" /> {t}
                </span>
              ))}
            </p>
            <div {...stylex.props(s.cta)} {...ENTER.cta}>
              <GetIris />
              <span {...stylex.props(s.ctaMeta)} {...ENTER.ctaMeta}>
                <Platforms />
              </span>
            </div>
            <div {...stylex.props(s.keysNote)} {...ENTER.keys}>
              <KeyRow keys={['⌃', '⌥', 'G']} labeled />
              <span {...stylex.props(s.keysWords)} {...ENTER.keysWords}>
                <OnMac>in any text box</OnMac>
                <OnTouch>on your Mac, in any text box</OnTouch>
              </span>
            </div>
          </div>
        </div>
        <Garden />
        {/* Right in front of the lens: big soft leaves in the bottom corners, and a butterfly
            drifting a little out of focus through the open sky over the headline, where the
            cover is wide enough for it to keep clear of the words (About's foreground,
            Atmosphere.tsx). */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 3, overflow: 'clip', pointerEvents: 'none' }}>
          {/* Rooted below the frame, as the flower is: they sway, but never leave the edge. */}
          <div data-air="live" data-air-front>
            <span data-lens="left" {...withEnter(ENTER.lens, { left: 0, width: 'min(6.4vw, 100px)', ['--d' as string]: '6.4s', ['--delay' as string]: '-2s' })}>
              <Lens side="left" seed={5} />
            </span>
            <span data-lens="right" {...withEnter(ENTER.lens, { right: 0, width: 'min(12vw, 180px)', ['--d' as string]: '7.2s', ['--delay' as string]: '-5s' })}>
              <Lens side="right" seed={9} />
            </span>
          </div>
        <div data-air-depth="near" style={{ position: 'absolute', inset: 0 }}>
          <div data-air="live" data-air-front>
            <span {...withEnter(ENTER.closeFly, { position: 'absolute', inset: 0 })}>
              {FLUTTER.map((f, i) => (
                <span key={i} data-close-box data-air-wide={f.wide ? undefined : ''} data-air-full={f.wide ? '' : undefined} style={f.box}>
                  <span data-close-path data-flutter style={{ width: f.size, ['--round' as string]: `${f.round}s`, ['--from' as string]: `${f.from}s`, ['--way' as string]: f.back ? 'reverse' : 'normal', ['--flap' as string]: `${f.flap}ms`, ['--hue' as string]: `${f.hue ?? 0}deg` }}>
                    <CloseButterfly sprite={f.sprite} />
                  </span>
                </span>
              ))}
            </span>
          </div>
        </div>
        </div>
        {/* Stops everything on the cover that moves on its own, as About's does (WCAG 2.2.2). */}
        <button type="button" data-air-pause aria-label="Pause the animation" hidden {...stylex.props(s.airPause)} {...ENTER.pause}>
          <svg aria-hidden viewBox="0 0 26 26" width={26} height={26}>
            <circle cx={13} cy={13} r={12} fill="rgb(255 252 249 / 0.92)" />
            <path d="M13,1.6C19.6,1.3 24.6,6.4 24.4,13.2C24.2,19.7 19.1,24.6 12.7,24.4C6.4,24.2 1.5,19.2 1.7,12.8C1.9,6.6 6.8,1.8 13,1.6Z" fill="none" stroke="rgb(42 26 22 / 0.55)" strokeWidth={1.1} />
            <g data-air-pause-mark fill="rgb(42 26 22)">
              <rect x={9.4} y={8} width={2.6} height={10} rx={1.3} />
              <rect x={14} y={8} width={2.6} height={10} rx={1.3} />
            </g>
            <path data-air-play-mark d="M10.5,7.5L19.5,13L10.5,18.5Z" fill="rgb(42 26 22)" />
          </svg>
        </button>
      </div>
    </header>
  );
}

// ── 02 The moment ─────────────────────────────────────────────────────────────────────
const MOMENT_STEPS: { title: string; keys?: string[]; text: React.ReactNode }[] = [
  {
    title: 'Press',
    keys: ['⌃', '⌥', 'G'],
    text: (
      <>
        In any app: <AppName app="slack" />, <AppName app="mail" />, <AppName app="messages" />, <AppName app="notes" />, <AppName app="chrome" />, <AppName app="safari" />, and more. Highlight text to fix just that part.
      </>
    ),
  },
  { title: 'Read', text: 'See every fix highlighted before anything changes.' },
  {
    title: 'Replace',
    keys: ['↵'],
    text: (
      <>
        Press Return to swap it in. Hit <KeyRow keys={['⌘', 'Z']} /> anytime to undo.
      </>
    ),
  },
];

function Moment() {
  return (
    <section id="moment" aria-labelledby="moment-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack, s.spreadGap72)}>
        <RunningHead seed={21} cols={['How it works']} />
        <div {...stylex.props(s.momentGrid)}>
          <div style={{ gridArea: 'title' }}>
            <PageTitle id="moment-title" lines={['One', 'shortcut']} small />
          </div>
          {/* The steps are chapters of the recording beside them: pick one to see it; as the
              video plays, the step it's on lights up and its line fills (client.ts). */}
          <ol {...stylex.props(s.steps)} data-chapters={CHAPTERS.join(',')} style={{ gridArea: 'steps' }}>
            {MOMENT_STEPS.map((st, i) => (
              <li key={st.title} {...stylex.props(s.step)} data-chapter={i} data-active={i === 0}>
                <button type="button" {...stylex.props(s.stepButton)} aria-label={`Show step ${i + 1}: ${st.title}`}>
                  <span {...stylex.props(s.stepTitle)}>
                    {st.title} {st.keys && <KeyRow keys={st.keys} />}
                  </span>
                </button>
                <span aria-hidden {...stylex.props(s.stepTrack)}>
                  <span data-chapter-bar {...stylex.props(s.stepBar)} />
                </span>
                <p {...stylex.props(s.stepText)}>{st.text}</p>
              </li>
            ))}
          </ol>
          <figure {...stylex.props(s.deskFigure)}>
            {/* A torn pink sheet with waves, the Mac flush to its right and bottom (as the menu bar's Mac is to its left). */}
            <div {...stylex.props(s.deskStage)}>
              <Pattern kind="waves" color="rgb(242 178 208)" seed={23} scale={1.2} />
              <Desk />
            </div>
            <figcaption {...stylex.props(s.caption)}>
              <span>Tap any step to jump ahead.</span>
              <button type="button" data-moment-toggle {...stylex.props(s.hint, s.toggle)}>Pause</button>
              <span {...stylex.props(s.srOnly)}>
                An animation: on a Mac, a reply is waiting in Slack. ⌃ ⌥ G is pressed, Iris’s flower grows by the text box and its panel marks the fixes; Return puts them in. Then the same in Mail, Messages, Notes, Chrome and Safari.
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

// ── 03 Tones ──────────────────────────────────────────────────────────────────────────
/* The margin notes round 03's panel, top to bottom: `top` is where each sits beside it (px from
 * the stage's top), level with the part it points at. */
const PANEL_NOTES: { text: string; more: React.ReactNode; top: number; tilt: number; seed: number }[] = [
  { text: 'or change the tone', more: 'Professional, Friendly, Shorter, Clearer, or your own', top: 70, tilt: -2, seed: 81 },
  { text: 'fixes, not rewrites', more: 'crossed out = removed, pink = fixed. Your “hey” stays', top: 168, tilt: 1.5, seed: 82 },
  { text: 'you stay in control', more: <>nothing pastes until you hit Return. <KeyRow keys={['⌘', 'Z']} /> undoes it</>, top: 300, tilt: -1.5, seed: 83 },
];

/** A pen arrow pointing left, at the panel. */
function NoteArrow({ seed }: { seed: number }) {
  const r = rng(seed), y = 8 + r() * 8;
  return (
    <svg aria-hidden width={52} height={30} viewBox="0 0 52 30" style={{ flex: 'none', overflow: 'visible', marginTop: 4 }}>
      <path d={`M50,${y.toFixed(1)} C36,${(y - 8).toFixed(1)} 18,2 5,15`} fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" />
      <path d="M13,13.5 L5,15.5 L8,7.5" fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** How wide section 03's panel is laid out on a phone (px), then zoomed to fit: the most its five
 *  tone names need on one line, with Professional chosen, at the phone's tighter gap. */
const PHONE_PANEL = 440;

function Tones() {
  return (
    <section id="tones" aria-labelledby="tones-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack, s.spreadGap72)}>
        <RunningHead seed={31} cols={['Fix and tones']} />
        <div {...stylex.props(s.tonesHead)}>
          <PageTitle id="tones-title" lead="Fix" lines={['', 'or change tone']} small />
          <div {...stylex.props(s.corner)}>
            <GhostWord lines={['VOI', 'CE']} tone="pink" style={{ right: -40, top: -30, fontSize: 150 }} />
            <span style={{ position: 'absolute', right: 10, top: 40 }}>
              <HandWord word="TONE" size="92px" />
            </span>
          </div>
        </div>
        <div {...stylex.props(s.panelStage)}>
          <PanelScene>
            {/* Where its footer would wrap the panel drops its key hints, and on a phone it's laid
                out PHONE_PANEL wide and zoomed to the room (client.ts), so its tones and its
                footer each keep to one line, as the app's do. */}
            <div style={{ position: 'relative' }} data-phone-panel={PHONE_PANEL}>
            <span {...stylex.props(s.note)} aria-hidden>
              click a tone to try it
              <HandArrow width={46} height={40} flip seed={9} />
            </span>
            <div>
            <Panel
              tabs={tones.map((t) => t.name)}
              tab={(i) => ({ id: `tab-${i}`, 'aria-controls': `tone-${i}`, 'data-tab': i })}
              app={{ name: 'Slack', icon: 'slack' }}
              hooks={{ root: { 'data-panel': true }, keys: { 'data-panel-keys': true }, next: { 'data-next': true }, replaceWrap: { 'data-replace-wrap': true }, replace: { 'data-replace': '' } }}
              after={
                <>
                  <span role="status" data-said {...stylex.props(s.srOnly)} />
                </>
              }
            >
              <MessageStack
                sizers={tones.map((t) => (
                  <p {...stylex.props(panel.message)}>
                    <Marks text={t.text} from={draft} />
                  </p>
                ))}
              >
                {tones.map((t, i) => (
                  <p key={t.name} role="tabpanel" id={`tone-${i}`} aria-labelledby={`tab-${i}`} hidden={i !== 0} {...stylex.props(panel.message)} data-tone={i}>
                    <Marks text={t.text} from={draft} />
                  </p>
                ))}
              </MessageStack>
            </Panel>
            </div>
          </div>
          </PanelScene>
          {/* Margin notes, as an editor writes round a proof: each points at the part of the
              panel it's about. On narrow pages they stack under the panel. */}
          <div {...stylex.props(s.notes)}>
            {PANEL_NOTES.map((n) => (
              <p key={n.text} {...stylex.props(s.marginNote)} style={{ top: n.top, ['--tilt' as string]: `${n.tilt}deg` }}>
                <span {...stylex.props(s.noteArrow)}>
                  <NoteArrow seed={n.seed} />
                </span>
                <span>
                  <span {...stylex.props(s.marginWord)}>{n.text}</span>
                  {n.more && <span {...stylex.props(s.marginMore)}>{n.more}</span>}
                </span>
              </p>
            ))}
          </div>
        </div>
        {/* The small print of Fix, two by two on desktop; swipeable collage rail on phones. */}
        <div {...stylex.props(s.railWrap, s.railWrapFix)} data-rail="fix">
          <div {...stylex.props(s.facts3)} data-scrolls data-rail-track>
            {FIX_FACTS.map((f, i) => (
              <div key={f.title} {...stylex.props(s.fact)} data-rail-slide>
                <FactStage look={f.look} seed={61 + i * 7}>
                  <div inert aria-hidden {...stylex.props(s.factArt)}>
                    {f.art}
                  </div>
                  <p {...stylex.props(s.srOnly)}>{f.alt}</p>
                </FactStage>
                <SectionHead title={f.title} seed={43 + i}>
                  {f.text}
                </SectionHead>
              </div>
            ))}
          </div>
          <RailControls count={FIX_FACTS.length} label="Fix details" seed={47} />
        </div>
      </div>
    </section>
  );
}
const tapeLabel = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30' preserveAspectRatio='none'><path d='M2,1L98,0L96.5,6L99.5,12L97,18L99.4,24L98,30L1,29L3,23L0.5,17L2.6,11L0.4,5Z'/></svg>")}")`;


// Each fact shown with the app's own pieces, drawn on the page so the words are ours to choose.
/** A Mac window, small: three lights, the app's name, and a body. */
function MacWindow({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div {...stylex.props(panel.sheet, s.win)}>
      <span {...stylex.props(panel.grain)} />
      <div {...stylex.props(s.winBar)}>
        <span {...stylex.props(s.lights)}>
          {[0, 1, 2].map((i) => (
            <span key={i} {...stylex.props(s.light)} />
          ))}
        </span>
        <span {...stylex.props(s.winTitle)}>
          {icon && <img src={`/app/${icon}.png`} alt="" width={14} height={14} loading="lazy" decoding="async" />}
          {title}
        </span>
      </div>
      <div {...stylex.props(s.winBody)}>{children}</div>
    </div>
  );
}

/** One of Iris's notes by the text box, as the app draws it: paper, a brush line, mono under it. */
function IrisNote({ icon, title, line, end }: { icon: React.ReactNode; title: React.ReactNode; line?: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div {...stylex.props(panel.sheet, s.irisNote)}>
      <span {...stylex.props(panel.grain)} />
      <span {...stylex.props(s.noteIcon)}>{icon}</span>
      <span {...stylex.props(s.noteText)}>
        <span {...stylex.props(s.noteTitle)}>{title}</span>
        {line && <span {...stylex.props(s.noteLine)}>{line}</span>}
      </span>
      {end && <span {...stylex.props(s.noteEnd)}>{end}</span>}
    </div>
  );
}

/** The app's "?" for a question: a pen ring in pink ink round a brush question mark. */
function AskMark() {
  return (
    <svg viewBox="0 0 30 30" width={30} height={30} aria-hidden>
      <path d="M15,2.6C22.4,2.4 27.6,7.8 27.4,15.2C27.2,22.4 21.8,27.6 14.6,27.4C7.6,27.2 2.4,21.8 2.6,14.6C2.8,8.2 7.4,3 14.2,2.8" fill="none" stroke="rgb(142 36 83)" strokeWidth={2} strokeLinecap="round" />
      <text x="15" y="21" textAnchor="middle" fontFamily="Caveat Brush, cursive" fontSize="17" fill="rgb(142 36 83)">?</text>
    </svg>
  );
}

const FIX_FACTS: { title: string; look: FactLook; art: React.ReactNode; alt: string; text: React.ReactNode }[] = [
  {
    title: 'Leaves things alone',
    look: 'sky',
    alt: 'A Slack message: “hey @sam, can’t make #launch on friday 🙃”. Iris fixed “cant” and left @sam, #launch and the emoji as they were.',
    text: 'Names, @mentions, links, and emoji stay untouched.',
    art: (
      <MacWindow title="Slack" icon="slack">
        <p {...stylex.props(s.chatPrev)}>
          <b {...stylex.props(s.chatWho)}>maya</b> who’s in for the launch?
        </p>
        <div {...stylex.props(s.textBox)}>
          hey <span data-kept>@sam</span>, <del {...stylex.props(panel.gone)}>cant</del> <ins {...stylex.props(panel.added)}>can’t</ins> make <span data-kept>#launch</span> on friday <span data-kept>🙃</span>
        </div>
        <p {...stylex.props(s.leftAlone)}>circled: left just as you typed them</p>
      </MacWindow>
    ),
  },
  {
    title: 'Learns your words',
    look: 'tan',
    alt: 'An email reads “Thanks Kayleigh, the slides look great!”. Iris asks: keep “Kayleigh”? You changed it back, so Iris won’t touch it again. Keep it, or No.',
    text: 'Change a word back once and Iris remembers it for good.',
    art: (
      <>
        <MacWindow title="Mail" icon="mail">
          <div {...stylex.props(s.mailText)}>
            Thanks <span data-kept>Kayleigh</span>, the slides look great!
          </div>
        </MacWindow>
        <div {...stylex.props(s.overlap)}>
          <IrisNote
            icon={<AskMark />}
            title="keep “Kayleigh”?"
            line="You changed it back. Iris won’t touch it again."
            end={
              <>
                <span {...stylex.props(s.keepBtn)}>
                  <HandRect seed={71} width={1.4} />
                  Keep it
                </span>
                <span {...stylex.props(s.noBtn)}>No</span>
              </>
            }
          />
        </div>
      </>
    ),
  },
  {
    title: 'Any language in',
    look: 'pink',
    alt: 'Iris’s panel, on Fix: “The order will arrive by tomorrow, tell the customer.” Under it, “You wrote: bhai order kal tak aa jayega, customer ko bol do”, and a note: translated to English, check it reads right.',
    text: 'Write in Hinglish, Spanish, or any language. Iris turns it into natural English, with your original underneath.',
    art: (
      <div data-fit-panel="780" {...stylex.props(s.factPanel)}>
        {/* 780: its footer note, "into Slack" and Replace need a little more than the usual 720. */}
        <div {...stylex.props(s.factPanelInner)}>
        <Panel
          tabs={tones.map((t) => t.name)}
          app={{ name: 'Slack', icon: 'slack' }}
          seed={77}
          notice="Translated to English, check it reads right"
          under={<p {...stylex.props(s.youWrote)}>You wrote: bhai order kal tak aa jayega, customer ko bol do</p>}
        >
          <p {...stylex.props(panel.message)} style={{ paddingBottom: 4 }}>The order will arrive by tomorrow, tell the customer.</p>
        </Panel>
        </div>
      </div>
    ),
  },
  {
    title: 'Quick Fix',
    look: 'khaki',
    alt: 'A note reads “I’m running late. Start without me and save me a seat.”, four words fixed. Iris’s note by it: fixed 4 words, undo with Command Z.',
    text: (
      <>
        <KeyRow keys={['⌃', '⌥', '⇧', 'G']} /> skips the popup and fixes your text right away, in 0.3 seconds. <KeyRow keys={['⌘', 'Z']} /> undoes it.
      </>
    ),
    art: (
      <>
        <MacWindow title="Notes" icon="notes">
          <div {...stylex.props(s.mailText)}>
            <ins {...stylex.props(panel.added)}>I’m</ins> running <ins {...stylex.props(panel.added)}>late.</ins> <ins {...stylex.props(panel.added)}>Start</ins> without me and save me a <ins {...stylex.props(panel.added)}>seat.</ins>
          </div>
        </MacWindow>
        <div {...stylex.props(s.overlap)}>
          <IrisNote
            icon={<HandTick size={24} />}
            title={
              <span {...stylex.props(s.fixedWord)}>
                <span aria-hidden {...stylex.props(panel.goodMarker)}>
                  <Printed mask={markerMask(seedOf('fixed 4 words'))} color="pink" />
                </span>
                fixed 4 words
              </span>
            }
            end={
              <span {...stylex.props(s.undo)}>
                Undo with <KeyRow keys={['⌘', 'Z']} />
              </span>
            }
          />
        </div>
      </>
    ),
  },
];

// ── 05 Private ────────────────────────────────────────────────────────────────────────
function Private() {
  return (
    <section id="private" aria-labelledby="private-title" {...stylex.props(s.pinkPlate)}>
      <Pattern kind="ripples" color="rgb(250 190 220)" seed={51} at={[1, 0]} count={7} weight={0.8} />
      {/* PRIVATE up the left edge, reading bottom to top, like the VOICE scrap in 03. On a
          phone there's no margin for it: it would lie in pieces under the words and stickers. */}
      <span {...stylex.props(s.privateGhost)}>
      <GhostWord lines={['PRIVATE', '']} tone="pink" style={{ backgroundImage: 'url(/tex/streaks.png), linear-gradient(rgb(255 252 249), rgb(255 252 249))', opacity: 0.85, left: 'calc(-0.08em + 5px)', top: '50%', fontSize: 'clamp(110px, 13vw, 200px)', transformOrigin: '0 0', transform: 'rotate(-90deg) translate(-50%, 0)' }} />
      </span>
      <div {...stylex.props(s.wrap)} style={{ paddingBlock: 'clamp(48px, 9vw, 120px)' }}>
        <PageTitle id="private-title" lines={['Your words stay', 'on your Mac']} xstyle={s.onPink} />
        <div {...stylex.props(s.privateBody)}>
          <div {...stylex.props(s.stack)} style={{ gap: 20 }}>
            <p {...stylex.props(s.pinkBody)} data-tones="private">
              Iris runs its AI directly on your Mac. No cloud, no account, and no tracking. After a one-time download during setup, nothing you type ever leaves your computer, and it works without Wi-Fi.
            </p>
            <p {...stylex.props(s.pinkBody)} style={{ fontSize: '0.84375rem' }}>
              Automatically ignores password fields and password managers.
            </p>
          </div>
          <div {...stylex.props(s.stickers)}>
            {STICKERS.map((st) => (
              <Sticker key={st.label} {...st} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// The privacy stickers: what Iris doesn't need, crossed out with the brush, and where your words
// stay. Paper slips, each with a printed picture (scripts/privacy-icons.mjs).
const STICKERS = [
  { label: 'no cloud', picture: 'cloud', crossed: true, tilt: -2.5, seed: 61 },
  { label: 'no sign-up', picture: 'card', crossed: true, tilt: 2, seed: 62 },
  { label: 'works offline', picture: 'wifi', crossed: true, tilt: 1.5, seed: 63 },
  { label: 'stays on your Mac', picture: 'mac', crossed: false, tilt: -1.5, seed: 64 },
] as const;

/** A sticker: Iris's pin for it, printed by scripts/privacy-icons.mjs, our red brush X on what
 *  Iris doesn't need, and its word. */
function Sticker({ label, picture, crossed, tilt, seed }: (typeof STICKERS)[number]) {
  return (
    <div {...stylex.props(s.sticker)} style={{ ['--tilt' as string]: `${tilt}deg` }}>
      <span aria-hidden {...stylex.props(s.stickerArt)}>
        <img src={`/privacy/${picture}.png`} alt="" width={320} height={320} loading="lazy" decoding="async" {...stylex.props(s.stickerSvg)} />
        {crossed && (
          <span {...stylex.props(s.stickerCross)}>
            <Printed mask={crossMask(seed)} color="red" />
          </span>
        )}
      </span>
      <span {...stylex.props(s.stickerWord)}>{label}</span>
    </div>
  );
}

// ── 06 Make it yours ──────────────────────────────────────────────────────────────────
// Iris's own Settings window, as the app draws it, lying on a sheet beside the list. The window
// turns through the pages by itself, the item it's on lighting up and its line filling; picking
// an item (its name or its words) turns to it. The motion's storyboard is in client.ts.
const YOURS: { name: string; page: Parameters<typeof Picture>[0]['name']; text: string; alt: string }[] = [
  {
    name: 'Tones',
    page: 'settings-tones',
    text: 'Add rules in plain English (“never use exclamation marks”) or make your own tones.',
    alt: 'Iris’s Settings at Tones: which tones the panel shows and in what order, a box to add a tone of your own, and your style.',
  },
  {
    name: 'Words',
    page: 'words',
    text: 'Names, brands, and special terms you never want Iris to change.',
    alt: 'Iris’s Settings at Words: Northwind, OKR, Kubernetes and ACME-2041 on the list of words Iris never changes.',
  },
  {
    name: 'Apps',
    page: 'settings-apps',
    text: 'Pick a default tone per app, like Professional in Mail or Friendly in Messages.',
    alt: 'Iris’s Settings at Apps: Iris turned off in 1Password, Keychain Access, Passwords and Bitwarden, and a tone to start in for each app.',
  },
  {
    name: 'Shortcuts',
    page: 'settings-shortcuts',
    text: 'Change the keyboard shortcuts to whatever feels natural.',
    alt: 'Iris’s Settings at Shortcuts: Control Option G opens Iris, Control Option Shift G is Quick Fix, and the keys that work in the panel.',
  },
];

function Yours() {
  return (
    <section id="yours" aria-labelledby="yours-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack, s.spreadGap64)}>
        <RunningHead seed={61} cols={['Settings']} />
        <div {...stylex.props(s.yoursGrid)}>
          <div style={{ gridArea: 'title' }}>
            <PageTitle id="yours-title" lines={['Make it', 'yours']} small />
          </div>
          <ol role="tablist" aria-label="Settings" aria-orientation="vertical" data-yours {...stylex.props(s.steps, s.yoursList)} style={{ gridArea: 'list' }}>
            {YOURS.map((y, i) => (
              <li key={y.name} role="presentation" data-yours-step data-active={i === 0} {...stylex.props(s.step, s.yoursStep)}>
                <button type="button" role="tab" id={`yours-tab-${i}`} aria-controls={`yours-page-${i}`} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} {...stylex.props(s.stepButton)}>
                  <span {...stylex.props(s.stepTitle)}>{y.name}</span>
                </button>
                <span aria-hidden data-yours-track {...stylex.props(s.stepTrack)}>
                  <span data-yours-bar {...stylex.props(s.stepBar)} />
                </span>
                <p {...stylex.props(s.stepText, s.yoursText)}>{y.text}</p>
              </li>
            ))}
          </ol>
          <div {...stylex.props(s.yoursStage)} style={{ backgroundColor: WALL.plate }}>
            <Pattern kind="loops" color={WALL.loops} seed={57} scale={1.2} count={9} />
            <span {...stylex.props(s.yoursNote)} aria-hidden>
              <span style={{ paddingTop: 2 }}>Inside Settings</span>
              <HandArrow width={44} height={40} seed={6} />
            </span>
            <div data-yours-window {...stylex.props(s.yoursFrame)}>
              <div {...stylex.props(s.yoursWindow)}>
                <span aria-hidden {...stylex.props(s.yoursLights)}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} {...stylex.props(s.yoursLight)} />
                  ))}
                </span>
                <span aria-hidden {...stylex.props(s.yoursFade)} />
                {YOURS.map((y, i) => (
                  <div key={y.name} role="tabpanel" id={`yours-page-${i}`} aria-labelledby={`yours-tab-${i}`} data-yours-page data-shown={i === 0} inert={i !== 0} {...stylex.props(s.yoursPage)}>
                    <Picture name={y.page} alt={y.alt} width={680} sizes="(max-width: 1000px) 92vw, 680px" xstyle={s.yoursShot} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 07 Menu bar and setup ─────────────────────────────────────────────────────────────
function MenuBar() {
  const steps = [
    ['Allow access', 'Give Iris permission to fix your text. Your Mac asks just once.'],
    ['One-time offline download', 'Downloads the built-in AI once, so Iris works privately without internet.'],
    ['Try it', 'Fix a practice sentence, and you’re set.'],
  ];
  return (
    <section id="menu" aria-labelledby="menu-title" {...stylex.props(s.spread)} style={{ paddingTop: 0 }}>
      <div {...stylex.props(s.wrap, s.stack, s.spreadGap64)}>
        <RunningHead seed={71} cols={['Menu bar', 'Out of your way', '5-minute setup']} />
        <div {...stylex.props(s.menuGrid)}>
          <div {...stylex.props(s.macStage)}>
          <Pattern kind="ripples" color="rgb(210 177 146)" seed={71} at={[0.5, 0.2]} scale={1.3} />
          <MacCorner
            note={
              <span {...stylex.props(s.menuNote)} aria-hidden>
                <HandArrow width={44} height={40} flip seed={2} />
                <span style={{ paddingTop: 2 }}>find me up here</span>
              </span>
            }
            menu={
              <Picture
                name="menu"
                width={400}
                sizes="(max-width: 760px) 46vw, 294px"
                alt="The Iris menu, open under its flower in the menu bar: a printed sky band with a flower, then Check text, Quick Fix, Free model memory, Setup, Settings, Check for Updates and Quit."
                xstyle={s.menuImg}
              />
            }
          />
          </div>
          <div {...stylex.props(s.stack, s.menuIntro)}>
            <PageTitle id="menu-title" lines={['Lives in your', 'menu bar']} small />
            <p {...stylex.props(s.body)} data-tones="menu">
              Iris sits quietly as a little flower at the top of your screen, with no cluttered window or Dock icon. It only runs when you call it, then goes to sleep automatically so it won’t slow your Mac down.
            </p>
          </div>
          <div style={{ gridArea: 'steps' }}>
            <SectionHead title="First time you open Iris" seed={73} />
            <ol {...stylex.props(s.setupList)}>
              {steps.map(([t, d], i) => (
                <li key={t}>
                  <div {...stylex.props(s.setupItem)}>
                    <span {...stylex.props(s.setupTitle)}>{t}</span>
                    <span {...stylex.props(s.methodText)}>{d}</span>
                  </div>
                  {i < steps.length - 1 && <PenRule seed={74 + i} />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 08 Install ────────────────────────────────────────────────────────────────────────
function Install() {
  // What each computer needs: the Mac's from the app's README and ModelChoice (Best quality from
  // 16 GB, as Iris recommends at setup), Windows' from content.ts. The price is the same on both, so it's said once, under them.
  const mac: [string, string][] = [
    ['Mac', 'M1, M2, M3, or newer (2020+)'],
    ['macOS', '15 (Sequoia) or newer'],
    ['Memory', '8 GB works, 16 GB+ for best quality'],
    ['Storage', 'About 5 GB of free space'],
  ];
  const win: [string, string][] = windows.requirements.length ? windows.requirements : [['Needs', 'To be announced']];
  const rows = (list: [string, string][], seed: number) =>
    list.map(([k, v], i) => (
      <div key={k} {...stylex.props(s.specRow)} style={{ backgroundImage: penLine(seed + i) }}>
        <dt {...stylex.props(s.specTerm)}>{k}</dt>
        <dd {...stylex.props(s.specDef)}>{v}</dd>
      </div>
    ));
  return (
    <section id="install" aria-labelledby="install-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack, s.spreadGap72)}>
        <RunningHead seed={81} cols={['Install', '3 quick steps']} />
        <div {...stylex.props(s.installHead)}>
          <PageTitle id="install-title" lines={['Get', 'Iris']} small />
          <div {...stylex.props(s.cta)}>
            <GetIris />
          </div>
        </div>
        {/* Three steps, each on its own small collage; swipeable rail on phones. */}
        <div {...stylex.props(s.railWrap)} data-rail="install">
          <ol {...stylex.props(s.installSteps)} data-scrolls data-rail-track>
            {INSTALL_STEPS.map((st, i) => (
              <li key={st.title} {...stylex.props(s.fact)} data-rail-slide>
                <FactStage look={st.look} seed={86 + i * 7}>
                  <div inert aria-hidden {...stylex.props(s.factArt)}>
                    {st.art}
                  </div>
                  <p {...stylex.props(s.srOnly)}>{st.alt}</p>
                </FactStage>
                <SectionHead title={st.title} seed={96 + i}>
                  {st.text}
                </SectionHead>
              </li>
            ))}
          </ol>
          <RailControls count={INSTALL_STEPS.length} label="Install steps" seed={99} />
        </div>
        <div {...stylex.props(s.installFoot)}>
          <div {...stylex.props(s.needs)}>
            <div {...stylex.props(s.needGroup)}>
              <h3 id="needs-mac" {...stylex.props(s.needTitle)}>
                <OsIcon os="mac" size={44} /> On a Mac
              </h3>
              <dl aria-labelledby="needs-mac" {...stylex.props(s.specs)}>{rows(mac, 85)}</dl>
            </div>
            <div {...stylex.props(s.needGroup)}>
              <h3 id="needs-windows" {...stylex.props(s.needTitle)}>
                <OsIcon os="windows" size={44} /> On Windows <BetaStamp seed={93} />
              </h3>
              <dl aria-labelledby="needs-windows" {...stylex.props(s.specs)}>{rows(win, 91)}</dl>
              {windows.action && (
                <span {...stylex.props(s.needAction)}>
                  <PenButton href={windows.action.href}>
                    {windows.action.label} <PenArrow up size={16} />
                  </PenButton>
                </span>
              )}
            </div>
            <dl {...stylex.props(s.specs)}>{rows([['Price', 'Free forever on Mac & Windows']], 99)}</dl>
          </div>
          {/* A paper slip taped to the page, like Iris's notes: why step 3 asks. */}
          <div {...stylex.props(panel.sheet, s.why)}>
            <span {...stylex.props(panel.grain)} />
            <Tape style={{ left: '50%', top: -12, width: 96, height: 24, transform: 'translateX(-50%) rotate(-3deg)' }} />
            <span {...stylex.props(s.whyTitle)}>Why does macOS ask?</span>
            <p {...stylex.props(s.whyText)} data-tones="why">
              Apple charges developers a yearly fee to remove that first-time warning. Since Iris is completely free, we skip the fee. Your Mac asks you to confirm just once and remembers through future updates. Our code is public so anyone can check it’s safe.
            </p>
            <span style={{ position: 'relative' }}>
              <PenLink href={links.code}>See the public code</PenLink>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// The install steps, drawn: a Finder window, Iris dragged into Applications, and the two places
// macOS asks the first time, each click ringed in pink. The words on them are macOS's own.
/** Iris's app icon, as Finder and macOS show it. */
const IrisIcon = ({ size }: { size: number }) => <img src="/apple-touch-icon.png" alt="" width={size} height={size} loading="lazy" decoding="async" style={{ display: 'block' }} />;

/** A file as Finder shows it: its icon, its name under it. */
function FinderItem({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <span {...stylex.props(s.finderItem)}>
      <span {...stylex.props(s.finderIcon)}>{icon}</span>
      <span {...stylex.props(s.finderName)}>{name}</span>
    </span>
  );
}

/** A zip, drawn in the pen: a page with its corner folded and a zip down it. */
function ZipIcon() {
  return (
    <svg viewBox="0 0 48 60" width={48} height={60} aria-hidden style={{ overflow: 'visible' }}>
      <path d="M5,3 C14,2.6 24,2.8 33,3 L44,14 C44.4,29 43.8,44 44.2,57 C31,57.6 18,57.2 4.8,57.4 C5.4,40 4.6,20 5,3 Z" fill="rgb(255 252 249)" stroke="rgb(42 26 22)" strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M33,3.4 C32.8,7.4 33.2,11 32.8,14.2 C36.6,14 40.4,14.2 43.6,13.8" fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {[8, 13, 18, 23, 28, 33].map((y, i) => (
        <path key={y} d={`M${i % 2 ? 24.6 : 19.4},${y} L${i % 2 ? 28.6 : 23.4},${y + 0.3}`} stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" />
      ))}
      <path d="M19.6,37 C22,36.6 26,36.8 28.4,37 L28.2,45.6 C25.6,46 22.4,45.8 19.8,45.6 Z" fill="rgb(226 200 185)" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

const folderMask = svgUrl('0 0 60 48', "<path d='M2,8 C2,5.6 3.4,4.4 5.8,4.4 L20,4.2 L24,9 L54,9.2 C56.6,9.2 58,10.6 58,13 L57.8,43 C57.8,45.4 56.4,46.6 54,46.6 L6,46.8 C3.6,46.8 2.2,45.4 2.2,43 Z'/>");
/** The Applications folder: a printed sky folder with the A drawn on it in the pen. */
function FolderIcon() {
  return (
    <span style={{ position: 'relative', display: 'block', width: 60, height: 48 }}>
      <Printed mask={folderMask} color="sky" />
      <svg viewBox="0 0 60 48" width={60} height={48} aria-hidden style={{ position: 'relative', display: 'block', overflow: 'visible' }}>
        <path d="M2,8 C2,5.6 3.4,4.4 5.8,4.4 L20,4.2 L24,9 L54,9.2 C56.6,9.2 58,10.6 58,13 L57.8,43 C57.8,45.4 56.4,46.6 54,46.6 L6,46.8 C3.6,46.8 2.2,45.4 2.2,43 Z" fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinejoin="round" />
        <path d="M2.4,15 C20,14.4 40,14.8 57.8,14.6" fill="none" stroke="rgb(42 26 22)" strokeWidth={1.6} strokeLinecap="round" />
        <path d="M23.4,39 L30,22 L36.6,39 M25.8,33 L34.2,33" fill="none" stroke="rgb(255 252 249)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** A macOS button, drawn in the pen; the one to click ringed with the pink brush. */
function MacButton({ children, ring, seed }: { children: React.ReactNode; ring?: boolean; seed: number }) {
  return (
    <span {...stylex.props(s.macBtn)}>
      {ring && (
        <span {...stylex.props(s.macRing)}>
          <Printed mask={ringMask(seed)} color="pink" />
        </span>
      )}
      <HandRect seed={seed} width={1.3} />
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  );
}

const INSTALL_STEPS: { title: string; look: FactLook; art: React.ReactNode; alt: string; text: React.ReactNode }[] = [
  {
    title: 'Download',
    look: 'step1',
    alt: 'A Finder window, Downloads: Iris.zip, and Iris, the app that came out of it.',
    text: 'Download Iris.zip and double-click it to unzip the app.',
    art: (
      <MacWindow title="Downloads">
        <div {...stylex.props(s.finderRow)}>
          <FinderItem icon={<ZipIcon />} name="Iris.zip" />
          <PenArrow size={30} />
          <FinderItem icon={<IrisIcon size={58} />} name="Iris" />
        </div>
      </MacWindow>
    ),
  },
  {
    title: 'Drag it to Applications',
    look: 'step2',
    alt: 'Iris dragged across a Finder window onto the Applications folder.',
    text: 'Drag Iris into your Applications folder so it can update itself.',
    art: (
      <MacWindow title="Downloads">
        <div {...stylex.props(s.finderRow)}>
          <FinderItem icon={<IrisIcon size={58} />} name="Iris" />
          <span {...stylex.props(s.dragNote)}>
            <span>drag</span>
            <HandArrow width={70} height={34} seed={88} />
          </span>
          <FinderItem icon={<FolderIcon />} name="Applications" />
        </div>
      </MacWindow>
    ),
  },
  {
    title: 'Open it, once',
    look: 'step3',
    alt: 'macOS says “Iris” Not Opened, with Done ringed. Then System Settings, Privacy & Security: “Iris” was blocked to protect your Mac, with Open Anyway ringed.',
    text: 'The first time, macOS shows a warning. Click Done, open System Settings › Privacy & Security, click Open Anyway, and confirm. After that, it opens normally.',
    art: (
      <div {...stylex.props(s.askStack)}>
        <div {...stylex.props(panel.sheet, s.dialog)}>
          <span {...stylex.props(panel.grain)} />
          <span style={{ position: 'relative' }}>
            <IrisIcon size={34} />
          </span>
          <span {...stylex.props(s.dialogTitle)}>“Iris” Not Opened</span>
          <span {...stylex.props(s.dialogLine)}>Apple could not verify “Iris” is free of malware.</span>
          <span {...stylex.props(s.dialogButtons)}>
            <MacButton ring seed={101}>Done</MacButton>
            <MacButton seed={102}>Move to Trash</MacButton>
          </span>
        </div>
        <div {...stylex.props(s.askSettings)}>
          <MacWindow title="System Settings">
            <span {...stylex.props(s.secLabel)}>Privacy &amp; Security</span>
            <span {...stylex.props(s.secRow)}>
              <span {...stylex.props(s.dialogLine)} style={{ textAlign: 'start' }}>“Iris” was blocked to protect your Mac.</span>
              <MacButton ring seed={103}>Open Anyway</MacButton>
            </span>
          </MacWindow>
        </div>
      </div>
    ),
  },
];

// ── 09 What's new ─────────────────────────────────────────────────────────────────────
const coverInks = ['pink', 'sky', 'tan', 'crema'] as const;
const coverMask = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M0,0.4L99.6,0L100,99.6L0.3,100Z'/></svg>")}")`;

function WhatsNew() {
  const all = issues().slice(0, 5);
  const shelf = [...all].reverse(); // oldest low on the left, newest high on the right
  return (
    <section id="new" aria-labelledby="new-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(32px, 5vw, 48px)' }}>
        <RunningHead seed={91} cols={['What’s new', 'Iris updates itself: Check for Updates… in its menu']} />
        <PageTitle id="new-title" lines={['What’s', 'new']} small />
        <div {...stylex.props(s.shelfGrid)}>
          <div {...stylex.props(s.shelf)} role="tablist" aria-label="Versions">
            {shelf.map((issue, i) => {
              const latest = issue === all[0];
              const x = (i / Math.max(1, shelf.length - 1)) * 70;
              const y = 46 - (i / Math.max(1, shelf.length - 1)) * 46;
              return (
                <button
                  key={issue.version}
                  type="button"
                  role="tab"
                  aria-selected={latest}
                  aria-controls={`issue-${issue.no}`}
                  tabIndex={latest ? 0 : -1}
                  data-issue={issue.no}
                  {...stylex.props(s.book)}
                  style={{ left: `${x}%`, top: `${y}%`, zIndex: i + 1, rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
                >
                  <span {...stylex.props(s.pages)} />
                  <span {...stylex.props(s.cover)}>
                    <Printed mask={coverMask} color={coverInks[(issue.no - 1) % coverInks.length]} />
                    <span {...stylex.props(s.spine)} />
                    <span {...stylex.props(s.mast)} style={{ position: 'relative' }}>
                      <span>IRIS</span>
                      <span>No.{String(issue.no).padStart(2, '0')}</span>
                    </span>
                    <span style={{ position: 'relative', marginTop: 6 }}>
                      <PenRule seed={issue.no * 13} color="rgb(42 26 22 / 0.7)" />
                    </span>
                    <span {...stylex.props(s.coverVer)} style={{ position: 'relative' }}>{issue.version}</span>
                    <span {...stylex.props(s.coverTitleText)} style={{ position: 'relative' }}>{issue.title}</span>
                    {latest && (
                      <span {...stylex.props(s.yours)} data-overhang>
                        <Tape style={{ position: 'relative', transform: 'rotate(8deg)', fontSize: '1.0625rem' }}>newest</Tape>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div>
            {all.map((issue, i) => {
              const items = [...issue.headlines.map((h) => h.title), ...issue.also].slice(0, 6);
              const more = issue.headlines.length + issue.also.length - items.length;
              return (
                <div key={issue.version} id={`issue-${issue.no}`} role="tabpanel" hidden={i !== 0} data-facts={issue.no} {...stylex.props(s.facts)}>
                  <span {...stylex.props(s.factsNo)}>
                    NO. {String(issue.no).padStart(2, '0')} OF {String(all[0].no).padStart(2, '0')} · {month(issue.date)}
                  </span>
                  <span {...stylex.props(s.bigVer)}>
                    <span {...stylex.props(s.v)}>v</span>
                    {issue.version}
                  </span>
                  <h3 {...stylex.props(s.factsTitle)}>{issue.title}</h3>
                  <PenRule seed={issue.no * 17} strong />
                  <ul {...stylex.props(s.changes)}>
                    {items.map((t, k) => (
                      <li key={k} {...stylex.props(s.change)}>
                        <HandTick size={14} />
                        <span {...stylex.props(k < issue.headlines.length && s.changeTitle)}>{t}</span>
                      </li>
                    ))}
                  </ul>
                  {more > 0 && <span {...stylex.props(s.meta)}>and {more} more in this version.</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


// ── 09 Questions ──────────────────────────────────────────────────────────────────────
// What someone asks before they download, answered the way Iris talks in its notes: a short
// lead in brush, first person and lowercase, then the plain answer (DESIGN.md, "Voice"). Every
// fact is the app's own (its README and Settings).
// Printed on its own plate, as Privacy is on pink: the pale green of About's meadow haze in the
// app, with the running head, the stair title and the questions beside it, as the page's other
// chapters are set. Branches hang and rise round it (Branches.tsx), seen through a lens as
// About's meadow is: far ones printed toward the haze and a touch soft behind everything, a sharp
// one in the middle, and big soft ones right in front of the lens at the corners, sliding past
// each other as the page scrolls. The questions are printed on the plate; the one you open lifts
// off it as a paper slip (the white of Iris's panels) with a pink marker swipe under it, as the
// chosen tone is marked in the app. One is open at a time (<details name>, so it works without
// the script); with the script the open one folds as the tapped one unfolds, on one curve, and
// the page is never scrolled for you (client.ts). Under Reduce Motion the branches are still
// and the answers simply swap. The plate ends the page: the green runs straight into the foot.
// What's new (the shelf of versions) is off for now: WhatsNew above still builds it.
const qa = stylex.create({
  plate: {
    position: 'relative',
    isolation: 'isolate',
    // About's haze: a pale green, as Privacy's pink is lighter than the pink elsewhere, so ink reads on it.
    backgroundColor: 'rgb(178 216 186)',
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    overflowAnchor: 'none',
    // Room at the foot for the near branches, clear of the last question.
    paddingBottom: { default: 'clamp(120px, 14vw, 200px)', [MOBILE]: 96 },
  },
  // The depths, each a layer over the plate: far behind the words, near in front of them.
  far: { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' },
  near: { position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' },
  branch: { position: 'absolute' },
  above: { position: 'relative', zIndex: 1 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 8fr)',
    gap: { default: 'clamp(32px, 5vw, 80px)', [MOBILE]: 24 },
    alignItems: 'start',
    [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  item: { position: 'relative', paddingInline: { default: 18, [MOBILE]: 14 }, marginInline: { default: -18, [MOBILE]: -6 } },
  // In the question's row, which shows even when it's folded (the rest of a closed <details> doesn't).
  rule: { position: 'absolute', left: { default: 18, [MOBILE]: 14 }, right: { default: 18, [MOBILE]: 14 }, bottom: -3, pointerEvents: 'none' },
  q: {
    position: 'relative',
    display: 'flex',
    alignItems: 'baseline',
    gap: { default: 14, [MOBILE]: 10 },
    paddingBlock: { default: 18, [MOBILE]: 14 },
    marginInline: { default: -18, [MOBILE]: -14 },
    paddingInline: { default: 18, [MOBILE]: 14 },
    cursor: 'pointer',
    listStyle: 'none',
    fontSize: { default: 'clamp(15px, 1.4vw, 17px)', [MOBILE]: 14.5 },
    fontWeight: 560,
    lineHeight: 1.45,
    color: ink.i12,
  },
  no: { flex: 'none', minWidth: '2.2ch', fontSize: 12, fontWeight: 400, letterSpacing: '0.08em', color: ink.pinkText },
  text: { position: 'relative', flex: '0 1 auto', isolation: 'isolate' },
  // Low under the words, as `Marked` sets the chosen tone's swipe: never through them, where
  // it would read as a struck-out word. On two lines it runs under the last.
  mark: { position: 'absolute', zIndex: -1, left: -6, right: -10, bottom: '-0.16em', height: '0.95em', transform: 'scaleX(0)', transformOrigin: 'left center', pointerEvents: 'none' },
  chev: { flex: 'none', alignSelf: 'center', marginLeft: 'auto', width: 16, height: 10 },
  body: { overflow: 'hidden' },
  a: { display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: { default: 'calc(2.2ch + 14px)', [MOBILE]: 0 }, paddingBottom: { default: 26, [MOBILE]: 18 }, paddingRight: { default: 30, [MOBILE]: 0 } },
  lead: { fontFamily: font.brush, fontSize: { default: 'clamp(22px, 2vw, 26px)', [MOBILE]: 21 }, lineHeight: 1.1, color: ink.i12 },
  detail: { fontSize: { default: 14, [MOBILE]: 13.5 }, lineHeight: { default: 1.7, [MOBILE]: 1.65 }, color: ink.i11, maxWidth: '58ch' },
});
/** The branches round the plate, by depth: each drawing, where it sits and how wide (a share of
 *  the plate, and at most), how a breeze sways it from its foot (degrees, seconds, delay: every
 *  one has settled by 5s, WCAG 2.2.2), and its width on a phone (`null` hides it there). Far and
 *  sharp ones keep to the margins and the room under the title; near ones only lean into the
 *  corners, so none of them covers a question. */
const QA_BRANCHES: { depth: Depth; spec: BranchSpec; box: React.CSSProperties; width: [number, number]; phone: string | null; phoneLeft?: string; sway: [number, number, number] }[] = [
  // Far: hanging from the top between the running head's labels, and rising past the right edge.
  // On a phone, tuck it into the open top-right corner instead of hanging onto "YOU ASK" or "Answered by Iris".
  { depth: 'far', spec: { seed: 23, w: 300, h: 300, base: [150, 0], stems: [{ angle: 95, len: 250, bend: 0.4 }] }, box: { left: '19%', top: 0 }, width: [14, 200], phone: '20%', phoneLeft: '82%', sway: [1.2, 4.6, 0.3] },
  { depth: 'far', spec: { seed: 67, w: 300, h: 440, base: [250, 440], stems: [{ angle: -100, len: 380, bend: -0.3 }, { angle: -122, len: 260, bend: 0.3 }] }, box: { right: '-3%', bottom: 0 }, width: [16, 220], phone: null, sway: [1, 4.4, 0.6] },
  // Sharp: rising under the title, in focus with the words.
  { depth: 'mid', spec: { seed: 41, w: 300, h: 460, base: [120, 460], stems: [{ angle: -86, len: 420, bend: 0.4 }, { angle: -62, len: 260, bend: -0.3 }] }, box: { left: '5%', bottom: 0 }, width: [22, 300], phone: null, sway: [1.4, 4.2, 0.1] },
  // Near the lens: big and soft, leaning into the corners from past the plate's edge.
  { depth: 'near', spec: { seed: 37, w: 340, h: 470, base: [60, 470], stems: [{ angle: -70, len: 430, bend: 0.25 }, { angle: -45, len: 300, bend: -0.2 }] }, box: { left: '-7%', bottom: '-12%' }, width: [36, 520], phone: '36%', sway: [2, 4.8, 0] },
  { depth: 'near', spec: { seed: 11, w: 340, h: 300, base: [340, 30], stems: [{ angle: 160, len: 300, bend: 0.5 }, { angle: 135, len: 220, bend: -0.3 }] }, box: { right: '-7%', top: '-10%' }, width: [32, 460], phone: null, sway: [1.8, 4.5, 0.4] },
];
/** A depth's branches, each at its place, swaying from its foot. */
function BranchLayer({ depth }: { depth: Depth }) {
  return (
    <div aria-hidden {...stylex.props(depth === 'near' ? qa.near : qa.far)} data-depth={depth}>
      {QA_BRANCHES.filter((b) => (depth === 'near' ? b.depth === 'near' : b.depth !== 'near')).map(({ depth: d, spec, box, width, phone, phoneLeft, sway }) => (
        <span
          key={spec.seed}
          data-branch
          data-branch-depth={d}
          data-branch-phone={phone == null ? 'hide' : undefined}
          data-branch-shift={phoneLeft ? '' : undefined}
          {...stylex.props(qa.branch)}
          style={{
            ...box,
            width: `min(${width[0]}%, ${width[1]}px)`,
            ['--pw' as string]: phone ?? undefined,
            ['--pl' as string]: phoneLeft ?? undefined,
            aspectRatio: `${spec.w} / ${spec.h}`,
            ['--o' as string]: `${(spec.base[0] / spec.w) * 100}% ${(spec.base[1] / spec.h) * 100}%`,
            ['--a' as string]: `${sway[0]}deg`,
            ['--d' as string]: `${sway[1]}s`,
            ['--delay' as string]: `${sway[2]}s`,
          }}
        >
          <Branch spec={spec} depth={d} />
        </span>
      ))}
    </div>
  );
}
const QUESTIONS: { q: string; lead: string; a: React.ReactNode }[] = [
  {
    q: 'What does Iris do?',
    lead: 'i fix your writing, in any app',
    a: (
      <>
        Iris is a free alternative to Grammarly that runs on your own computer. Press <KeyRow keys={['⌃', '⌥', 'G']} /> in any text box and it fixes your spelling, grammar and punctuation, or rewrites your message as Professional, Friendly, Shorter, Clearer or Funny.
      </>
    ),
  },
  { q: 'Is it really free?', lead: 'yes. all of it', a: 'No trial, no subscription, and no account. Iris is free and open source, so anyone can check how it works.' },
  {
    q: 'Does what I write leave my computer?',
    lead: 'never. i live on your computer',
    a: 'Never. Everything runs directly on your Mac. Nothing goes to the cloud, nobody tracks you, and it works without Wi-Fi.',
  },
  {
    q: 'Which apps does it work in?',
    lead: 'anywhere you can type',
    a: 'Slack, Mail, Messages, Notes, Chrome, Safari, and any other app with a text box. No browser extension or plugin needed. Highlight text to fix just that part.',
  },
  {
    q: 'Will it change how I sound?',
    lead: 'only what’s wrong',
    a: (
      <>
        Fix only corrects mistakes and keeps your voice intact, even your casual “hey.” Names, @mentions, links, and emoji stay untouched. Nothing changes until you press Return, and <KeyRow keys={['⌘', 'Z']} /> takes it back.
      </>
    ),
  },
  {
    q: 'Can I write in Hindi, Hinglish, or other languages?',
    lead: 'yes, and i’ll give it back in english',
    a: 'Type in Hindi, Hinglish (Hindi in English letters), or another language. Iris translates it into natural English, with your original shown underneath.',
  },
  {
    q: 'Will it slow my computer down?',
    lead: 'not while you’re not using me',
    a: 'Nope. Iris only runs when you use it, then goes to sleep automatically when you step away so your Mac stays fast. You can adjust how soon in Settings.',
  },
  {
    q: 'How do I get updates?',
    lead: 'one click, from the menu bar',
    a: 'Click the Iris flower in your top menu bar and choose Check for Updates… Iris downloads the new version and reopens itself.',
  },
  {
    q: 'Is there a Windows version?',
    lead: 'not yet. it’s on its way',
    a: (
      <>
        It’s on the way. You can check what a PC will need under <a href="#install">Install</a>, or <a href={links.code}>follow progress here</a>.
      </>
    ),
  },
];

function Questions() {
  return (
    <section id="questions" aria-labelledby="questions-title" {...stylex.props(s.spread, qa.plate)} data-sway-field>
      <BranchLayer depth="far" />
      <div {...stylex.props(s.wrap, s.stack, qa.above)} style={{ gap: 'clamp(32px, 5vw, 56px)' }}>
        <RunningHead seed={91} cols={['Questions']} />
        <div {...stylex.props(qa.grid)}>
          <PageTitle id="questions-title" lines={['You ask', 'Iris answers']} small />
          <div {...stylex.props(qa.list)}>
            {QUESTIONS.map((it, i) => (
              <details key={it.q} name="iris-questions" open={i === 0} {...stylex.props(qa.item)} data-question>
                <summary {...stylex.props(qa.q)}>
                  <span aria-hidden {...stylex.props(qa.no)}>{String(i + 1).padStart(2, '0')}</span>
                  <span {...stylex.props(qa.text)}>
                    <span aria-hidden {...stylex.props(qa.mark)} data-question-mark>
                      <Printed mask={markerMask(140 + i)} color="pink" />
                    </span>
                    {it.q}
                  </span>
                  <svg aria-hidden viewBox="0 0 16 10" {...stylex.props(qa.chev)} data-question-chevron>
                    <path d="M1.8,2.4C4.4,4.6 6.2,6.4 8.1,8.1C10,6.3 11.9,4.5 14.2,2.2" fill="none" stroke="rgb(42 26 22)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span aria-hidden {...stylex.props(qa.rule)} data-question-rule>
                    <PenRule seed={120 + i} color="rgb(42 26 22 / 0.4)" />
                  </span>
                </summary>
                <div {...stylex.props(qa.body)} data-question-body>
                  <div {...stylex.props(qa.a)} data-question-answer>
                    <span {...stylex.props(qa.lead)}>{it.lead}</span>
                    <span {...stylex.props(qa.detail)}>{it.a}</span>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
      <BranchLayer depth="near" />
    </section>
  );
}

/** Mobile-only folio + scrubber + hand-drawn arrows under a swipeable collage rail. */
function RailControls({ count, label, seed }: { count: number; label: string; seed: number }) {
  return (
    <div {...stylex.props(s.railControls)} role="group" aria-label={label}>
      <div {...stylex.props(s.railMeta)}>
        <span {...stylex.props(s.railFolio)} data-rail-folio>
          01 / {String(count).padStart(2, '0')}
        </span>
        <span {...stylex.props(s.railPips)}>
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" aria-label={`Show ${label} ${i + 1} of ${count}`} data-rail-pip={i} data-active={i === 0 ? 'true' : 'false'} {...stylex.props(s.railPip)} />
          ))}
        </span>
      </div>
      <div {...stylex.props(s.railArrows)}>
        <button type="button" aria-label={`Previous ${label}`} data-rail-prev disabled {...stylex.props(s.railArrow)}>
          <HandRect seed={seed} width={1.3} />←
        </button>
        <button type="button" aria-label={`Next ${label}`} data-rail-next {...stylex.props(s.railArrow)}>
          <HandRect seed={seed + 1} width={1.3} />→
        </button>
      </div>
    </div>
  );
}

const JUMP_ITEMS = [
  { id: 'moment', label: 'How' },
  { id: 'tones', label: 'Tones' },
  { id: 'private', label: 'Privacy' },
  { id: 'install', label: 'Install' },
  { id: 'questions', label: 'FAQ' },
] as const;

/** Sticky compact mobile jump bar: paper + pen rule + pink marker swipe on the active section.
 *  Hidden above 760px; slides in once the reader scrolls past the cover. Uses buttons instead of
 *  <a> links so anchor counts in check.mjs stay exact. */
function MobileJumpBar() {
  return (
    <nav aria-label="Jump to section" data-jump-bar data-shown="false" {...stylex.props(s.jumpBar)}>
      <div {...stylex.props(s.jumpInner)}>
        <button type="button" data-jump="top" aria-label="Back to top" {...stylex.props(s.jumpBrand)}>
          <Wordmark size="20px" />
        </button>
        <div data-scrolls data-jump-list {...stylex.props(s.jumpLinks)}>
          {JUMP_ITEMS.map((it, i) => (
            <button key={it.id} type="button" data-jump={it.id} data-jump-active={i === 0 ? 'true' : 'false'} {...stylex.props(s.jumpBtn)}>
              <span aria-hidden data-jump-mark {...stylex.props(s.jumpMark)}>
                <Printed mask={markerMask(seedOf(it.label) + 11)} color="pink" />
              </span>
              {it.label}
            </button>
          ))}
        </div>
        <button type="button" data-jump="install" {...stylex.props(s.jumpGet)}>
          Get
        </button>
      </div>
      <span aria-hidden {...stylex.props(s.jumpRule)}>
        <PenRule seed={19} color="rgb(42 26 22 / 0.25)" />
      </span>
    </nav>
  );
}

export function Page() {
  return (
    <>
      <div {...stylex.props(s.page)} data-sheet>
      <a href="#moment" {...stylex.props(s.srOnly, s.skip)}>
        Skip to how it works
      </a>
      <Cover />
      <main>
        <Moment />
        <Tones />
        <Private />
        <Yours />
        <MenuBar />
        <Install />
        {/* What's new (the shelf of versions) is off for now; WhatsNew above still builds it. */}
        {/* <WhatsNew /> */}
        <Questions />
      </main>
      </div>
      <Footer />
      <MobileJumpBar />
      <PressPanel />
    </>
  );
}

// ── ⌃ ⌥ G on the page ─────────────────────────────────────────────────────────────────
// Press the keys anywhere and the page does what Iris does, as the app plays it: the keys go
// down, Iris's flower grows as a bud by the paragraph you're reading, opens, and its panel
// unrolls out of the bloom above the paragraph (PanelLayout: below when there's no room). Fix
// finds nothing ("looks good", Done ↵ closes it); Tab tries the tones, Return puts one on the
// page and plays the app's Done (the panel goes, the fall lands as a stamp, "replaced", Undo
// with ⌘Z, the flower sinks); ⌘Z takes it back; Esc folds the panel back into the flower,
// which sinks. Iris's notes sit by the paragraph, as the app's do by your text box. The words
// are written by hand (content.ts): no model runs here. With Iris installed the keys never
// reach the page; Iris takes them, so the try-it box gets the real thing.
const pressNames = ['Fix', ...pressTones];
const PRESS_DONE_CSS = doneCss({
  on: '[data-press-iris][data-at~="done"]',
  layer: '[data-press-iris][data-at~="done"]',
  shut: '[data-press-iris][data-at~="shut"]',
});
function PressPanel() {
  return (
    <>
      <script type="application/json" data-press-tones dangerouslySetInnerHTML={{ __html: JSON.stringify({ tones: pressTones, pageTones }).replace(/</g, '\\u003c') }} />
      <style dangerouslySetInnerHTML={{ __html: PRESS_DONE_CSS }} />
      <div data-press-iris data-at="" data-flower={JSON.stringify({ ...FLOWER_PX, shutMs: SHUT_MS, lands: LANDS, stampMs: DONE.stamp.holdMs + DONE.stamp.popMs, sinkMs: LANDS + DONE.sink.afterMs + DONE.sink.ms, panelMs: DONE.panelMs, note: DONE.note })} {...stylex.props(s.pressIris)}>
        {/* Iris's flower, its foot where the script puts it: the paper's left, on the paragraph's top edge. */}
        <div aria-hidden data-press-flower {...stylex.props(s.pressAt)}>
          <Bud place={ON_FOOT} />
          <Flight place={ON_FOOT} />
        </div>
        <div data-press hidden role="dialog" aria-label="Iris" tabIndex={-1} {...stylex.props(s.press)}>
          {/* Laid out at the panel's own width and scaled down to fit (client.ts sets the zoom),
              so its footer stays on one line. */}
          <div data-press-scale {...stylex.props(s.pressScale)}>
          <Panel
            tabs={pressNames}
            tab={(i) => ({ 'data-press-tab': i })}
            app={{ name: 'this page' }}
            good
            seed={93}
            hooks={{ good: { 'data-press-good': true }, keys: { 'data-press-keys': true }, next: { 'data-press-next': true }, into: { 'data-press-into': true }, where: { 'data-press-where': true }, icon: { 'data-press-icon': true }, replaceWrap: { 'data-press-replace-wrap': true }, replace: { 'data-press-replace': '' } }}
          >
            <div data-press-body {...stylex.props(s.pressBody)}>
              <p data-press-text aria-live="polite" {...stylex.props(panel.message)} />
            </div>
          </Panel>
          </div>
          {/* The marks, as Panel.tsx styles them, for the script to copy onto each version. */}
          <template data-press-marks>
            <del {...stylex.props(panel.gone)} />
            <ins {...stylex.props(panel.added)} />
          </template>
        </div>
        {/* Iris's note by the paragraph (the app's Toast), its words put in by the script. */}
        <div aria-hidden data-press-note hidden {...stylex.props(s.pressAt, s.pressNote)}>
          <SaysNote />
        </div>
      </div>
      <span data-press-said role="status" {...stylex.props(s.srOnly)} />
      <div data-press-psst hidden aria-hidden {...stylex.props(s.psst)}>
        <span data-psst-keys>psst: try pressing ⌃ ⌥ G right now</span>
      </div>
    </>
  );
}

