// How it works (section 02): the top left corner of a Mac on a torn print, running out past the
// sheet's right and bottom edges, as the menu bar's Mac does on the left in section 07. On its
// desktop, six apps take turns: in each a reply is waiting, the shortcut goes down, Iris's
// flower grows by the text box, its panel marks the fixes, Return puts them in.
//
// Every app, name and sentence here is made up; nothing is anyone's. The windows are simply
// drawn (they're the setting, not the subject); Iris's flower and panel are the app's own, as
// the rest of the page draws them (fableFlower.ts, Panel.tsx).
//
// The scene is laid out on a fixed canvas (CANVAS, in px) and zoomed to fit the screen by
// client.ts, so the panel and the windows keep their proportions at every size. The clock
// is client.ts too: it sets `data-at` on the scene to the beats reached (s1 s2 …) and marks
// the app on screen `data-on`; global.css turns those into motion.
import * as stylex from '@stylexjs/stylex';
import type React from 'react';
import { diff } from './content';
import { flower, type FlowerPart } from './fableFlower';
import { Marks, Panel, panel } from './Panel';
import { KeyRow } from './parts';
import { Pattern } from './Patterns';
import { font, ink, tex } from './tokens.stylex';

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD   (one app's turn; then the next app)
 *
 *    0ms   this app comes forward on top, solid in 90ms, up 22px → 0, scale 0.97 → 1;
 *          the app before stays solid under it, then goes (150 → 340ms)
 *  200ms   the last words of the reply type in (≈36ms a letter), caret after them
 *  900ms   ⌃ ⌥ go down, G a beat after (stagger 70ms), on the key slip
 * 1300ms   Iris's flower grows by the text box, a closed bud, overshooting a little
 * 1800ms   the bud opens
 * 2050ms   the panel unfolds out of it, marking the fixes          (Read)
 * 4600ms   ↵ goes down; Replace is pressed                          (Replace)
 * 4800ms   the panel folds back into the flower
 * 5000ms   the fixed words land in the box, Iris's words in pink
 * 5700ms   the flower goes; the pink fades out (1.2s)
 * 6600ms   the next app
 * ───────────────────────────────────────────────────────── */
export const TIMING = {
  typeFrom: 200,   // the last words start typing in
  typeTo:   820,   // and are all there
  press:    900,   // ⌃ ⌥ G down (G 140ms after ⌃)
  bud:      1300,  // the flower grows, a closed bud
  panel:    1800,  // the bud opens; the panel follows it out (PANEL_AFTER, in global.css: 250ms)
  enter:    4600,  // ↵ down, Replace pressed
  replace:  4800,  // the panel folds back into the flower
  land:     5000,  // the fixed words land in the box, in pink
  wilt:     5700,  // the flower goes, the pink fades
  next:     6600,  // the next app comes forward
};
/** How many letters of each reply type in before the shortcut: its last word or two. */
export const TYPED = 18;
/** The steps beside the scene (Page.tsx, Moment) are chapters of each turn: Press, Read, Replace. */
export const CHAPTERS = [0, TIMING.panel, TIMING.enter];

/** The canvas everything is laid out on, in px; client.ts zooms it to the screen. */
export const CANVAS = { width: 800, height: 650, bar: 26, phone: 620 };

/* The apps, in turn. Each: where its window is, its reply as written, and as Iris fixes it
 * (only the grammar: "pls" stays). */
type App = { key: 'slack' | 'mail' | 'messages' | 'notes' | 'chrome' | 'safari'; name: string; draft: string; fixed: string };
export const APPS: App[] = [
  { key: 'slack', name: 'Slack', draft: 'hey team, the new build are ready for test, let me know if anything break', fixed: 'hey team, the new build is ready to test, let me know if anything breaks' },
  { key: 'mail', name: 'Mail', draft: 'Thank you for you’re notes, I will send the final deck tomorrow morning', fixed: 'Thank you for your notes. I will send the final deck tomorrow morning.' },
  { key: 'messages', name: 'Messages', draft: 'running abit late, save me a seat pls', fixed: 'running a bit late, save me a seat pls' },
  { key: 'notes', name: 'Notes', draft: 'bring the charger, the book’s for Ana and a umbrella', fixed: 'bring the charger, the books for Ana and an umbrella' },
  { key: 'chrome', name: 'Chrome', draft: 'The checkout page dont load on my phone since yesterday', fixed: 'The checkout page hasn’t loaded on my phone since yesterday' },
  { key: 'safari', name: 'Safari', draft: 'Made this last night, it were delicious and the kids loves it', fixed: 'Made this last night, it was delicious and the kids loved it' },
];

/* Iris's flower by the text box: the cover's flower (fableFlower.ts), small, its petals
 * folded up into a bud until the panel opens. `open` is how far the petals turn while it's a
 * bud, as a share of their open angle. */
const BUD = {
  width: 84,                                         // px on the canvas
  room: { left: -50, top: -116, width: 100, height: 126 },   // the rig's points it's laid out in, round its foot
  closed: 0.12,                                      // the petals' turn as a bud
  foot: { left: -70, rise: 14 },                     // where its foot stands: left of the box's corner, up into it
  bloom: ['back-1', 'back-2', 'heart', 'standard-2', 'standard-4', 'standard-1', 'standard-5', 'standard-3', 'fall-1', 'fall-3', 'fall-2', 'throat'] as FlowerPart[],
};

/* Iris's panel, out of the flower. */
// Its width, its gap over the box and its left edge are in `d.panel` and `d.above`.

// The screen's shape: the whole canvas wide; on a phone, CANVAS.phone px of it, following the app (client.ts).
const SCREEN_SHAPE = '800 / 650';
const PHONE_SHAPE = '620 / 650';
const SYS = 'system-ui, -apple-system, "Helvetica Neue", sans-serif';

const pct = (v: number, of: number) => `${+((v / of) * 100).toFixed(3)}%`;
/** How far the bud's box runs under its foot (the room below the rig's ground), in px. */
const BUD_UNDER = Math.round((BUD.width * (BUD.room.height + BUD.room.top)) / BUD.room.width);
const BUD_BOTTOM = `calc(100% - ${BUD.foot.rise + BUD_UNDER}px)`;
const BUD_SHAPE = `${BUD.room.width} / ${BUD.room.height}`;

const d = stylex.create({
  // ── The Mac ──
  // As wide as the sheet allows, or as its height allows at the screen's shape.
  // The sheet's whole width, and (beside the steps) its whole height, so the gaps above and to
  // the left are the sheet's padding, equal; the canvas grows taller to fill (client.ts).
  box: { position: 'relative', flex: 'none', width: '100%', alignSelf: { default: 'stretch', '@media (max-width: 1000px)': 'auto' }, display: 'flex', flexDirection: 'column', containerType: 'inline-size' },
  bezel: { position: 'relative', flex: { default: 1, '@media (max-width: 1000px)': 'none' }, display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(24 22 22)', paddingTop: '2.2cqw', paddingLeft: '2.2cqw', borderTopLeftRadius: '6cqw', boxShadow: 'inset 1px 1px 0 rgb(255 255 255 / 0.12), 0 24px 48px -28px rgb(42 26 22 / 0.55)' },
  screen: { position: 'relative', flex: { default: 1, '@media (max-width: 1000px)': 'none' }, aspectRatio: { default: 'auto', '@media (max-width: 1000px)': SCREEN_SHAPE, '@media (max-width: 760px)': PHONE_SHAPE }, overflow: 'hidden', borderTopLeftRadius: '4.2cqw' },
  desk: { position: 'absolute', inset: 0 },
  // The canvas, zoomed to the screen's width by client.ts (--k).
  canvas: { position: 'absolute', left: 0, top: 0, width: 800, height: 650, zoom: 'var(--k, 0.6)', fontFamily: SYS, color: 'rgb(30 26 24)' },
  // ── The menu bar ──
  bar: { position: 'absolute', insetInline: 0, top: 0, height: 26, display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 26, backgroundColor: 'rgb(246 244 242 / 0.72)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', fontSize: 13, color: 'rgb(0 0 0 / 0.85)', zIndex: 3 },
  barName: { display: 'grid', fontWeight: 700 },
  barNameCell: { gridArea: '1 / 1' },
  // ── A window ──
  win: { position: 'absolute', backgroundColor: 'rgb(252 250 247)', borderRadius: 11, boxShadow: '0 0 0 0.5px rgb(0 0 0 / 0.22), 0 22px 50px -12px rgb(20 14 12 / 0.45), 0 2px 6px rgb(20 14 12 / 0.12)', display: 'flex', flexDirection: 'column' },
  winClip: { position: 'absolute', inset: 0, borderRadius: 11, overflow: 'hidden', pointerEvents: 'none' },
  titlebar: { position: 'relative', flex: 'none', height: 38, display: 'flex', alignItems: 'center', gap: 14, paddingInline: 14, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgb(0 0 0 / 0.08)', fontSize: 13, fontWeight: 600, color: 'rgb(0 0 0 / 0.7)' },
  lights: { display: 'flex', gap: 8, flex: 'none' },
  light: { width: 12, height: 12, borderRadius: '50%', boxShadow: 'inset 0 0 0 0.5px rgb(0 0 0 / 0.2)' },
  winTitle: { flex: 1, textAlign: 'center', marginRight: 52, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  body: { position: 'relative', flex: 1, display: 'flex', minHeight: 0 },
  side: { position: 'relative', flex: 'none', display: 'flex', flexDirection: 'column', gap: 4, paddingBlock: 14, paddingInline: 12, fontSize: 13, borderBottomLeftRadius: 11 },
  main: { position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '16px 20px' },
  row: { paddingBlock: 4, paddingInline: 8, borderRadius: 6, whiteSpace: 'nowrap' },
  muted: { color: 'rgb(0 0 0 / 0.5)', fontSize: 12 },
  rule: { height: 1, backgroundColor: 'rgb(0 0 0 / 0.08)', marginBlock: 10 },
  // Printed, never flat: a plate of ink with the page's screen over it.
  printed: { backgroundImage: `${tex.screen}, ${tex.streaks}`, backgroundSize: '96px 96px, 128px 128px' },
  avatar: { flex: 'none', width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: ink.paper },
  msg: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, marginBottom: 14 },
  who: { fontWeight: 700, marginRight: 8 },
  // ── The text box being written in ──
  box2: { position: 'relative', fontSize: 15, lineHeight: 1.5, borderWidth: 1, borderStyle: 'solid', borderColor: 'rgb(0 0 0 / 0.18)', borderRadius: 8, paddingBlock: 10, paddingInline: 12, backgroundColor: '#fff' },
  bare: { borderWidth: 0, paddingInline: 0, backgroundColor: 'transparent' },
  pill: { borderRadius: 18, paddingInline: 16 },
  texts: { display: 'grid' },
  text: { gridArea: '1 / 1' },
  caret: { display: 'inline-block', width: 1.5, height: '1.15em', marginLeft: 1, verticalAlign: '-0.2em', backgroundColor: 'rgb(30 26 24)' },
  // ── Iris ──
  bud: { position: 'absolute', zIndex: 4, width: BUD.width, aspectRatio: BUD_SHAPE, left: BUD.foot.left, bottom: BUD_BOTTOM },
  fill: { position: 'absolute', inset: 0 },
  part: { position: 'absolute', backgroundRepeat: 'no-repeat' },
  panel: { position: 'absolute', zIndex: 3, left: -10, fontFamily: font.mono },
  // The panel at the app's own proportions, a little smaller than the page's: wide enough that its
  // keys, the app's name and Replace sit on one line.
  panelScale: { width: 680, zoom: 0.8 },
  above: { bottom: 'calc(100% + 26px)', transformOrigin: '0 100%' },
  // ── The key slips, low on the screen ──
  slip: { position: 'absolute', zIndex: 4, left: 'calc(var(--cx, 0) * 1px + var(--view, 800) * 0.5px)', bottom: 30, display: 'flex', alignItems: 'center', gap: 14, paddingBlock: 12, paddingInline: 18, backgroundColor: ink.paper, backgroundImage: tex.paper, backgroundSize: '64px 64px', boxShadow: '0 0 0 1px rgb(42 26 22 / 0.1), 0 14px 30px -10px rgb(42 26 22 / 0.5)', fontFamily: font.brush, fontSize: 24, lineHeight: 1, color: ink.i12, whiteSpace: 'nowrap', zoom: 1.25 },
  slipKeys: { fontFamily: font.mono },
  // The panel's tones, a little closer than on the page, so all five fit on one line.
  tabs: { display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'nowrap', paddingBottom: 10, position: 'relative', zIndex: 1 },
});

/** One part of the flower, its base on `at` (rig points), turned by the bud's `--open`. */
function Part({ name, at }: { name: FlowerPart; at: readonly number[] }) {
  const p = flower.parts[name], sheet = flower.sheet, k = flower.scale, R = BUD.room;
  const inRoom = ([x, y]: readonly number[]) => [pct(x - R.left, R.width), pct(y - R.top, R.height)];
  const [left, top] = inRoom([at[0] - p.origin[0] / k, at[1] - p.origin[1] / k]);
  const petal = name !== 'stem' && name !== 'leaf';
  return (
    <div {...stylex.props(d.fill)} data-bud-part={petal ? '' : undefined} style={{ transformOrigin: inRoom(at).join(' '), rotate: petal ? `calc(var(--open) * ${p.angle}deg)` : `${p.angle}deg` }}>
      <div
        {...stylex.props(d.part)}
        style={{
          left,
          top,
          width: pct(p.width / k, R.width),
          height: pct(p.height / k, R.height),
          backgroundImage: `url(${sheet.src})`,
          backgroundSize: `${pct(sheet.width, p.width)} ${pct(sheet.height, p.height)}`,
          backgroundPosition: `${pct(p.sheet[0], sheet.width - p.width)} ${pct(p.sheet[1], sheet.height - p.height)}`,
        }}
      />
    </div>
  );
}
function Bud() {
  const head = [0, -flower.stem] as const;
  return (
    <div {...stylex.props(d.bud)} data-desk-bud style={{ transformOrigin: `50% ${pct(-BUD.room.top, BUD.room.height)}` }}>
      <Part name="leaf" at={[-3, 0]} />
      <Part name="stem" at={[0, 0]} />
      {BUD.bloom.map((name) => (
        <Part key={name} name={name} at={head} />
      ))}
    </div>
  );
}

/** The box being written in: the reply as written (caret at its end), and as fixed, with the
 *  words Iris put in in pink; Iris's flower at its corner and its panel out of the flower. */
function TextBox({ app, xstyle, style }: { app: App; xstyle?: stylex.StyleXStyles; style?: React.CSSProperties }) {
  const fixed = diff(app.draft, app.fixed).filter((s) => s.kind !== 'gone');
  return (
    <div {...stylex.props(d.box2, xstyle)} style={style} data-desk-box>
      <div {...stylex.props(d.texts)}>
        <span {...stylex.props(d.text)} data-desk-draft>
          <span data-desk-typed={app.draft}>{app.draft}</span>
          <span {...stylex.props(d.caret)} data-desk-caret />
        </span>
        <span {...stylex.props(d.text)} data-desk-fixed>
          {fixed.map((s, i) => {
            const space = i > 0 && !/^[^\w]/.test(s.text) ? ' ' : '';
            return s.kind === 'same' ? (
              <span key={i}>{space + s.text}</span>
            ) : (
              <span key={i}>
                {space}
                <span data-desk-new>{s.text}</span>
              </span>
            );
          })}
        </span>
      </div>
      <Bud />
      <div {...stylex.props(d.panel, d.above)} data-desk-panel>
        <div {...stylex.props(d.panelScale)}>
        <Panel tabs={['Fix', 'Professional', 'Friendly', 'Shorter', 'Clearer']} app={{ name: app.name, icon: app.key }} seed={90} hooks={{ replace: { 'data-desk-replace': '' }, tabs: stylex.props(d.tabs) as { className: string } }}>
          <p {...stylex.props(panel.message)}>
            <Marks text={app.fixed} from={app.draft} />
          </p>
        </Panel>
        </div>
      </div>
    </div>
  );
}

/** A window: its title bar (three lights and a title), then its body. */
function Win({ at, title, tone = 'rgb(252 250 247)', children, bar }: { at: [number, number, number, number]; title?: string; tone?: string; children: React.ReactNode; bar?: React.ReactNode }) {
  const [left, top, width, height] = at;
  return (
    <div {...stylex.props(d.win)} style={{ left, top, width, height, backgroundColor: tone }}>
      <div {...stylex.props(d.titlebar)}>
        <span {...stylex.props(d.lights)}>
          {['rgb(237 106 94)', 'rgb(245 191 79)', 'rgb(98 197 84)'].map((c) => (
            <span key={c} {...stylex.props(d.light)} style={{ backgroundColor: c }} />
          ))}
        </span>
        {bar ?? <span {...stylex.props(d.winTitle)}>{title}</span>}
      </div>
      <div {...stylex.props(d.body)}>{children}</div>
    </div>
  );
}

const Av = ({ c, children }: { c: string; children: string }) => (
  <span {...stylex.props(d.avatar, d.printed)} style={{ backgroundColor: c }}>
    {children}
  </span>
);

/** Each app's window, simply drawn round its text box. */
function Screen({ app }: { app: App }) {
  switch (app.key) {
    case 'slack':
      return (
        <Win at={[22, 42, 680, 502]} title="# launch · Acme">
          <div {...stylex.props(d.side, d.printed)} style={{ width: 180, backgroundColor: 'rgb(74 28 74)', color: 'rgb(255 255 255 / 0.72)' }}>
            <b style={{ color: '#fff', fontSize: 15, padding: '0 8px 10px' }}>Acme</b>
            {['# general', '# launch', '# design', '# random'].map((c) => (
              <span key={c} {...stylex.props(d.row)} style={c === '# launch' ? { backgroundColor: 'rgb(255 255 255 / 0.2)', color: '#fff' } : undefined}>
                {c}
              </span>
            ))}
            <span {...stylex.props(d.row)} style={{ marginTop: 10, fontSize: 12 }}>Direct messages</span>
            {['Maya Chen', 'Sam Lee'].map((c) => (
              <span key={c} {...stylex.props(d.row)}>{c}</span>
            ))}
          </div>
          <div {...stylex.props(d.main)}>
            <b style={{ fontSize: 15 }}># launch</b>
            <div {...stylex.props(d.rule)} />
            <div {...stylex.props(d.msg)}>
              <Av c="rgb(120 162 220)">M</Av>
              <div>
                <b {...stylex.props(d.who)}>Maya Chen</b>
                <span {...stylex.props(d.muted)}>10:02</span>
                <div>Build 214 is on staging 🎉</div>
              </div>
            </div>
            <div {...stylex.props(d.msg)}>
              <Av c="rgb(196 157 122)">S</Av>
              <div>
                <b {...stylex.props(d.who)}>Sam Lee</b>
                <span {...stylex.props(d.muted)}>10:05</span>
                <div>Nice, running through the checklist now</div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <TextBox app={app} />
          </div>
        </Win>
      );
    case 'mail':
      return (
        <Win at={[40, 40, 660, 504]} title="Re: Friday’s review">
          <div {...stylex.props(d.main)} style={{ padding: '6px 24px 20px 70px', fontSize: 15, lineHeight: 1.5 }}>
            {[['To:', 'Sam Lee'], ['Subject:', 'Re: Friday’s review']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 10, paddingBlock: 9, borderBottom: '1px solid rgb(0 0 0 / 0.08)', fontSize: 14 }}>
                <span {...stylex.props(d.muted)} style={{ fontSize: 14, width: 60 }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <span style={{ marginTop: 18 }}>Hi Sam,</span>
            <span style={{ marginTop: 10 }}>Lovely to see everyone on Thursday.</span>
            <div style={{ flex: 1 }} />
            <TextBox app={app} xstyle={d.bare} />
            <span style={{ marginTop: 14 }}>Best,</span>
            <span>Alex</span>
          </div>
        </Win>
      );
    case 'messages':
      return (
        <Win at={[40, 42, 660, 502]} title="">
          <div {...stylex.props(d.side)} style={{ width: 190, backgroundColor: 'rgb(240 237 233)', borderRight: '1px solid rgb(0 0 0 / 0.08)' }}>
            {[['Maya Chen', 'are you still coming tonight?'], ['Book club', 'Chapter 6 for Sunday'], ['Sam Lee', 'see you there']].map(([n, l], i) => (
              <div key={n} {...stylex.props(d.row)} style={{ padding: '8px 10px', ...(i === 0 ? { backgroundColor: 'rgb(120 162 220)', color: '#fff' } : {}) }}>
                <b style={{ display: 'block', fontSize: 13 }}>{n}</b>
                <span style={{ fontSize: 12, opacity: 0.75 }}>{l}</span>
              </div>
            ))}
          </div>
          <div {...stylex.props(d.main)}>
            <div style={{ textAlign: 'center' }}>
              <span {...stylex.props(d.muted)}>To:</span> <b style={{ fontSize: 14 }}>Maya Chen</b>
            </div>
            <div {...stylex.props(d.rule)} />
            <div style={{ alignSelf: 'flex-start', maxWidth: '70%', backgroundColor: 'rgb(233 229 225)', borderRadius: 16, padding: '8px 14px', fontSize: 14, marginTop: 8 }}>are you still coming tonight?</div>
            <div {...stylex.props(d.printed)} style={{ alignSelf: 'flex-end', maxWidth: '70%', backgroundColor: 'rgb(84 136 214)', color: '#fff', borderRadius: 16, padding: '8px 14px', fontSize: 14, marginTop: 8 }}>yes! leaving work now</div>
            <div style={{ flex: 1 }} />
            <TextBox app={app} xstyle={d.pill} />
          </div>
        </Win>
      );
    case 'notes':
      return (
        <Win at={[24, 40, 680, 504]} title="">
          <div {...stylex.props(d.side)} style={{ width: 190, backgroundColor: 'rgb(244 240 234)', borderRight: '1px solid rgb(0 0 0 / 0.08)' }}>
            {[['Weekend trip', 'Today'], ['Groceries', 'Yesterday'], ['Gift ideas', 'Monday']].map(([n, l], i) => (
              <div key={n} {...stylex.props(d.row)} style={{ padding: '8px 10px', ...(i === 0 ? { backgroundColor: 'rgb(246 214 120)' } : {}) }}>
                <b style={{ display: 'block', fontSize: 13 }}>{n}</b>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{l}</span>
              </div>
            ))}
          </div>
          <div {...stylex.props(d.main)} style={{ padding: '18px 28px', fontSize: 15, lineHeight: 1.6 }}>
            <span {...stylex.props(d.muted)} style={{ textAlign: 'center' }}>Today at 9:41</span>
            <b style={{ fontSize: 22, marginBlock: '10px 6px' }}>Weekend trip</b>
            <span>Train leaves at 9:40, platform 4</span>
            <span>Ask Maya about the tent</span>
            <span>Book the cabin for two nights</span>
            <div style={{ flex: 1 }} />
            <TextBox app={app} xstyle={d.bare} style={{ marginBottom: 40 }} />
          </div>
        </Win>
      );
    case 'chrome':
      return (
        <Win
          at={[22, 38, 684, 506]}
          tone="rgb(250 248 245)"
          bar={
            <span style={{ display: 'flex', alignItems: 'flex-end', alignSelf: 'stretch', paddingTop: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 32, minWidth: 220, backgroundColor: '#fff', borderRadius: '10px 10px 0 0', fontWeight: 500, fontSize: 12.5 }}>
                <span {...stylex.props(d.printed)} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: 'rgb(236 110 176)' }} /> Feedback · Acme
              </span>
            </span>
          }
        >
          <div {...stylex.props(d.main)} style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', backgroundColor: '#fff', borderBottom: '1px solid rgb(0 0 0 / 0.08)' }}>
              <span {...stylex.props(d.muted)} style={{ fontSize: 16 }}>‹ › ↻</span>
              <span style={{ flex: 1, backgroundColor: 'rgb(240 237 233)', borderRadius: 16, padding: '6px 14px', fontSize: 13 }}>acme.example/feedback</span>
            </div>
            <div style={{ padding: '22px 70px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <b style={{ fontSize: 26, letterSpacing: '-0.01em' }}>Tell us what went wrong</b>
              <span {...stylex.props(d.muted)} style={{ fontSize: 14, marginTop: 6 }}>We read every message. Usually we reply within a day.</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>What happened?</span>
              <TextBox app={app} style={{ minHeight: 64 }} />
              <span {...stylex.props(d.printed)} style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgb(42 26 22)', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600 }}>Send</span>
            </div>
          </div>
        </Win>
      );
    case 'safari':
      return (
        <Win
          at={[36, 42, 664, 504]}
          tone="rgb(250 248 245)"
          bar={
            <span style={{ flex: 1, display: 'flex', justifyContent: 'center', marginRight: 52 }}>
              <span style={{ width: 300, textAlign: 'center', backgroundColor: 'rgb(236 233 229)', borderRadius: 8, padding: '5px 12px', fontSize: 12.5, fontWeight: 500 }}>bakery.example</span>
            </span>
          }
        >
          <div {...stylex.props(d.main)} style={{ padding: '20px 70px' }}>
            <div style={{ position: 'relative', height: 90, borderRadius: 8, overflow: 'hidden', isolation: 'isolate', backgroundColor: 'rgb(246 214 120)' }}>
              <Pattern kind="loops" color="rgb(236 190 90)" seed={41} scale={1.8} />
            </div>
            <b style={{ fontSize: 24, marginTop: 16 }}>Lemon drizzle cake</b>
            <span {...stylex.props(d.muted)} style={{ fontSize: 13, marginTop: 4 }}>Comments · 12</span>
            <div {...stylex.props(d.msg)} style={{ marginTop: 12 }}>
              <Av c="rgb(170 102 124)">J</Av>
              <div>
                <b {...stylex.props(d.who)}>Jo</b>
                <div>So soft, and it kept for days.</div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <TextBox app={app} />
          </div>
        </Win>
      );
  }
}

/* The desktop picture: a green plate with loops drawn over it in a paler green, and Iris's
 * flower as a fat, rough brush stroke in red, half off the screen, as a poster would crop it
 * (after the DESSN reel's fuzzy flower on its scribbled plate, in Iris's inks). */
export const WALL = {
  plate: 'rgb(48 146 88)',
  loops: 'rgb(86 172 116)',
  flowers: [
    { at: [760, 560], r: 190, petals: 5, turn: 0.3, width: 60, ink: 'rgb(217 67 46)' },   // the big one, on the right
    { at: [60, 640], r: 130, petals: 5, turn: 1.1, width: 40, ink: 'rgb(240 134 176)' },  // a pink one, low on the left
    { at: [770, 120], r: 64, petals: 4, turn: 0.2, width: 24, ink: 'rgb(246 214 120)' },   // a small yellow one, up by the menu bar
  ],
};
/** A flower drawn as one brush stroke: round lobes, each a little lopsided. */
function lobes(cx: number, cy: number, R: number, petals: number, turn: number, seed: number) {
  let d = '';
  const n = 240;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rad = R * (0.55 + 0.45 * Math.abs(Math.cos((petals * t) / 2))) * (1 + 0.05 * Math.sin(t * 3 + seed));
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(t + turn) * rad).toFixed(1)},${(cy + Math.sin(t + turn) * rad).toFixed(1)}`;
  }
  return d + 'Z';
}
function Wallpaper() {
  return (
    <span aria-hidden {...stylex.props(d.desk)} style={{ backgroundColor: WALL.plate, isolation: 'isolate', overflow: 'hidden' }}>
      <Pattern kind="loops" color={WALL.loops} seed={57} scale={1.2} count={9} />
      <svg viewBox="0 0 800 650" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <filter id="wall-rough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={7} />
            <feDisplacementMap in="SourceGraphic" scale={14} />
          </filter>
        </defs>
        {WALL.flowers.map((f, i) => (
          <path key={i} d={lobes(f.at[0], f.at[1], f.r, f.petals, f.turn, i + 1)} fill="none" stroke={f.ink} strokeWidth={f.width} strokeLinejoin="round" filter="url(#wall-rough)" />
        ))}
      </svg>
      <span {...stylex.props(d.desk, d.printed)} />
    </span>
  );
}

/** The whole scene, for the sheet in Page.tsx's Moment. Decorative: the figure round it says
 *  what it shows, and the steps beside it are its controls. */
export function Desk() {
  return (
    <div {...stylex.props(d.box)}>
      <div {...stylex.props(d.bezel)}>
        <div {...stylex.props(d.screen)} data-desk-screen>
          <Wallpaper />
          <div
            aria-hidden
            inert
            {...stylex.props(d.canvas)}
            data-desk
            data-at=""
            data-timing={JSON.stringify({ ...TIMING, typed: TYPED })}
            data-canvas={JSON.stringify(CANVAS)}
          >
            <div {...stylex.props(d.bar)}>
              <span {...stylex.props(d.barName)}>
                {APPS.map((a, i) => (
                  <span key={a.key} {...stylex.props(d.barNameCell)} data-desk-name={i} data-on={i === 0}>
                    {a.name}
                  </span>
                ))}
              </span>
              {['File', 'Edit', 'View', 'Window', 'Help'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            {APPS.map((a, i) => (
              <div key={a.key} data-desk-app={i} data-on={i === 0}>
                <Screen app={a} />
              </div>
            ))}
            <div {...stylex.props(d.slip)} data-desk-slip="press">
              <span {...stylex.props(d.slipKeys)}>
                <KeyRow keys={['⌃', '⌥', 'G']} />
              </span>
            </div>
            <div {...stylex.props(d.slip)} data-desk-slip="enter">
              <span {...stylex.props(d.slipKeys)}>
                <KeyRow keys={['↵']} />
              </span>
              Replace
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
