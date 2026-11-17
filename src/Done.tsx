// Iris's Done, as the app plays it once Replace puts the fix in (IrisRig.swift, "MARK: Done";
// Message.replaced; FloatingNote.origin). The one set of numbers and parts for every place on
// the page that plays it: the cover's garden (Garden.tsx) and How it works (Desk.tsx). Each
// lays them out in its own flower's room and runs them on its own clock; what happens, how
// far and how long, is only here, so the two can't drift apart from each other or the app.
//
//   +0ms     the panel goes at once (100ms), so the keys reach the app; the fix is pasted
//   +60ms    the front fall leaves the bloom and flies one high arc with a full turn (340ms),
//            a dotted pen trail behind it (the last half of the way it has come)
//   +150ms   Iris's note by the text: ✓ replaced, Undo with ⌘ Z (in 150ms, held 2400ms,
//            out 120ms), right-aligned on the text box's top edge
//   +400ms   the fall lands above the box's top edge, just in from its corner, as a stamp with
//            a tick: 0.55 → 1.1 → 1, throwing a pink ring with ink spokes (220ms), its pink
//            snapping into register; the trail is rubbed out (140ms). The app's plant then
//            stretches, folds back into its bud (180ms) and sinks into its puddle (260ms)
//   +1000ms  the stamp pops away (140ms)
import * as stylex from '@stylexjs/stylex';
import { panel } from './Panel';
import { KeyRow } from './parts';
import { HandTick, markerMask, Printed, seedOf, svgUrl } from './pen';
import { font, ink } from './tokens.stylex';

/** The app's Done, in its rig's points from the flower's foot and ms after Replace. */
export const DONE = {
  panelMs: 100,                                   // the panel goes at once
  flyFrom: 60, flyMs: 340,                        // the front fall's flight
  fallBelowHead: 16,                              // where it hangs, under the head
  stampAt: [64, -19] as const,                    // the app's (reach.right + 22, −19): above the box's top edge, just in from its corner
  lift: 360,                                      // how far the arc rises over the straight line
  spin: 360, shrink: 0.85,
  dash: 2.5, gap: 4,                              // the trail's pen dots, along the way
  trailOutMs: 140,
  stamp: { tilt: -12, size: 1.15, holdMs: 600, popMs: 140, from: 0.55, over: 1.1, under: 0.97, steps: [70, 60, 60] },
  register: { from: [4.4, 3.9], to: [1.4, 1.4], waitMs: 50, snapMs: 120 },   // the stamp's pink off the line, in its points
  ring: { r: 16, grow: 5, ms: 220, spokes: 7 },
  note: { at: 150, inMs: 150, holdMs: 2400, outMs: 120 },   // shown once pasted; DS.Motion.fast, DS.Motion.toastHold
  // Once the stamp is down the app's plant folds back into its bud and sinks into its puddle,
  // a stem and seven tenths deep (the cover's flower stays instead).
  fold: { ms: 180, squash: 1.07, squashMs: 140 },
  sink: { afterMs: 100, ms: 260, depth: 1.7 },
  // The nod at Return: the head ducks one way, then leans the other and settles.
  nod: { ms: 360, back: -4, forward: 5 },
};
/** When the fall lands, ms after Replace. */
export const LANDS = DONE.flyFrom + DONE.flyMs;
/** How long the note is on screen from Replace until it has gone. */
export const NOTE_GONE = DONE.note.at + DONE.note.inMs + DONE.note.holdMs + DONE.note.outMs;

/** The flight: straight across, and up and down over it on one parabola, as the app's
 *  y = from + (to − from)·f² − lift·f(1 − f). `f` runs 0 → 1 over the flight. */
export const flightOf = (from: readonly number[], to: readonly number[]) => (f: number) => [
  from[0] + (to[0] - from[0]) * f,
  from[1] + (to[1] - from[1]) * f * f - DONE.lift * f * (1 - f),
];
/** The same parabola as a cubic Bézier on the vertical, for CSS (its middle points make it exactly the quadratic). */
export const flightBezier = (from: readonly number[], to: readonly number[]) => {
  const b = -DONE.lift / (to[1] - from[1]);
  return `cubic-bezier(0.3333, ${(b / 3).toFixed(4)}, 0.6667, ${((b + 1) / 3).toFixed(4)})`;
};
/** The trail's pen dots along a flight, each with the share of the flight it starts at. */
export const trailOf = (flight: (f: number) => number[]) => {
  const n = 600, pts = Array.from({ length: n + 1 }, (_, i) => ({ f: i / n, p: flight(i / n) }));
  const dots: { f: number; from: number[]; to: number[] }[] = [];
  let run = 0, start: (typeof pts)[number] | null = pts[0];
  for (let i = 1; i <= n; i++) {
    run += Math.hypot(pts[i].p[0] - pts[i - 1].p[0], pts[i].p[1] - pts[i - 1].p[1]);
    if (start && run >= DONE.dash) (dots.push({ f: start.f, from: start.p, to: pts[i].p }), (start = null), (run = 0));
    else if (!start && run >= DONE.gap) (start = pts[i]), (run = 0);
  }
  return dots;
};

/** The stamp's box, in the rig's points round where it lands: room for the ring it throws. */
export const STAMP_BOX = 50;
const stampBlot = svgUrl('-25 -25 50 50', "<ellipse rx='13' ry='9.5'/><ellipse cx='14.2' cy='6.8' rx='2.2' ry='1.8'/>");
const r1 = (v: number) => +v.toFixed(2);
const sv = (v: Record<string, string | number>) => v as React.CSSProperties;
const pctOf = (v: number, of: number) => `${+((v / of) * 100).toFixed(3)}%`;

const st = stylex.create({
  fill: { position: 'absolute', inset: 0 },
  svg: { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' },
  // Iris's note for a replace, as the app's Toast draws it: a paper slip with the paper shadow.
  note: { display: 'flex', alignItems: 'center', gap: 12, paddingBlock: 10, paddingInline: 16, whiteSpace: 'nowrap', boxShadow: '0 2px 2px rgb(42 26 22 / 0.08), 0 22px 34px -14px rgb(42 26 22 / 0.5)' },
  noteLead: { position: 'relative', isolation: 'isolate', fontFamily: font.brush, fontSize: 24, lineHeight: 1, color: ink.i12 },
  noteMarker: { position: 'absolute', left: -3, right: -3, bottom: -2, height: 8, zIndex: -1, rotate: '-1.2deg' },
  noteDetail: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: ink.i11 },
  // A note that says any of Iris's messages (SaysNote): its mark, its word's colour and marker,
  // and its keys follow data-kind and data-keys (client.ts sets them with the words).
  mark: { position: 'relative', display: 'none', alignItems: 'center', justifyContent: 'center' },
  bloom: { width: 30, height: 30, marginBlock: -3, objectFit: 'cover', objectPosition: '50% 0' },
  problem: { width: 24, height: 24, fontFamily: font.brush, fontSize: 20, lineHeight: 1, color: ink.red },
  ring: { position: 'absolute', inset: -2, overflow: 'visible' },
});
/** Iris's kinds of note, as the app draws their marks (ToastMark). */
export type NoteKind = 'success' | 'neutral' | 'warning';

type Hook = Record<string, unknown>;
/** Our own classes and a place's hook on one element: their class names joined, not one over the other. */
const withHook = (own: { className?: string }, hook: Hook) => ({ ...hook, className: [own.className, hook.className].filter(Boolean).join(' ') });
/** The stamp itself, filling its STAMP_BOX: the ring and spokes it throws, the paper, its pink
 *  (landing off the line and snapping into register) and the inked rim and tick. The hooks are
 *  where each place hangs its motion: the ring spreading, the ring and spokes thinning, the pink. */
export function StampFace({ hooks }: { hooks: { ringOut: Hook; ringThin: Hook; register: Hook } }) {
  const D = DONE, ring = D.ring;
  return (
    <>
      <svg viewBox="-25 -25 50 50" {...stylex.props(st.svg)}>
        <g {...hooks.ringOut} style={sv({ '--grow': (ring.r + ring.grow) / ring.r })}>
          <ellipse rx={ring.r} ry={ring.r * 0.8} fill="none" stroke="rgb(240 134 176)" strokeWidth={0} {...hooks.ringThin} style={sv({ '--w': 3.4 })} />
          {Array.from({ length: ring.spokes }, (_, k) => {
            const a = (k / ring.spokes) * Math.PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a) * 0.8;
            return <line key={k} x1={r1(c * (ring.r + 2))} y1={r1(s * (ring.r + 2))} x2={r1(c * (ring.r + 6))} y2={r1(s * (ring.r + 6))} stroke="rgb(42 26 22)" strokeWidth={0} strokeLinecap="round" {...hooks.ringThin} style={sv({ '--w': 1.8 })} />;
          })}
        </g>
      </svg>
      <div {...stylex.props(st.fill)} style={{ scale: String(D.stamp.size) }}>
        <svg viewBox="-25 -25 50 50" {...stylex.props(st.svg)}>
          <ellipse rx={13} ry={9.5} fill="rgb(255 252 249)" />
        </svg>
        <div
          {...withHook(stylex.props(st.fill), hooks.register)}
          style={sv({ '--rx': pctOf(D.register.from[0], STAMP_BOX), '--ry': pctOf(D.register.from[1], STAMP_BOX), '--gx': pctOf(D.register.to[0], STAMP_BOX), '--gy': pctOf(D.register.to[1], STAMP_BOX) })}
        >
          <Printed mask={stampBlot} color="pink" />
        </div>
        <svg viewBox="-25 -25 50 50" {...stylex.props(st.svg)}>
          <ellipse rx={13} ry={9.5} fill="none" stroke="rgb(42 26 22)" strokeWidth={1.8} />
          <path d="M-7,0 L-1.5,5 Q2.5,-1.5 9.5,-7" fill="none" stroke="rgb(42 26 22)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

/** Iris's note once the fix is in, as the app's Toast says it by your text: ✓ replaced, Undo
 *  with ⌘ Z. `motion` is how each place shows and hides it; `hook` marks it for the script and checks. */
export function ReplacedNote({ motion, hook }: { motion?: stylex.StyleXStyles; hook?: Hook }) {
  return (
    <div {...stylex.props(panel.sheet, st.note, motion)} data-done-note {...hook}>
      <span {...stylex.props(panel.grain)} />
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <HandTick size={18} />
      </span>
      <span {...stylex.props(st.noteLead)}>
        <span aria-hidden {...stylex.props(st.noteMarker)}>
          <Printed mask={markerMask(seedOf('replaced'))} color="pink" />
        </span>
        replaced
      </span>
      <span {...stylex.props(st.noteDetail)}>
        Undo with <KeyRow keys={['⌘', 'Z']} />
      </span>
    </div>
  );
}

/** One note that can say any of Iris's messages by your text (the app's Toast): a pink tick for
 *  done, the iris's bloom for working or a quiet note, a red ring round "?" for a problem; the
 *  lead in brush on the pink marker (red pen, no marker, for a problem); the detail; keys. The
 *  page draws it once and the script puts the words in (data-kind, data-keys, the lead and the
 *  detail), so a new message never adds markup. */
export function SaysNote({ motion, hook }: { motion?: stylex.StyleXStyles; hook?: Hook }) {
  return (
    <div {...stylex.props(panel.sheet, st.note, motion)} data-says data-kind="success" data-keys="" {...hook}>
      <span {...stylex.props(panel.grain)} />
      <span {...stylex.props(st.mark)} data-says-mark="success">
        <HandTick size={18} />
      </span>
      <span {...stylex.props(st.mark)} data-says-mark="neutral">
        <img src="/img/hero-flower-240.webp" alt="" width={30} height={30} loading="lazy" decoding="async" {...stylex.props(st.bloom)} />
      </span>
      <span {...stylex.props(st.mark, st.problem)} data-says-mark="warning">
        ?
        <svg viewBox="-12 -12 24 24" {...stylex.props(st.ring)} fill="none" stroke="rgb(217 67 46)" strokeWidth={1.8} strokeLinecap="round">
          <path d="M9.6,-3.4 C11.2,3.6 5.6,10.4 -1.2,10.6 C-8.4,10.8 -11.6,4 -10.4,-2.4 C-9.2,-8.8 -2.6,-11.2 3,-9.8 C6.6,-8.8 9.4,-6.2 10.2,-3" />
        </svg>
      </span>
      <span {...stylex.props(st.noteLead)} data-says-leadbox>
        <span aria-hidden {...stylex.props(st.noteMarker)} data-says-marker>
          <Printed mask={markerMask(seedOf('replaced'))} color="pink" />
        </span>
        <span data-says-lead>replaced</span>
      </span>
      <span {...stylex.props(st.noteDetail)}>
        <span data-says-detail>Undo with</span>
        <span data-says-keys="undo" hidden>
          <KeyRow keys={['⌘', 'Z']} />
        </span>
        <span data-says-keys="open" hidden>
          <KeyRow keys={['⌃', '⌥', 'G']} />
        </span>
      </span>
    </div>
  );
}
