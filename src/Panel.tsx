// Iris's panel, the one the app opens by your text (PanelView.swift), drawn once for the whole
// site: section 03's tones, the panel ⌃ ⌥ G opens on the page, and anywhere else it shows.
// Tone names over a strong pen rule, the message, a faint rule, then the footer: the keys (or
// a note such as "looks good") on the left; "into" the app on a strip of tape with the app's
// icon stuck on its corner, and Replace with its ↵ chip, on the right.
//
// It only draws. The page script (client.ts) chooses tones, swaps the message and springs the
// height; the data attributes below are its hooks.
import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { diff } from './content';
import { BrushButton, KeyRow } from './parts';
import { HandTick, markerMask, PenRule, Printed, seedOf } from './pen';
import { font, ink, tex } from './tokens.stylex';

const MOBILE = '@media (max-width: 760px)';
const STILL = '@media (prefers-reduced-motion: reduce)';

const swipeIn = stylex.keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
});

export const panel = stylex.create({
  // Lifted off whatever print is behind it: a hairline edge in the shadow's own ink, a close
  // contact shadow and a long soft one, so it stands out without a drawn border.
  sheet: { position: 'relative', backgroundColor: ink.paper, boxShadow: '0 0 0 1px rgb(42 26 22 / 0.1), 0 2px 3px rgb(42 26 22 / 0.12), 0 10px 22px -6px rgb(42 26 22 / 0.3), 0 34px 64px -18px rgb(42 26 22 / 0.42)' },
  grain: { position: 'absolute', inset: 0, backgroundImage: tex.paper, backgroundSize: '64px 64px', pointerEvents: 'none' },
  pad: { padding: '18px 24px 18px', [MOBILE]: { padding: '14px 14px' } },
  // The panel itself takes focus when it opens (not a tab), so nothing is ringed at first.
  root: { ':focus': { outline: 'none' } },
  tabs: { display: 'flex', alignItems: 'baseline', gap: 'clamp(14px, 2.6vw, 30px)', flexWrap: 'wrap', paddingBottom: 10, position: 'relative', zIndex: 1 },
  tab: {
    position: 'relative',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: '6px 2px',
    fontFamily: font.mono,
    fontSize: 14,
    color: { default: ink.i11, '@media (hover: hover)': { default: ink.i11, ':hover': ink.i12 } },
    cursor: 'pointer',
    minHeight: 40,
  },
  chosen: { fontFamily: font.brush, fontSize: 26, lineHeight: 1, color: ink.i12, position: 'relative', display: 'inline-block', isolation: 'isolate', paddingInline: 3 },
  marker: {
    position: 'absolute',
    left: -4,
    right: -6,
    bottom: -3,
    height: 13,
    zIndex: -1,
    animationName: swipeIn,
    animationDuration: '280ms',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    [STILL]: { animationName: 'none' },
  },
  // As the app sets the message (DS.Font.subtitle): the mono a touch heavier than body text.
  message: { position: 'relative', fontSize: 'clamp(14px, 1.5vw, 16px)', fontWeight: 540, lineHeight: 1.85, color: ink.i12, margin: 0, paddingBlock: 16 },
  gone: { color: ink.espresso, textDecorationLine: 'line-through', textDecorationThickness: '1.5px', opacity: 0.75 },
  added: { backgroundColor: 'rgb(240 134 176 / 0.45)', paddingInline: 2, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', textDecoration: 'none' },
  foot: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 14 },
  hints: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  hint: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '0.08em', borderWidth: 0, backgroundColor: 'transparent', padding: 0, fontFamily: font.mono, cursor: 'pointer', color: { default: ink.i10, '@media (hover: hover)': { default: ink.i10, ':hover': ink.i12 } } },
  // "looks good": Iris's word over the pink marker, with a tick.
  good: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: font.brush, fontSize: 24, lineHeight: 1, color: ink.i12, position: 'relative', isolation: 'isolate' },
  goodMarker: { position: 'absolute', left: -4, right: -6, bottom: -2, height: 12, zIndex: -1 },
  // As tall as Replace even when it isn't there ("looks good"), so the panel keeps its height.
  right: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginLeft: 'auto', minHeight: 52 },
  into: { display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13, color: ink.i10 },
  // The app's TapeLabel: the name on a strip of tape, the app's icon stuck on its corner.
  tape: { position: 'relative', display: 'inline-flex', alignItems: 'center', paddingBlock: 3, paddingInline: 12, fontSize: 12.5, fontWeight: 430, color: ink.i12, transform: 'rotate(-1.5deg)' },
  taped: { marginLeft: 14 },
  sticker: { position: 'absolute', left: -18, top: -9, width: 26, height: 26, transform: 'rotate(-9deg)', zIndex: 1 },
  // The Replace key's chip, as the app's TactileButton draws it: an outline, not a cap.
  chip: { display: 'inline-grid', placeItems: 'center', width: '1.5em', height: '1.5em', borderWidth: 1.5, borderStyle: 'solid', borderColor: 'rgb(255 252 249 / 0.85)', borderRadius: 4, fontSize: 13, color: ink.paper, lineHeight: 1 },
  done: { fontFamily: font.brush, fontSize: 24, color: ink.i12, display: 'inline-flex', alignItems: 'center', gap: 6 },
  stack: { display: 'grid' },
  cell: { gridArea: '1 / 1', minWidth: 0 },
  sizer: { visibility: 'hidden', pointerEvents: 'none' },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
});

const tapeMask = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30' preserveAspectRatio='none'><path d='M2,1L98,0L96.5,6L99.5,12L97,18L99.4,24L98,30L1,29L3,23L0.5,17L2.6,11L0.4,5Z'/></svg>")}")`;

/** Word by word, as Iris marks a change: your words struck through, its words in pink. */
export function Marks({ text, from }: { text: string; from: string }) {
  return (
    <>
      {diff(from, text).map((seg, i) => {
        const space = i > 0 && !/^[^\w]/.test(seg.text) ? ' ' : '';
        if (seg.kind === 'same') return <span key={i}>{space + seg.text}</span>;
        return (
          <span key={i}>
            {space}
            {seg.kind === 'gone' ? <del {...stylex.props(panel.gone)}>{seg.text}</del> : <ins {...stylex.props(panel.added)}>{seg.text}</ins>}
          </span>
        );
      })}
    </>
  );
}

/** The panel's messages, one per tone, stacked in one place: the room is always the longest
 *  one's, at every width, so changing tone never moves anything. Only the chosen one shows;
 *  the rest hold their room unseen (and screen readers skip those copies). */
export function MessageStack({ children, sizers }: { children: ReactNode; sizers: ReactNode[] }) {
  return (
    <div {...stylex.props(panel.stack)}>
      {sizers.map((s, i) => (
        <div key={i} aria-hidden {...stylex.props(panel.cell, panel.sizer)}>
          {s}
        </div>
      ))}
      <div {...stylex.props(panel.cell)}>{children}</div>
    </div>
  );
}

type Data = Record<string, string | boolean | number | undefined>;
export type PanelProps = {
  /** The tone names; the first is chosen. */
  tabs: readonly string[];
  /** Attributes for each tab (ids, aria-controls, hooks). */
  tab?: (i: number) => Data;
  /** The message: one element, or one per tab. */
  children: ReactNode;
  /** The app the text goes into: its name and, if it has one, its icon in public/app. */
  app: { name: string; icon?: string };
  /** Footer note in place of the keys ("looks good"), shown or hidden by the script. */
  good?: boolean;
  /** Hooks for the script, on the panel, the tablist, the keys, "into", the tape's name and Replace. */
  hooks?: { root?: Data; tabs?: Data; next?: Data; keys?: Data; good?: Data; into?: Data; where?: Data; replaceWrap?: Data; replace?: Data; icon?: Data };
  /** What sits beside Replace while it says "replaced". */
  after?: ReactNode;
  /** Extra lines between the message and the faint rule. */
  under?: ReactNode;
  seed?: number;
};

export function Panel({ tabs, tab, children, app, good = false, hooks = {}, after, under, seed = 33 }: PanelProps) {
  return (
    <div {...stylex.props(panel.sheet, panel.pad, panel.root)} {...hooks.root}>
      <span {...stylex.props(panel.grain)} />
      <div role="tablist" aria-label="Tone" {...stylex.props(panel.tabs)} {...hooks.tabs}>
        {tabs.map((name, i) => (
          <button key={name} type="button" role="tab" aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} {...stylex.props(panel.tab)} {...tab?.(i)}>
            <span data-plain hidden={i === 0}>{name}</span>
            <span data-chosen hidden={i !== 0} {...stylex.props(panel.chosen)}>
              <span aria-hidden {...stylex.props(panel.marker)}>
                <Printed mask={markerMask(seedOf(name))} color="pink" />
              </span>
              {name}
            </span>
          </button>
        ))}
      </div>
      <PenRule seed={seed} strong />
      {children}
      {under}
      <PenRule seed={seed + 1} />
      <div {...stylex.props(panel.foot)}>
        <div {...stylex.props(panel.hints)}>
          <span hidden={!good} {...stylex.props(panel.good)} {...hooks.good}>
            <span aria-hidden {...stylex.props(panel.goodMarker)}>
              <Printed mask={markerMask(seedOf('looks good'))} color="pink" />
            </span>
            <HandTick size={16} /> looks good
          </span>
          <span hidden={good} {...stylex.props(panel.hints)} {...hooks.keys}>
            <button type="button" aria-label="Next tone" {...stylex.props(panel.hint)} {...hooks.next}>
              <KeyRow keys={['⇥']} /> NEXT TONE
            </button>
            {/* Asks for the tone again: the page marks the version afresh (client.ts). */}
            <button type="button" aria-label="Try again" data-try-again {...stylex.props(panel.hint)}>
              <KeyRow keys={['⌘', 'R']} /> TRY AGAIN
            </button>
          </span>
        </div>
        <div {...stylex.props(panel.right)}>
          <span {...stylex.props(panel.into)}>
            <span {...hooks.into}>{good ? 'nothing to change in' : 'into'}</span>
            <span {...stylex.props(panel.tape, !!app.icon && panel.taped)}>
              <Printed mask={tapeMask} color="tape" />
              <img src={app.icon ? `/app/${app.icon}.png` : ''} hidden={!app.icon} alt="" width={26} height={26} loading="lazy" decoding="async" {...stylex.props(panel.sticker)} {...hooks.icon} />
              <span style={{ position: 'relative' }} {...hooks.where}>{app.name}</span>
            </span>
          </span>
          {after}
          <span hidden={good} {...hooks.replaceWrap}>
            <BrushButton hint={<span role="img" aria-label="Return" {...stylex.props(panel.chip)}>↵</span>} data={{ ...(hooks.replace as Record<string, string>) }}>
              Replace
            </BrushButton>
          </span>
        </div>
      </div>
    </div>
  );
}
