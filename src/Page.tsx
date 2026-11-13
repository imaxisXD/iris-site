// The Iris zine, issue for the web: one page per spread, printed like the app.
import * as stylex from '@stylexjs/stylex';
import { crossMask, HandArrow, HandTick, markerMask, penLine, PenRule, Printed, seedOf } from './pen';
import {
  AppName,
  BrushButton,
  GhostWord,
  HandWord,
  InkLabel,
  KeyRow,
  Marked,
  PageTitle,
  PenLink,
  Picture,
  RunningHead,
  SectionHead,
  StackedFigure,
  Tape,
  Wordmark,
} from './parts';
import demo from './demo.json';
import { Footer } from './Footer';
import { MacCorner, PanelScene } from './Backdrop';
import { Garden } from './Garden';
import { draft, issues, links, month, pageTones, pressTones, tones } from './content';
import { Marks, MessageStack, Panel, panel } from './Panel';
import { font, ink, tex } from './tokens.stylex';

const MOBILE = '@media (max-width: 760px)';
const NARROW = '@media (max-width: 1000px)';
const STILL = '@media (prefers-reduced-motion: reduce)';
// Hover looks only where there's a pointer that hovers: on touch a tap would leave them stuck.
const HOVER = '@media (hover: hover)';


const s = stylex.create({
  // ⌃ ⌥ G on the page (PressPanel)
  // The ⌃ ⌥ G panel's message area: as tall as the paragraph's longest version (client.ts).
  pressBody: { position: 'relative', maxHeight: '42vh', overflowY: 'auto' },
  press: { position: 'absolute', zIndex: 30, top: 0, left: 0, width: 'min(680px, calc(100vw - 32px))' },
  toast: { position: 'fixed', zIndex: 31, left: '50%', bottom: 28, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, paddingBlock: 10, paddingInline: 16, backgroundColor: ink.paper, color: ink.i12, fontSize: 13, whiteSpace: 'nowrap', boxShadow: '0 1px 1px rgb(42 26 22 / 0.08), 0 12px 28px -12px rgb(42 26 22 / 0.45)' },
  psst: { position: 'fixed', zIndex: 20, right: 16, bottom: 16, display: 'flex', alignItems: 'center', gap: 8, paddingBlock: 8, paddingInline: 14, backgroundColor: ink.paper, color: ink.i12, fontFamily: font.brush, fontSize: 20, lineHeight: 1.1, transform: 'rotate(-2deg)', boxShadow: '0 1px 1px rgb(42 26 22 / 0.08), 0 12px 28px -12px rgb(42 26 22 / 0.45)', maxWidth: 'calc(100vw - 32px)' },

  // Layout
  wrap: { width: '100%', maxWidth: 1280, marginInline: 'auto', paddingInline: 'clamp(20px, 5vw, 72px)', position: 'relative' },
  spread: { position: 'relative', paddingBlock: 'clamp(56px, 7vw, 96px)', overflow: 'clip' },
  stack: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  two: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
    gap: 'clamp(32px, 6vw, 96px)',
    alignItems: 'start',
    [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  body: { fontSize: 15, lineHeight: 1.7, color: ink.i11, margin: 0, maxWidth: '52ch' },
  meta: { fontSize: 12.5, lineHeight: 1.6, color: ink.i10, margin: 0 },
  brush: { fontFamily: font.brush, fontWeight: 400 },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
  // Hidden until the first Tab lands on it, then a paper slip over the cover's corner.
  skip: {
    ':focus': { position: 'fixed', zIndex: 10, top: 12, left: 12, width: 'auto', height: 'auto', overflow: 'visible', clipPath: 'none', paddingBlock: 10, paddingInline: 14, backgroundColor: ink.paper, color: ink.i12, fontSize: 13, boxShadow: '0 6px 16px -6px rgb(42 26 22 / 0.35)' },
  },
  sheet: { position: 'relative', backgroundColor: ink.paper, boxShadow: '0 1px 1px rgb(42 26 22 / 0.06), 0 14px 30px -12px rgb(42 26 22 / 0.28), 0 40px 60px -40px rgb(42 26 22 / 0.3)' },
  grain: { position: 'absolute', inset: 0, backgroundImage: tex.paper, backgroundSize: '64px 64px', pointerEvents: 'none' },

  // Cover
  plate: {
    position: 'relative',
    backgroundColor: ink.sky,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    overflow: 'clip',
    overflowClipMargin: '160px',
  },
  ghostClip: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' },
  plateInner: { minHeight: 'min(820px, 94svh)', display: 'flex', flexDirection: 'column', paddingTop: 28, paddingBottom: 'clamp(56px, 8vw, 96px)', [MOBILE]: { minHeight: 0, paddingBottom: 260 } },
  masthead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 2 },
  nav: { display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.4vw, 32px)', fontSize: 13, [MOBILE]: { display: 'none' } },
  navLink: { color: ink.i12, textDecoration: 'none', paddingBlock: 6, backgroundImage: 'linear-gradient(rgb(42 26 22 / 0.0), rgb(42 26 22 / 0.0))', textDecorationLine: { default: 'none', [HOVER]: { default: 'none', ':hover': 'underline' } }, textDecorationThickness: '1.5px', textUnderlineOffset: '5px' },
  coverBody: { marginTop: 'auto', paddingTop: 'clamp(56px, 9vw, 120px)', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 2, maxWidth: 'min(1000px, 72%)', [NARROW]: { maxWidth: '100%' } },
  coverTitle: { fontSize: 'clamp(40px, 5.5vw, 92px)', whiteSpace: 'nowrap', [MOBILE]: { whiteSpace: 'normal' } },
  lede: { fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.6, color: ink.i12, margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px' },
  cta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px 28px' },
  ctaMeta: { fontSize: 12.5, lineHeight: 1.5, color: ink.i12 },
  keysNote: { display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' },
  keysWords: { fontFamily: font.brush, fontSize: 22, lineHeight: 1, color: ink.i12, paddingBottom: 6 },
  // Butterflies may loop past the plate's right edge: cut them there, never widen the page.
  // Only sideways, so the garden still stands below the plate.
  coverClip: { overflowX: 'clip' },

  // Moment
  // Square to the page: a turned video is resampled every frame, and its text goes soft.
  print: { position: 'relative', padding: 10, [MOBILE]: { padding: 6 } },
  video: { display: 'block', width: '100%', height: 'auto', backgroundColor: ink.paper },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 30 },
  step: { display: 'flex', flexDirection: 'column', gap: 8 },
  stepTitle: { fontFamily: font.brush, fontSize: 28, lineHeight: 1, color: ink.i12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  stepText: { fontSize: 14, lineHeight: 1.65, color: ink.i11, margin: 0, maxWidth: '44ch' },
  caption: { fontSize: 12, color: ink.i10, marginTop: 18, display: 'flex', gap: 10, alignItems: 'baseline' },
  toggle: { marginLeft: 'auto', flex: 'none', minHeight: 24, letterSpacing: '0.08em', textTransform: 'uppercase', textDecorationLine: 'underline', textUnderlineOffset: '4px' },

  // Tones
  tonesHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap', position: 'relative' },
  corner: { position: 'relative', minWidth: 300, height: 170, flex: 'none', [MOBILE]: { display: 'none' } },
  panelStage: { position: 'relative', marginTop: 'clamp(24px, 4vw, 48px)', display: 'grid', gridTemplateColumns: 'minmax(0, 680px) minmax(0, 1fr)', gap: 'clamp(28px, 5vw, 72px)', alignItems: 'center', [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  hint: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.08em', borderWidth: 0, backgroundColor: 'transparent', padding: 0, fontFamily: font.mono, cursor: 'pointer', color: { default: ink.i10, [HOVER]: { default: ink.i10, ':hover': ink.i12 } } },
  done: { fontFamily: font.brush, fontSize: 24, color: ink.i12, display: 'inline-flex', alignItems: 'center', gap: 6 },
  note: { position: 'absolute', left: -6, top: -52, display: 'flex', alignItems: 'flex-end', gap: 4, fontFamily: font.brush, fontSize: 22, color: ink.i12, transform: 'rotate(-3deg)', [MOBILE]: { display: 'none' } },
  aside: { display: 'flex', flexDirection: 'column', gap: 18 },

  // Fixes
  fixGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr)',
    gap: 'clamp(28px, 4vw, 56px)',
    alignItems: 'start',
    marginTop: 'clamp(40px, 6vw, 72px)',
    [NARROW]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    [MOBILE]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  tanPlate: {
    position: 'relative',
    backgroundColor: ink.tan,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    padding: 'clamp(24px, 3vw, 40px)',
    paddingLeft: 'clamp(48px, 5vw, 64px)',
    minHeight: 420,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 28,
    color: ink.i12,
  },
  lowerTitle: { fontFamily: font.mono, fontWeight: 420, fontSize: 'clamp(26px, 2.8vw, 38px)', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em', color: ink.i12 },
  labels: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  struck: { textDecorationLine: 'line-through', textDecorationThickness: '0.07em', textDecorationColor: ink.pinkText },
  fixCorner: { position: 'relative', height: 'clamp(170px, 18vw, 240px)', [MOBILE]: { display: 'none' } },
  above: { position: 'relative', zIndex: 1 },

  // Private
  pinkPlate: {
    position: 'relative',
    backgroundColor: ink.platePink,
    backgroundImage: `${tex.screen}, ${tex.streaks}`,
    backgroundSize: '96px 96px, 128px 128px',
    color: ink.i12,
    overflow: 'clip',
  },
  onPink: { color: ink.i12 },
  figures: { display: 'flex', gap: 'clamp(28px, 5vw, 64px)', flexWrap: 'wrap', marginTop: 8 },
  pinkBody: { fontSize: 16, lineHeight: 1.75, margin: 0, maxWidth: '44ch', color: ink.i12 },

  // Yours
  methods: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 'clamp(20px, 3vw, 40px)',
    marginTop: 'clamp(40px, 6vw, 72px)',
    [NARROW]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
    [MOBILE]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
  method: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 },
  drawing: { position: 'relative', width: 'clamp(84px, 9vw, 112px)', aspectRatio: '1', display: 'grid', placeItems: 'center' },
  drawingImg: { width: '100%', height: 'auto' },
  cross: { position: 'absolute', inset: '-12%' },
  methodText: { fontSize: 13.5, lineHeight: 1.6, color: ink.i11, margin: 0 },

  // Menu
  menuGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 4.5fr) minmax(0, 5.5fr)', gap: 'clamp(32px, 6vw, 96px)', alignItems: 'center', [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  // The arrow's tip lands on the menu bar's flower (40% across the screen, in the corner's own
  // units, so it follows the flower at every size); the words trail off up and to the right.
  menuNote: { position: 'absolute', zIndex: 1, left: 'calc(40cqw - 14px)', bottom: 'calc(100% + 3px)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'flex-start', gap: 4, fontFamily: font.brush, fontSize: 22, lineHeight: 1, color: ink.i12, transformOrigin: '0 100%', transform: 'rotate(-4deg)' },
  menuImg: { width: '100%', height: 'auto' },
  setupList: { listStyle: 'none', margin: 0, padding: 0 },
  setupItem: { display: 'flex', flexDirection: 'column', gap: 4, paddingBlock: 14 },
  setupTitle: { fontFamily: font.brush, fontSize: 24, lineHeight: 1.1, color: ink.i12 },

  // Install
  installSteps: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'clamp(28px, 4vw, 48px)', [MOBILE]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
  installStep: { display: 'flex', flexDirection: 'column', gap: 10 },
  bigNo: { fontStretch: '75%', fontWeight: 300, fontSize: 52, lineHeight: 0.9, color: ink.pinkText },
  anyway: { marginTop: 'clamp(40px, 6vw, 64px)', [MOBILE]: { overflowX: 'auto', marginInline: -20, paddingInline: 20, scrollbarWidth: 'thin' } },
  anywayInner: { [MOBILE]: { width: 760 } },
  specs: { margin: 0, display: 'flex', flexDirection: 'column', fontSize: 13.5 },
  specRow: { display: 'grid', gridTemplateColumns: 'auto 1fr', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom', backgroundSize: '100% 6px' },
  specTerm: { fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink.i10, paddingBlock: 12, paddingRight: 24 },
  specDef: { margin: 0, paddingBlock: 12, textAlign: 'right', color: ink.i12, lineHeight: 1.5 },
  why: { padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: 12, transform: 'rotate(0.6deg)' },

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
});


// ── Cover ─────────────────────────────────────────────────────────────────────────────
function Cover() {
  return (
    <header {...stylex.props(s.coverClip)}>
      <div {...stylex.props(s.plate)}>
        <span {...stylex.props(s.ghostClip)}>
          <GhostWord lines={['WRI', 'TE']} tone="sky" style={{ left: '-2vw', top: 220, fontSize: 'clamp(180px, 30vw, 440px)' }} />
        </span>
        <div {...stylex.props(s.wrap, s.plateInner)}>
          <div {...stylex.props(s.masthead)}>
            <a href="/" aria-label="Iris, home" style={{ textDecoration: 'none' }}>
              <Wordmark size="clamp(34px, 3.4vw, 44px)" />
            </a>
            <nav aria-label="On this page" {...stylex.props(s.nav)}>
              <a href="#moment" {...stylex.props(s.navLink)}>How it works</a>
              <a href="#private" {...stylex.props(s.navLink)}>Privacy</a>
              <a href="#install" {...stylex.props(s.navLink)}>Install</a>
              <a href="#new" {...stylex.props(s.navLink)}>What's new</a>
            </nav>
          </div>
          <div {...stylex.props(s.coverBody)}>
            <PageTitle level={1} lines={['Fix your grammar.', 'Keep your voice.']} xstyle={s.coverTitle} />
            <p {...stylex.props(s.lede)}>
              <span data-tones="lede">Grammar and tone in every app on your Mac.</span>
              <InkLabel>Nothing leaves your Mac.</InkLabel>
            </p>
            <div {...stylex.props(s.cta)}>
              <BrushButton href={links.download} download>
                Download Iris
              </BrushButton>
              <span {...stylex.props(s.ctaMeta)}>
                Free and open source
                <br />
                macOS 15 or later, Apple silicon
              </span>
            </div>
            <div {...stylex.props(s.keysNote)}>
              <KeyRow keys={['⌃', '⌥', 'G']} labeled />
              <span {...stylex.props(s.keysWords)}>in any text box</span>
            </div>
          </div>
        </div>
        <Garden />
      </div>
    </header>
  );
}

// ── 02 The moment ─────────────────────────────────────────────────────────────────────
function Moment() {
  return (
    <section id="moment" aria-labelledby="moment-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(40px, 6vw, 72px)' }}>
        <RunningHead seed={21} cols={['How it works']} />
        <div {...stylex.props(s.two)}>
          <div {...stylex.props(s.stack)} style={{ gap: 44 }}>
            <PageTitle id="moment-title" lines={['One', 'shortcut']} small />
            <ol {...stylex.props(s.steps)}>
              <li {...stylex.props(s.step)}>
                <span {...stylex.props(s.stepTitle)}>
                  Press <KeyRow keys={['⌃', '⌥', 'G']} />
                </span>
                <p {...stylex.props(s.stepText)}>
                  In any text box: <AppName app="slack" />, <AppName app="mail" />, <AppName app="messages" />, <AppName app="notes" />, <AppName app="chrome" />, <AppName app="safari" />. Select some text first to fix just that.
                </p>
              </li>
              <li {...stylex.props(s.step)}>
                <span {...stylex.props(s.stepTitle)}>Read</span>
                <p {...stylex.props(s.stepText)}>A flower grows by your text, and Iris shows what it would change, marked like an editor would: your words struck through, its words in pink.</p>
              </li>
              <li {...stylex.props(s.step)}>
                <span {...stylex.props(s.stepTitle)}>
                  Replace <KeyRow keys={['↵']} />
                </span>
                <p {...stylex.props(s.stepText)}>
                  Nothing changes until you say so. <KeyRow keys={['⌘', 'Z']} /> in your app takes it back.
                </p>
              </li>
            </ol>
          </div>
          <figure style={{ margin: 0 }}>
            <div {...stylex.props(s.print, s.sheet)}>
              <span {...stylex.props(s.grain)} />
              <video
                {...stylex.props(s.video)}
                data-moment
                muted
                loop
                playsInline
                preload="none"
                poster="/demo/iris-in-textedit-700.webp"
                data-poster-wide="/demo/iris-in-textedit.webp"
                width={demo.width}
                height={demo.height}
                aria-label={`In TextEdit, a reply reads “${demo.draft}”. The shortcut is pressed: Iris’s flower comes up beside it and its panel marks three fixes. Return replaces the text, which now reads “${demo.fixed}”.`}
              >
                <source src="/demo/iris-in-textedit.mp4" type="video/mp4" />
              </video>
              <Tape style={{ left: -18, top: -14, width: 96, height: 26, transform: 'rotate(-14deg)' }} />
              <Tape style={{ right: -16, bottom: -12, width: 92, height: 26, transform: 'rotate(-10deg)' }} />
            </div>
            <figcaption {...stylex.props(s.caption)}>
              <span aria-hidden>↑</span> <span>Recorded on a Mac: Iris fixing a reply in <AppName app="textedit" size={18} />.</span>
              <button type="button" data-moment-toggle {...stylex.props(s.hint, s.toggle)}>Pause</button>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

// ── 03 Tones ──────────────────────────────────────────────────────────────────────────
function Tones() {
  return (
    <section id="tones" aria-labelledby="tones-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(40px, 6vw, 72px)' }}>
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
            <div style={{ position: 'relative' }}>
            <span {...stylex.props(s.note)} aria-hidden>
              click a tone to try it
              <HandArrow width={46} height={40} flip seed={9} />
            </span>
            <Panel
              tabs={tones.map((t) => t.name)}
              tab={(i) => ({ id: `tab-${i}`, 'aria-controls': `tone-${i}`, 'data-tab': i })}
              app={{ name: 'Slack', icon: 'slack' }}
              hooks={{ root: { 'data-panel': true }, next: { 'data-next': true }, replaceWrap: { 'data-replace-wrap': true }, replace: { 'data-replace': '' } }}
              after={
                <>
                  <span data-replaced hidden {...stylex.props(s.done)}>
                    <HandTick size={18} /> replaced
                  </span>
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
          </PanelScene>
          <div {...stylex.props(s.aside)}>
            <SectionHead title="Five ways to say it" seed={35}>
              Professional, Friendly, Shorter and Clearer are built in, Funny is one click away, and you can add your own, like “Customer update: polite, says what happens next”.
            </SectionHead>
            <p {...stylex.props(s.body)}>
              A tone keeps everything you said: your complaint, your thanks, your “I know you’re busy” and your “maybe”. <KeyRow keys={['⌘', 'R']} /> tries again.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
const tapeLabel = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30' preserveAspectRatio='none'><path d='M2,1L98,0L96.5,6L99.5,12L97,18L99.4,24L98,30L1,29L3,23L0.5,17L2.6,11L0.4,5Z'/></svg>")}")`;

// ── 04 Fixes, not rewrites ────────────────────────────────────────────────────────────
function Fixes() {
  return (
    <section id="fixes" aria-labelledby="fixes-title" {...stylex.props(s.spread)} style={{ paddingTop: 0 }}>
      <div {...stylex.props(s.wrap)}>
        <RunningHead seed={41} cols={['Fix']} />
        <div {...stylex.props(s.fixGrid)}>
          <div {...stylex.props(s.tanPlate)}>
            <div {...stylex.props(s.stack)} style={{ gap: 14 }}>
              <h3 {...stylex.props(s.lowerTitle)}>works where <span aria-hidden>/</span> you write</h3>
              <p {...stylex.props(s.body)} style={{ color: 'rgb(42 26 22)' }}>
                Any app with a text box. No plug-ins, and no copying your message into a chatbot and back.
              </p>
            </div>
            <div style={{ transform: 'rotate(-1.5deg)', marginInline: -8 }}>
              <Picture name="quick-fix" alt="A small paper note by the text box: fixed 4 words, undo with Command Z." />
            </div>
            <div {...stylex.props(s.stack)} style={{ gap: 10 }}>
              <span {...stylex.props(s.brush)} style={{ fontSize: '1.625rem', lineHeight: 1 }}>
                Quick Fix <KeyRow keys={['⌃', '⌥', '⇧', 'G']} />
              </span>
              <p {...stylex.props(s.body)} style={{ color: 'rgb(42 26 22)', fontSize: '0.875rem' }}>
                Fixes the text box you’re in and replaces it straight away, no panel. A big rewrite or a translation opens the panel instead, so you look first.
              </p>
            </div>
          </div>
          <div {...stylex.props(s.stack)} style={{ gap: 22 }}>
            <h2 id="fixes-title" {...stylex.props(s.lowerTitle)} style={{ fontSize: 'clamp(30px, 3.4vw, 46px)' }}>
              fixes <span aria-hidden>/</span>
              <span {...stylex.props(s.srOnly)}>, not</span> <del {...stylex.props(s.struck)}>rewrites</del>
            </h2>
            <p {...stylex.props(s.body)} data-tones="fixes">
              Fix corrects grammar and spelling and leaves the rest alone: your words, your style, your casual “hey”. Text that’s already fine stays exactly as it is, and Iris says <Marked seed={7}>looks good</Marked>.
            </p>
            <div {...stylex.props(s.labels)}>
              <InkLabel wrap>@mentions, #channels and :emoji: stay.</InkLabel>
              <InkLabel wrap>So do links, emails and code.</InkLabel>
            </div>
            <p {...stylex.props(s.body)}>
              Add the names and terms Iris should never touch, once. Put a word back after Iris changed it, and Iris learns to leave it alone.
            </p>
            <p {...stylex.props(s.body)}>
              Writing in Hinglish or another language? Fix gives it back in English, with your original beside it.
            </p>
          </div>
          <div {...stylex.props(s.stack)} style={{ gap: 24 }}>
            <div {...stylex.props(s.fixCorner)} aria-hidden>
              <GhostWord lines={['WOR', 'DS']} tone="khaki" style={{ right: -40, top: 0, fontSize: 'clamp(96px, 10vw, 136px)' }} />
              <span style={{ position: 'absolute', left: 0, top: '30%' }}>
                <HandWord word="FIX" size="clamp(64px, 7vw, 92px)" />
              </span>
            </div>
            <div {...stylex.props(s.stack, s.above)} style={{ gap: 14 }}>
              <StackedFigure value="0.3" unit={['seconds', 'a fix']} />
              <p {...stylex.props(s.meta)}>A typical fix, after the first one, measured on an M3 Max.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 05 Private ────────────────────────────────────────────────────────────────────────
function Private() {
  return (
    <section id="private" aria-labelledby="private-title" {...stylex.props(s.pinkPlate)}>
      <GhostWord lines={['PRI', 'VATE']} tone="pink" style={{ right: '-2vw', bottom: '-9vw', fontSize: 'clamp(150px, 20vw, 300px)', opacity: 0.45 }} />
      <div {...stylex.props(s.wrap)} style={{ paddingBlock: 'clamp(64px, 9vw, 120px) 40px' }}>
        <div {...stylex.props(s.two)}>
          <PageTitle id="private-title" lines={['Your words', 'stay here']} xstyle={s.onPink} />
          <div {...stylex.props(s.stack)} style={{ gap: 32, position: 'relative', zIndex: 1 }}>
            <p {...stylex.props(s.pinkBody)} data-tones="private">
              The model runs on your Mac, with Apple’s MLX. Your text is never sent anywhere: no account, no cloud, no tracking. Once the model is in, Iris even works offline.
            </p>
            <div {...stylex.props(s.figures)}>
              <StackedFigure value="0" unit={['servers', 'involved']} />
              <StackedFigure value="0" unit={['accounts', 'to make']} />
              <StackedFigure value="5" unit={['GB, once', 'the model']} />
            </div>
            <p {...stylex.props(s.pinkBody)} style={{ fontSize: '0.84375rem' }}>
              Iris never reads password fields, and stays out of password managers from the start.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 06 Make it yours ──────────────────────────────────────────────────────────────────
const methods = [
  { icon: 'icon-tones', name: 'Tones', text: 'Your style in your own words (“never use exclamation marks”), and tones of your own.' },
  { icon: 'icon-words', name: 'Words', text: 'Product names, people’s names and jargon, kept exactly as written.' },
  { icon: 'icon-apps', name: 'Apps', text: 'A starting tone per app, like Professional in Mail. Turn Iris off where it should never read.' },
  { icon: 'icon-shortcuts', name: 'Shortcuts', text: 'Your own keys, for both the panel and Quick Fix.' },
] as const;

function Yours() {
  return (
    <section id="yours" aria-labelledby="yours-title" {...stylex.props(s.spread)}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(40px, 6vw, 64px)' }}>
        <RunningHead seed={61} cols={['Settings']} />
        <div {...stylex.props(s.tonesHead)}>
          <PageTitle id="yours-title" lines={['Make it', 'yours']} />
          <div {...stylex.props(s.corner)}>
            <GhostWord lines={['YOU', 'RS']} tone="tan" style={{ right: -40, top: -36, fontSize: 150 }} />
            <span style={{ position: 'absolute', right: 20, top: 44 }}>
              <HandWord word="MINE" size="88px" />
            </span>
          </div>
        </div>
        <div {...stylex.props(s.methods)}>
          {methods.map((m) => (
            <div key={m.name} {...stylex.props(s.method)}>
              <span {...stylex.props(s.drawing)}>
                <Picture name={m.icon} alt="" scale={1} width={112} xstyle={s.drawingImg} />
              </span>
              <InkLabel>{m.name}</InkLabel>
              <p {...stylex.props(s.methodText)}>{m.text}</p>
            </div>
          ))}
          <div {...stylex.props(s.method)}>
            <span {...stylex.props(s.drawing)}>
              <Picture name="icon-privacy" alt="" scale={1} width={112} xstyle={s.drawingImg} />
              <span {...stylex.props(s.cross)}>
                <Printed mask={crossMask(5)} color="ink" />
              </span>
            </span>
            <InkLabel>Password fields</InkLabel>
            <p {...stylex.props(s.methodText)}>Never read. Password managers are turned off from the start.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 07 Menu bar and setup ─────────────────────────────────────────────────────────────
function MenuBar() {
  const steps = [
    ['Allow', 'Let Iris read the text box you’re typing in. macOS asks once.'],
    ['Get the model', 'One download, then it’s on your Mac for good.'],
    ['Try it', 'Fix a practice sentence, and you’re set.'],
  ];
  return (
    <section id="menu" aria-labelledby="menu-title" {...stylex.props(s.spread)} style={{ paddingTop: 0 }}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(40px, 6vw, 64px)' }}>
        <RunningHead seed={71} cols={['Menu bar', 'No Dock icon, no window', 'Setup takes about five minutes']} />
        <div {...stylex.props(s.menuGrid)}>
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
                sizes="(max-width: 760px) 52vw, 292px"
                alt="The Iris menu, open under its flower in the menu bar: a printed sky band with a flower, then Check text, Quick Fix, Free model memory, Setup, Settings, Check for Updates and Quit."
                xstyle={s.menuImg}
              />
            }
          />
          <div {...stylex.props(s.stack)} style={{ gap: 30 }}>
            <PageTitle id="menu-title" lines={['Lives in your', 'menu bar']} small />
            <p {...stylex.props(s.body)} data-tones="menu">
              The flower in your menu bar shows what Iris is doing. It wakes the model when you need it, and frees its memory by itself when you haven’t used it for a while.
            </p>
            <div>
              <SectionHead title="Set up in three steps" seed={73} />
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
      </div>
    </section>
  );
}

// ── 08 Install ────────────────────────────────────────────────────────────────────────
function Install() {
  const specs: [string, string][] = [
    ['Mac', 'Apple silicon, M1 or later'],
    ['macOS', '15 or later'],
    ['Memory', '16 GB for Faster, 24 GB or more for Best quality'],
    ['Disk', 'About 5 GB for the model'],
    ['Price', 'Free, MIT license'],
  ];
  return (
    <section id="install" aria-labelledby="install-title" {...stylex.props(s.spread)} style={{ backgroundColor: 'rgb(247 243 240)' }}>
      <div {...stylex.props(s.wrap, s.stack)} style={{ gap: 'clamp(40px, 6vw, 64px)' }}>
        <RunningHead seed={81} cols={['Install']} />
        <div {...stylex.props(s.two)}>
          <div {...stylex.props(s.stack)} style={{ gap: 36 }}>
            <PageTitle id="install-title" lines={['Get', 'Iris']} />
            <div {...stylex.props(s.cta)}>
              <BrushButton href={links.download} download>
                Download Iris
              </BrushButton>
              <PenLink href={links.source}>Build it from source</PenLink>
            </div>
            <dl {...stylex.props(s.specs)}>
              {specs.map(([k, v], i) => (
                <div key={k} {...stylex.props(s.specRow)} style={{ backgroundImage: penLine(85 + i) }}>
                  <dt {...stylex.props(s.specTerm)}>{k}</dt>
                  <dd {...stylex.props(s.specDef)}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div {...stylex.props(s.stack)} style={{ gap: 36 }}>
            <ol {...stylex.props(s.installSteps)}>
              {[
                ['Download', 'Get Iris.zip and open it.'],
                ['Drag', 'Move Iris into your Applications folder.'],
                ['Open', 'The first time, macOS asks you to confirm it. Once.'],
                ['Set up', 'Allow it, get the model, try it on a practice sentence.'],
              ].map(([t, d], i) => (
                <li key={t} {...stylex.props(s.installStep)}>
                  <span {...stylex.props(s.bigNo)}>{i + 1}</span>
                  <span {...stylex.props(s.setupTitle)}>{t}</span>
                  <span {...stylex.props(s.methodText)}>{d}</span>
                </li>
              ))}
            </ol>
            <div {...stylex.props(s.sheet, s.why)}>
              <span {...stylex.props(s.grain)} />
              <span {...stylex.props(s.brush)} style={{ fontSize: '1.625rem', lineHeight: 1, position: 'relative' }}>
                Why does macOS ask?
              </span>
              <p {...stylex.props(s.body)} style={{ fontSize: '0.875rem', position: 'relative' }} data-tones="why">
                Apple charges a yearly fee to vouch for apps, and Iris is free, so it doesn’t pay it. Every release is signed with the same certificate instead: you confirm Iris once and allow it once, and both stick through updates. The code is all public if you’d rather check it.
              </p>
            </div>
          </div>
        </div>
        <div {...stylex.props(s.anyway)} data-scrolls>
          <div {...stylex.props(s.anywayInner)}>
          <Picture
            name="open-anyway"
            scale={2}
            sizes="(max-width: 1280px) 100vw, 1240px"
            alt="Three drawn steps: macOS says Iris was not opened, click Done; in System Settings, Privacy and Security, click Open Anyway; confirm with Open Anyway and your password."
          />
          </div>
        </div>
      </div>
    </section>
  );
}

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


export function Page() {
  return (
    <>
      <a href="#moment" {...stylex.props(s.srOnly, s.skip)}>
        Skip to how it works
      </a>
      <Cover />
      <main>
        <Moment />
        <Tones />
        <Fixes />
        <Private />
        <Yours />
        <MenuBar />
        <Install />
        <WhatsNew />
      </main>
      <Footer />
      <PressPanel />
    </>
  );
}

// ── ⌃ ⌥ G on the page ─────────────────────────────────────────────────────────────────
// Press the keys anywhere and the page does what Iris does: the keys go down, the flower grows
// by the paragraph you're reading and the panel opens on it. Fix finds nothing ("looks good":
// the page is already fine); Tab tries the tones, Return puts one on the page, ⌘Z takes it
// back, Esc closes. The words are written by hand (content.ts): no model runs here. With Iris
// installed the keys never reach the page; Iris takes them, so the try-it box gets the real thing.
const pressNames = ['Fix', ...pressTones];
function PressPanel() {
  return (
    <>
      <script type="application/json" data-press-tones dangerouslySetInnerHTML={{ __html: JSON.stringify({ tones: pressTones, pageTones }).replace(/</g, '\\u003c') }} />
      <div data-press hidden role="dialog" aria-label="Iris" tabIndex={-1} {...stylex.props(s.press)}>
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
      <div data-press-note hidden role="status" {...stylex.props(s.toast)}>
        <HandTick size={16} /> <span data-press-note-text />
      </div>
      <span data-press-said role="status" {...stylex.props(s.srOnly)} />
      <div data-press-psst hidden aria-hidden {...stylex.props(s.psst)}>
        <span data-psst-keys>psst: ⌃ ⌥ G works on this page too</span>
      </div>
    </>
  );
}

