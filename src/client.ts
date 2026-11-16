// Everything the page does after it loads, with no framework: the tones, the versions and
// the video. The page reads fine without it.
import { diff } from './diff';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** A row of tabs: click, or arrow keys, chooses one and shows its panel. A list going down
 *  (aria-orientation="vertical") takes ↑ and ↓ instead. */
function tabs(list: HTMLElement[], show: (i: number) => void) {
  const vertical = list[0]?.closest('[role="tablist"]')?.getAttribute('aria-orientation') === 'vertical';
  const [next, back] = vertical ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];
  const choose = (i: number, focus = false) => {
    list.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    show(i);
    if (focus) list[i].focus();
  };
  list.forEach((t, i) => {
    t.addEventListener('click', () => choose(i));
    t.addEventListener('keydown', (e) => {
      const step = e.key === next ? 1 : e.key === back ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      choose((i + step + list.length) % list.length, true);
    });
  });
  return choose;
}

// ── The panel's motion (section 03, Panel.tsx) ────────────────────────────────────────
/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Changing tone (a tab, ⇥, the arrows, or the panel on its own)
 *    0ms   the version on screen lifts 4px and fades (120ms)
 *  120ms   the new one settles from 4px below, fading in (220ms): never both at once
 *  190ms   its pink marks swipe on under the words, left to right (70ms apart)
 *
 * TRY AGAIN (⌘ R)
 *    0ms   ⌘ R go down; the pink marks wipe off right to left (110ms, 35ms apart)
 *          and the struck words dim, as Iris thinks again
 *  320ms   the marks swipe back on, one after another (70ms apart); struck words come back
 *
 * Replace (↵)
 *    0ms   Replace presses in (0.96) and springs back
 *   60ms   its label turns over: "Replace ↵" up and out, "✓ Replaced" up and in, same place
 *    0ms   the marked version fades out (120ms)
 *  120ms   the clean text, as it lands in the app, fades in in its place (240ms)
 * 2200ms   and back: the label turns back; the clean text out (120ms), then the marked
 *          version in, its marks swiping on
 * ───────────────────────────────────────────────────────── */
const PANEL_MOTION = {
  out:     { ms: 120, lift: -4 },                       // the version leaving
  in:      { ms: 220, delay: 120, from: 4 },            // the one arriving, once the other has gone
  swipe:   { ms: 260, gap: 70, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' },   // a mark swiping on
  wipe:    { ms: 110, gap: 35, ease: 'cubic-bezier(0.4, 0, 1, 1)' },       // a mark wiping off
  again:   { swipeAt: 320 },                            // TRY AGAIN: when the marks come back
  press:   { ms: 260, scale: 0.96, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  replace: { out: 120, fade: 240, hold: 2200 },         // marked out, clean in, and how long it stays
  key:     { ms: 160, down: 'translate(-1px, 2px) scale(0.96)' },
};
const ins = (el: Element) => $$<HTMLElement>('ins', el);
/** Iris's marks swiping on under its words, one after another. */
const swipeOn = (el: Element, delay = 0) =>
  ins(el).forEach((w, i) =>
    w.animate([{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }], { duration: PANEL_MOTION.swipe.ms, delay: delay + i * PANEL_MOTION.swipe.gap, easing: PANEL_MOTION.swipe.ease, fill: 'backwards' }),
  );
/** A copy of a version laid over it, for a moment: the one leaving, or the clean text. */
const overlay = (of: HTMLElement) => {
  const c = of.cloneNode(true) as HTMLElement;
  c.removeAttribute('id');
  c.removeAttribute('role');
  c.removeAttribute('data-tone');
  c.removeAttribute('data-press-text');
  c.removeAttribute('aria-live');
  c.removeAttribute('hidden');
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, { position: 'absolute', top: '0', left: '0', right: '0', margin: '0', pointerEvents: 'none' });
  of.parentElement!.style.position = 'relative';
  of.parentElement!.append(c);
  return c;
};
/** A keycap row pressed for a beat. */
const tapKeys = (el: Element) => $$<HTMLElement>('kbd', el).forEach((k) => k.animate([{ transform: 'none' }, { transform: PANEL_MOTION.key.down }, { transform: 'none' }], { duration: PANEL_MOTION.key.ms, easing: 'ease-out' }));

const panel = document.querySelector<HTMLElement>('[data-panel]');
if (panel) {
  const tabEls = $$<HTMLElement>('[data-tab]', panel);
  const messages = $$<HTMLElement>('[data-tone]', panel);
  const replaceBtn = panel.querySelector<HTMLElement>('[data-replace]')!;
  const said = panel.querySelector<HTMLElement>('[data-said]')!;
  let current = 0;
  let touched = false;
  let ghost: HTMLElement | null = null; // the version leaving
  let clean: HTMLElement | null = null; // the replaced text, while it shows
  let back = 0;
  /** Undo Replace's moment at once (a new tone, or its time is up). */
  const unreplace = (animate: boolean) => {
    clearTimeout(back);
    replaceBtn.removeAttribute('data-done');
    said.textContent = '';
    const msg = messages[current];
    const c = clean;
    clean = null;
    if (!c) return;
    if (!animate || still) return c.remove(), (msg.style.opacity = '');
    const R = PANEL_MOTION.replace;
    c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R.out, easing: 'ease-in', fill: 'forwards' }).finished.then(() => c.remove());
    msg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: R.fade, delay: R.out, easing: 'ease-out', fill: 'backwards' });
    msg.style.opacity = '';
    swipeOn(msg, R.out + 60);
  };
  const choose = tabs(tabEls, (i) => {
    const was = messages[current];
    unreplace(false);
    tabEls.forEach((t, k) => {
      t.querySelector('[data-plain]')!.toggleAttribute('hidden', k === i);
      t.querySelector('[data-chosen]')!.toggleAttribute('hidden', k !== i);
    });
    ghost?.remove();
    ghost = null;
    if (!still && i !== current && was) {
      // The version leaving is a copy over the new one, so the page's own state changes at once.
      const g = (ghost = overlay(was));
      g.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${PANEL_MOTION.out.lift}px` }], { duration: PANEL_MOTION.out.ms, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
        g.remove();
        if (ghost === g) ghost = null;
      });
    }
    messages.forEach((m, k) => m.toggleAttribute('hidden', k !== i));
    const next = messages[i];
    if (!still && i !== current) {
      next.animate([{ opacity: 0, translate: `0 ${PANEL_MOTION.in.from}px` }, { opacity: 1, translate: '0 0' }], { duration: PANEL_MOTION.in.ms, delay: PANEL_MOTION.in.delay, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      swipeOn(next, PANEL_MOTION.in.delay + 70);
    }
    current = i;
  });
  // It stops for good once someone reaches for it: a pointer over it, or focus inside it.
  const stop = () => (touched = true);
  for (const ev of ['pointerenter', 'pointerdown', 'focusin', 'keydown']) panel.addEventListener(ev, stop);
  panel.querySelector('[data-next]')?.addEventListener('click', (e) => {
    tapKeys(e.currentTarget as Element);
    choose((current + 1) % tabEls.length);
  });
  replaceBtn.addEventListener('click', () => {
    if (clean) return unreplace(true);
    const msg = messages[current];
    said.textContent = 'Replaced';
    replaceBtn.setAttribute('data-done', '');
    if (!still) replaceBtn.animate([{ scale: 1 }, { scale: PANEL_MOTION.press.scale, offset: 0.3 }, { scale: 1 }], { duration: PANEL_MOTION.press.ms, easing: PANEL_MOTION.press.ease });
    // The text as it lands in the app: the struck words gone, Iris's words plain.
    const c = (clean = overlay(msg));
    $$('del', c).forEach((d) => d.parentElement!.remove());
    ins(c).forEach((w) => w.replaceWith(w.textContent!));
    msg.style.opacity = '0';
    if (!still) {
      c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PANEL_MOTION.replace.fade, delay: PANEL_MOTION.replace.out, easing: 'ease-out', fill: 'backwards' });
      msg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: PANEL_MOTION.replace.out, easing: 'ease-in' });
    }
    back = window.setTimeout(() => unreplace(true), PANEL_MOTION.replace.hold);
  });
  // While nobody's touching it, the panel steps through the tones on its own, as if someone
  // were pressing Tab. Only while it's on screen, and never under Reduce Motion.
  if (!still) {
    let timer = 0;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => !touched && choose((current + 1) % tabEls.length), 3200);
    }, { threshold: 0.6 }).observe(panel);
  }
}

// ── A panel fitted to its box (Panel.tsx, PANEL_LAYOUT) ────────────────────────────────
// Laid out at 720px (or the width it asks for) so its footer is one line, and zoomed to the
// box's width. Where that would be too small to read (under 0.5), it's laid out at 480px instead, without its footer note.
for (const box of $$<HTMLElement>('[data-fit-panel]')) {
  const inner = box.firstElementChild as HTMLElement;
  const fit = () => {
    const room = box.clientWidth, full = Number(box.dataset.fitPanel) || 720;
    if (!room) return;
    const compact = room / full < 0.5, layout = compact ? 480 : full;
    box.toggleAttribute('data-compact', compact);
    inner.style.width = `${layout}px`;
    inner.style.zoom = String(Math.min(0.8, room / layout));
  };
  new ResizeObserver(fit).observe(box);
  fit();
}

// ── Section 03's panel where the room is short (Page.tsx, Tones) ─────────────────────
// Where its footer would wrap, it drops its key hints (`data-compact`), so "into" the app and
// Replace keep to one line, as the app's footer does; on a phone, where even its tone names
// wouldn't fit as they are, it's laid out `data-phone-panel` wide and zoomed to the room
// (`data-zoomed`).
for (const box of $$<HTMLElement>('[data-phone-panel]')) {
  const inner = box.querySelector<HTMLElement>(':scope > div')!, layout = Number(box.dataset.phonePanel);
  const keys = box.querySelector<HTMLElement>('[data-panel-keys]')!, replace = box.querySelector<HTMLElement>('[data-replace-wrap]')!;
  const fit = () => {
    const room = box.clientWidth;
    if (!room) return;
    const zoomed = room < layout + 24;
    box.toggleAttribute('data-zoomed', zoomed);
    inner.style.width = zoomed ? `${layout}px` : '';
    inner.style.zoom = zoomed ? String(Math.min(1, room / layout)) : '';
    // With its hints, is the footer two rows (the keys above Replace)?
    box.removeAttribute('data-compact');
    box.toggleAttribute('data-compact', keys.getBoundingClientRect().bottom <= replace.getBoundingClientRect().top + 1);
  };
  new ResizeObserver(fit).observe(box);
  fit();
}

// ── TRY AGAIN in a panel (Panel.tsx) ──────────────────────────────────────────────────
// As ⌘R does in the app, it asks for the tone again: the marks wipe off as Iris thinks, then
// swipe back on one after another (the storyboard above). (⌘R itself stays the browser's.)
for (const again of $$<HTMLButtonElement>('[data-try-again]')) {
  again.addEventListener('click', () => {
    const box = again.closest('[data-panel], [data-press]');
    const msg = box?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden]), [data-press-text]');
    tapKeys(again);
    if (!msg || still || msg.style.opacity === '0') return;
    const marks = ins(msg), M = PANEL_MOTION;
    marks.forEach((w, i) => {
      const back = marks.length - 1 - i; // right to left
      w.animate([{ backgroundSize: '100% 100%', backgroundPosition: '100% 0' }, { backgroundSize: '0% 100%', backgroundPosition: '100% 0' }], { duration: M.wipe.ms, delay: back * M.wipe.gap, easing: M.wipe.ease, fill: 'forwards' })
        .finished.then((a) => a.cancel());
    });
    const thinking = M.again.swipeAt + marks.length * M.swipe.gap;
    $$<HTMLElement>('del', msg).forEach((d) => d.animate([{ opacity: 0.75 }, { opacity: 0.3, offset: 0.35 }, { opacity: 0.75 }], { duration: thinking, easing: 'ease-in-out' }));
    // Hold each mark off until it swipes back on.
    marks.forEach((w, i) => w.animate([{ backgroundSize: '0% 100%' }, { backgroundSize: '0% 100%' }], { duration: M.again.swipeAt + i * M.swipe.gap }));
    swipeOn(msg, M.again.swipeAt);
  });
}

// ── PRIVATE, as tall as its section ───────────────────────────────────────────────────
// The ghost word runs up the Privacy section's left edge; its size is set so the word, P to E,
// runs the section's full height, P on the bottom edge and E on the top, at every width.
const privateSection = document.querySelector<HTMLElement>('#private');
const privateWord = privateSection && [...privateSection.querySelectorAll<HTMLElement>(':scope > span[aria-hidden]')].find((g) => g.textContent?.includes('PRIVATE'));
if (privateSection && privateWord) {
  const fit = () => {
    // Measure the letters' own ink, not their boxes: a P and an E have room either side of
    // them in the font, and that room is what kept them off the edges.
    const cs = getComputedStyle(privateWord);
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
    const em = parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) || 0;
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${em * 100}px`;
    const m = ctx.measureText('PRIVATE');
    const start = -m.actualBoundingBoxLeft, end = m.actualBoundingBoxRight;
    if (!(end > start)) return;
    // Sized so P to E is the section's height, and slid so the ink, not the box, is centred:
    // the P on the bottom edge, the E on the top.
    // A hair longer than the panel (the font's ink metrics stop a few pixels short), so the
    // panel's edges trim the P and the E: they sit right on the edges, never short of them.
    const k = (privateSection.clientHeight * 1.03) / (end - start);
    privateWord.style.fontSize = `${100 * k}px`;
    privateWord.style.transform = `rotate(-90deg) translate(${(-(start + end) / 2) * k}px, 0)`;
  };
  fit();
  document.fonts?.ready.then(fit);
  new ResizeObserver(fit).observe(privateSection);
}

// ── The shelf of versions ─────────────────────────────────────────────────────────────
const books = $$<HTMLElement>('[data-issue]');
if (books.length) {
  const facts = $$<HTMLElement>('[data-facts]');
  tabs(books, (i) => {
    const no = books[i].dataset.issue;
    facts.forEach((f) => f.toggleAttribute('hidden', f.dataset.facts !== no));
  });
}

// ── Make it yours: Iris's Settings window turns through its pages (Page.tsx, Yours) ───────
/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each `at` value is ms after a page is chosen
 * (by the clock, or by picking its name or its words on the list).
 *
 *     0ms   the old page sinks away: fades, drifts up 6px, blurs 4px
 *    90ms   the new page rises in: 10px → 0, blur 6px → 0, scale 0.985 → 1
 *   650ms   settled; the item's line starts filling
 *  5600ms   line full: the clock picks the next page, round and round
 *
 * The clock runs only while the window is on screen, holds while the pointer
 * is over the window or the list, and never runs under Reduce Motion (the
 * pages then just cross-fade when picked).
 * ───────────────────────────────────────────────────────── */
const YOURS_TIMING = {
  out:   240,   // the old page sinking away
  lag:    90,   // the new page starts after the old one has begun to go
  in:    560,   // the new page rising in
  dwell: 5600,  // each page's turn, from being chosen to the next one
};
{
  const list = document.querySelector<HTMLElement>('[data-yours]');
  const win = document.querySelector<HTMLElement>('[data-yours-window]');
  if (list && win) {
    const steps = $$<HTMLElement>('[data-yours-step]', list);
    const bars = $$<HTMLElement>('[data-yours-bar]', list);
    const pages = $$<HTMLElement>('[data-yours-page]', win);
    for (const [k, v] of Object.entries(YOURS_TIMING)) win.style.setProperty(`--yours-${k}`, `${v}ms`);

    let shown = 0, began = 0, held = false, seen = false, raf = 0;
    const show = (i: number) => {
      if (i !== shown) {
        pages[shown].dataset.was = 'true';
        const gone = pages[shown];
        setTimeout(() => delete gone.dataset.was, YOURS_TIMING.out + 40);
      }
      pages.forEach((p, k) => ((p.dataset.shown = String(k === i)), (p.inert = k !== i)));
      steps.forEach((st, k) => (st.dataset.active = String(k === i)));
      shown = i;
      began = performance.now();
      bars.forEach((b) => b.style.setProperty('--p', '0'));
    };
    const choose = tabs($$<HTMLElement>('[role="tab"]', list), show);
    // The item's words pick it too, not only its name.
    steps.forEach((st, k) => st.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('button')) choose(k);
    }));

    if (!still) {
      const tick = (now: number) => {
        if (held) began = now - (Number(bars[shown].style.getPropertyValue('--p')) || 0) * YOURS_TIMING.dwell;
        const p = Math.min(1, (now - began) / YOURS_TIMING.dwell);
        bars[shown].style.setProperty('--p', p.toFixed(3));
        if (p >= 1) choose((shown + 1) % pages.length);
        raf = requestAnimationFrame(tick);
      };
      const run = () => {
        if (seen && !raf) {
          began = performance.now() - (Number(bars[shown].style.getPropertyValue('--p')) || 0) * YOURS_TIMING.dwell;
          raf = requestAnimationFrame(tick);
        } else if (!seen && raf) (cancelAnimationFrame(raf), (raf = 0));
      };
      for (const el of [win, list]) {
        el.addEventListener('pointerenter', () => (held = true));
        el.addEventListener('pointerleave', () => (held = false));
      }
      new IntersectionObserver(([e]) => ((seen = e.isIntersecting), run()), { threshold: 0.35 }).observe(win);
    }
  }
}

// ── How it works: the desk (Desk.tsx), and its steps as chapters (Page.tsx, Moment) ─────────
// One clock for the scene: each app has a turn of TIMING.next ms; the beats it has reached go
// on the scene as data-at (global.css moves things by them). It runs only while on screen, and
// Pause holds it. The step the turn is on lights up and its line fills; picking a step jumps
// the turn to it. Under Reduce Motion it holds the panel open in Slack, and moves only when asked.
const desk = document.querySelector<HTMLElement>('[data-desk]');
const chapterList = document.querySelector<HTMLElement>('[data-chapters]');
if (desk && chapterList) {
  const T = JSON.parse(desk.dataset.timing!) as Record<'typeFrom' | 'typeTo' | 'press' | 'bud' | 'panel' | 'enter' | 'replace' | 'land' | 'wilt' | 'next' | 'typed', number>;
  const C = JSON.parse(desk.dataset.canvas!) as { width: number; height: number; phone: number };
  const beats = [T.press, T.bud, T.panel, T.enter, T.replace, T.land, T.wilt]; // s1 … s7
  const apps = $$<HTMLElement>('[data-desk-app]', desk);
  const names = $$<HTMLElement>('[data-desk-name]', desk);
  const screen = desk.closest<HTMLElement>('[data-desk-screen]')!;
  const toggle = document.querySelector<HTMLButtonElement>('[data-moment-toggle]');
  const starts = chapterList.dataset.chapters!.split(',').map(Number);
  const steps = $$<HTMLElement>('[data-chapter]', chapterList);
  const bars = steps.map((st) => st.querySelector<HTMLElement>('[data-chapter-bar]')!);
  const phone = matchMedia('(max-width: 760px)');

  // The canvas, zoomed to the screen; on a phone, the part of it round the app's text box.
  const fit = () => {
    const view = phone.matches ? C.phone : C.width;
    const k = screen.clientWidth / view;
    desk.style.setProperty('--k', String(k));
    // As tall as the screen, at least the canvas's own height: beside the steps the screen fills
    // the sheet, and the extra is more desktop under the windows.
    desk.style.height = `${Math.max(C.height, screen.clientHeight / k)}px`;
    desk.style.setProperty('--view', String(view));
    follow();
  };
  const follow = () => {
    if (!phone.matches) return desk.style.setProperty('--cx', '0');
    const box = apps[shownApp < 0 ? 0 : shownApp].querySelector<HTMLElement>('[data-desk-box]');
    let x = 0;
    for (let el: HTMLElement | null = box; el && el !== desk; el = el.offsetParent as HTMLElement | null) x += el.offsetLeft;
    // From just left of the flower (70px left of the box) to past the panel's right edge.
    desk.style.setProperty('--cx', String(Math.max(0, Math.min(C.width - C.phone, x - 74))));
  };

  let elapsed = still ? T.panel + 700 : 0; // ms into the loop of all the apps
  let playing = !still, seen = false, last = 0, raf = 0, shownApp = -1, shownAt = '-', shownStep = -1;
  const render = () => {
    const n = Math.floor(elapsed / T.next) % apps.length, t = elapsed % T.next;
    if (n !== shownApp) {
      apps.forEach((a, k) => ((a.dataset.on = String(k === n)), (a.dataset.was = String(k === shownApp))));
      names.forEach((a, k) => (a.dataset.on = String(k === n)));
      shownApp = n;
      follow();
    }
    const at = beats.flatMap((b, i) => (t >= b ? [`s${i + 1}`] : [])).join(' ');
    // The reply's last letters, typed in before the shortcut (all of it under Reduce Motion).
    const typed = apps[n].querySelector<HTMLElement>('[data-desk-typed]');
    if (typed) {
      const full = typed.dataset.deskTyped!, from = full.length - Math.min(T.typed, full.length);
      const k = still || t >= T.typeTo ? full.length : t < T.typeFrom ? from : from + Math.round(((t - T.typeFrom) / (T.typeTo - T.typeFrom)) * (full.length - from));
      if (typed.textContent!.length !== k) typed.textContent = full.slice(0, k);
    }
    if (at !== shownAt) desk.dataset.at = shownAt = at;
    let i = starts.length - 1;
    while (i > 0 && t < starts[i]) i--;
    if (i !== shownStep) {
      shownStep = i;
      steps.forEach((st, k) => st.setAttribute('data-active', String(k === i)));
    }
    const until = starts[i + 1] ?? T.next;
    bars.forEach((b, k) => b.style.setProperty('--p', k < i ? '1' : k > i ? '0' : Math.min(1, (t - starts[i]) / (until - starts[i])).toFixed(3)));
  };
  const tick = (now: number) => {
    if (last) elapsed += Math.min(now - last, 100);
    last = now;
    render();
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (playing && seen && !raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else if ((!playing || !seen) && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (toggle) toggle.textContent = playing ? 'Pause' : 'Play';
  };
  toggle?.addEventListener('click', () => {
    playing = !playing;
    run();
  });
  steps.forEach((st, k) =>
    st.querySelector('button')!.addEventListener('click', () => {
      elapsed = Math.max(0, shownApp) * T.next + starts[k] + (k ? 1 : 0);
      render();
    }),
  );
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    run();
  }, { threshold: 0.25 }).observe(screen);
  new ResizeObserver(fit).observe(screen);
  phone.addEventListener('change', fit);
  render();
  fit();
  run();
}

// ── The cover's garden (Garden.tsx) ───────────────────────────────────────────────────
// It runs in CSS too. This holds it while the cover is scrolled away, presses the cover's own
// ⌃ ⌥ G just before the garden wakes, on the same clock as the CSS (one loop, started
// together), and after a few loops settles it for good: the garden at rest, every part held.
const note = document.querySelector<HTMLElement>('[data-garden]');
// Where the panel's words are, for the butterflies that land on them, and the panel's shape:
// the Panel wraps its own text, so this is measured, as shares of the panel (they hold at any scale).
if (note) {
  const sheet = note.querySelector<HTMLElement>('[role="tablist"]')?.parentElement;
  const measure = () => {
    const b = sheet?.getBoundingClientRect();
    if (!sheet || !b?.width) return;
    note.style.setProperty('--pr', (sheet.offsetHeight / sheet.offsetWidth).toFixed(4));
    for (const w of $$<HTMLElement>('[data-word]', sheet)) {
      const q = w.getBoundingClientRect();
      note.style.setProperty(`--wx${w.dataset.word}`, ((q.right - b.left) / b.width).toFixed(4));
      note.style.setProperty(`--wy${w.dataset.word}`, ((q.top - b.top) / b.height).toFixed(4));
    }
  };
  measure();
  document.fonts?.ready.then(measure);
  addEventListener('resize', measure);
}
if (note && !still && 'getAnimations' in note) {
  const loop = Number(note.dataset.loop);
  const [press, gap, up] = note.dataset.keys!.split(',').map(Number);
  const caps = $$<HTMLElement>('[role="img"] kbd', note.closest('header')!).filter((k) => !note.contains(k)); // the cover's keys, not the panel's
  let keys: Animation[] = [];
  let seen = true;
  let settled = false;
  const start = () => {
    keys.forEach((a) => a.cancel());
    const parts = note.getAnimations({ subtree: true });
    keys = caps.map((cap, i) => {
      const down = (press + i * gap) / loop;
      const rest = { translate: '0 0', scale: '1' }, pressed = { translate: '-1px 2px', scale: '0.97' };
      return cap.animate(
        [{ ...rest, offset: 0 }, { ...rest, offset: down }, { ...pressed, offset: down + 70 / loop }, { ...pressed, offset: up / loop }, { ...rest, offset: (up + 160) / loop }, { ...rest, offset: 1 }],
        { duration: loop, iterations: Infinity },
      );
    });
    for (const a of [...parts, ...keys]) {
      a.currentTime = 0;
      seen ? a.play() : a.pause();
    }
  };
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (settled) return;
    for (const a of [...note.getAnimations({ subtree: true }), ...keys]) {
      if (seen && a.playState === 'paused') a.play();
      else if (!seen && a.playState === 'running') a.pause();
    }
  }).observe(note);
  // On a fine pointer the scene's planes follow it a little, each by its own depth (the
  // amounts are Garden.tsx's DEPTH; this only says where the pointer is over the cover).
  if (matchMedia('(pointer: fine)').matches) {
    const cover = note.closest('header')!;
    const look = (x: number, y: number) => (note.style.setProperty('--mx', x.toFixed(3)), note.style.setProperty('--my', y.toFixed(3)));
    cover.addEventListener('pointermove', (e) => {
      const r = cover.getBoundingClientRect();
      look(1 - ((e.clientX - r.left) / r.width) * 2, 1 - ((e.clientY - r.top) / r.height) * 2);
    });
    cover.addEventListener('pointerleave', () => look(0, 0));
  }
  // The panel's pop comes round once a loop, and only while the garden plays, so scrolling
  // away never loses the count. After the last loop everything is held at its rest frame.
  let rounds = Number(note.dataset.loops);
  note.querySelector('[inert]')?.addEventListener('animationiteration', (e) => {
    if (e.target !== e.currentTarget || --rounds > 0) return;
    settled = true;
    keys.forEach((a) => a.cancel());
    for (const a of note.getAnimations({ subtree: true })) {
      a.currentTime = 0;
      a.pause();
    }
  });
  start();
}

// ── The foot coming out from under the page (Page.tsx's sheet, Footer.tsx) ─────────────
// The foot is pinned to the bottom of the window, behind the page. How much of it shows is
// how far the page's bottom edge has lifted off the window's: that drives --reveal (the foot
// coming forward) and, once enough shows, its sun and butterflies.
const sheet = document.querySelector<HTMLElement>('[data-sheet]');
const footEl = document.querySelector<HTMLElement>('[data-foot]');
let footShown = 0;
const footPlayAt = Number(footEl?.dataset.playAt ?? 0.5);
if (sheet && footEl) {
  let queued = false;
  const measure = () => {
    queued = false;
    const h = footEl.offsetHeight;
    const shown = Math.max(0, Math.min(1, (innerHeight - sheet.getBoundingClientRect().bottom) / Math.min(h, innerHeight)));
    if (Math.abs(shown - footShown) < 0.002) return;
    footShown = shown;
    footEl.style.setProperty('--reveal', shown.toFixed(3));
    dispatchEvent(new CustomEvent('foot-shown', { detail: shown }));
  };
  const queue = () => {
    if (!queued) (queued = true), requestAnimationFrame(measure);
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  footEl.style.setProperty('--reveal', '0');
  queue();
}

// ── The foot's reveal, and the pointer as a butterfly (Footer.tsx, its storyboard) ───────
// The sun and the butterflies are CSS animations, held at their start until the foot is on
// screen, then played; ⌃ ⌥ G at the foot plays them again. As each butterfly lands, its
// letter dips. Over the foot, on a fine pointer, the pointer is a butterfly.
const reveal = document.querySelector<HTMLElement>('[data-reveal]');
let replayFoot: (() => boolean) | null = null;
if (reveal && !still && 'getAnimations' in reveal) {
  const letters = $$<HTMLElement>('[data-foot-mark] span', reveal).filter((l) => l.children.length === 0 && l.textContent!.trim().length === 1);
  const landings = reveal.dataset.landings!.split(',').map((x) => x.split(':').map(Number));
  const [dipBy, dipMs] = reveal.dataset.dip!.split(',');
  let dips: number[] = [];
  // Once landed, each butterfly wanders: a random spot every so often, the move left to CSS.
  const box = JSON.parse(reveal.dataset.wanderBox!) as { x: number[]; y: number[]; hopMs: number[]; pause: number; tiltDeg: number };
  const flyers = $$<HTMLElement>('[data-wander]', reveal);
  const between = ([a, b]: number[]) => a + Math.random() * (b - a);
  const hops = new Map<HTMLElement, number>();
  let flutter: Animation[] = [];
  const hop = (el: HTMLElement) => {
    const ms = between(box.hopMs);
    if (Math.random() < box.pause) {
      hops.set(el, window.setTimeout(() => hop(el), ms * 0.6));
      return;
    }
    const x = between(box.x), y = between(box.y);
    const was = Number(el.dataset.x ?? 0);
    el.dataset.x = String(x);
    el.style.setProperty('--d', `${Math.round(ms)}ms`);
    el.style.translate = `${x.toFixed(0)}% ${y.toFixed(0)}%`;
    el.style.rotate = `${Math.max(-1, Math.min(1, (x - was) / 300)) * box.tiltDeg}deg`;
    hops.set(el, window.setTimeout(() => hop(el), ms));
  };
  const wander = (go: boolean) => {
    hops.forEach(clearTimeout);
    hops.clear();
    flutter.forEach((a) => a.cancel());
    flutter = [];
    if (!go) return flyers.forEach((el) => { el.style.translate = ''; el.style.rotate = ''; el.dataset.x = '0'; });
    flutter = flyers.map((el) => el.querySelector('[data-wander-wings]')!.animate([{ scale: '1 1' }, { scale: '0.3 1' }], { duration: 150, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
    flyers.forEach((el, i) => hops.set(el, window.setTimeout(() => hop(el), 300 + i * 400)));
  };
  const landed = Math.max(...landings.map(([, at]) => at));
  let wanderAt = 0;
  const play = (go: boolean) => {
    dips.forEach(clearTimeout);
    dips = [];
    clearTimeout(wanderAt);
    wander(false);
    if (go) wanderAt = window.setTimeout(() => wander(footShown >= footPlayAt), landed + 500);
    for (const a of reveal.getAnimations({ subtree: true })) {
      a.currentTime = 0;
      go ? a.play() : a.pause();
    }
    if (go)
      dips = landings.map(([letter, at]) =>
        window.setTimeout(() => letters[letter]?.animate([{ translate: '0 0' }, { translate: `0 ${dipBy}`, offset: 0.35 }, { translate: '0 0' }], { duration: Number(dipMs), easing: 'cubic-bezier(.3,.7,.4,1)', composite: 'add' }), at),
      );
  };
  play(false);
  let played = false;
  let wandering = true;
  addEventListener('foot-shown', (e) => {
    const shown = (e as CustomEvent<number>).detail >= footPlayAt;
    if (!played && shown) {
      played = true;
      play(true);
    } else if (played && shown !== wandering) {
      // Covered again by the page: the butterflies stop; uncovered, they wander on.
      wandering = shown;
      wander(shown);
    }
  });
  replayFoot = () => {
    if (footShown < footPlayAt) return false;
    play(true);
    return true;
  };
}

const foot = document.querySelector<HTMLElement>('[data-foot]');
const cursorFly = document.querySelector<HTMLElement>('[data-cursor-fly]');
if (foot && cursorFly && !still && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const wings = cursorFly.querySelector<HTMLElement>('[data-cursor-wings]')!;
  foot.dataset.flyCursor = '';
  let x = 0, y = 0, tx = 0, ty = 0, tilt = 0, raf = 0, inside = false, last = 0;
  const flapping = wings.animate([{ scale: '1 1' }, { scale: '0.3 1' }], { duration: 140, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
  const tick = (t: number) => {
    const dt = Math.min(48, t - (last || t));
    last = t;
    const k = 1 - Math.pow(0.001, dt / 1000 * 2.2);   // eased follow, frame-rate independent
    const vx = (tx - x) * k, vy = (ty - y) * k;
    x += vx;
    y += vy;
    tilt += (Math.max(-28, Math.min(28, vx * 1.4)) - tilt) * 0.2;
    const speed = Math.hypot(vx, vy);
    flapping.playbackRate = speed > 0.6 ? 1.6 : 0.45;
    // A little bob as it hovers.
    const bob = Math.sin(t / 260) * 2;
    cursorFly.style.transform = `translate(${x - 17}px, ${y - 17 + bob}px) rotate(${tilt}deg)`;
    raf = inside ? requestAnimationFrame(tick) : 0;
  };
  foot.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    // Over a link or button the real pointer shows, and the butterfly waits beside it.
    const onControl = !!(e.target as HTMLElement).closest('a, button');
    cursorFly.style.opacity = onControl ? '0.55' : '1';
    if (!inside) {
      inside = true;
      x = tx;
      y = ty;
      cursorFly.hidden = false;
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  });
  foot.addEventListener('pointerleave', () => {
    inside = false;
    cursorFly.hidden = true;
    cancelAnimationFrame(raf);
  });
}

// ── ⌃ ⌥ G on the page (PressPanel in Page.tsx, drawn by Panel.tsx) ─────────────────────
// The keys go down and Iris's panel opens on the paragraph you're reading: Fix finds nothing
// ("looks good"), Tab tries the tones, Return puts one on the page, ⌘Z takes it back, Esc
// closes. ⌃ ⌥ ⇧ G is Quick Fix. With Iris installed the keys never get here: Iris takes them.

/** A spring, as CSS `linear()`: quick, a little past, settles. */
const SPRING = 'linear(0, 0.13 4%, 0.46 12%, 0.8 21%, 1.01 31%, 1.07 39%, 1.06 47%, 1.02 57%, 0.995 70%, 1)';

const press = document.querySelector<HTMLElement>('[data-press]');
const pressJson = document.querySelector('[data-press-tones]');
if (press && pressJson) {
  type Words = { tones: string[]; pageTones: Record<string, Record<string, string>> };
  const data = JSON.parse(pressJson.textContent!) as Words;
  const names = ['Fix', ...data.tones];
  const q = <T extends HTMLElement>(sel: string, root: ParentNode = press) => root.querySelector<T>(sel)!;
  const tabEls = $$<HTMLElement>('[data-press-tab]', press);
  const body = q('[data-press-body]');
  const text = q('[data-press-text]');
  const good = q('[data-press-good]');
  const keys = q('[data-press-keys]');
  const into = q('[data-press-into]');
  const where = q('[data-press-where]');
  const icon = q<HTMLImageElement>('[data-press-icon]');
  const replaceWrap = q('[data-press-replace-wrap]');
  const note = q('[data-press-note]', document);
  const noteText = q('[data-press-note-text]', document);
  const said = q('[data-press-said]', document);
  const psst = q('[data-press-psst]', document);
  const scale = q('[data-press-scale]');
  const replaceBtn = q('[data-press-replace]');
  const markTpl = q<HTMLTemplateElement>('[data-press-marks]').content;
  const goneClass = markTpl.querySelector('del')!.className, addedClass = markTpl.querySelector('ins')!.className;
  /** A version marked as Iris marks it, against the paragraph as written. */
  const marked = (from: string, to: string) => {
    const f = document.createDocumentFragment();
    diff(from, to).forEach((seg, i) => {
      const space = i > 0 && !/^[^\w]/.test(seg.text) ? ' ' : '';
      if (space) f.append(space);
      if (seg.kind === 'same') return f.append(seg.text);
      const el = document.createElement(seg.kind === 'gone' ? 'del' : 'ins');
      el.className = seg.kind === 'gone' ? goneClass : addedClass;
      el.textContent = seg.text;
      f.append(el);
    });
    return f;
  };
  /** Its scale: the panel's own (0.76), or less where the window is narrower. Narrow, without
   *  the key hints (a phone has no keys), so it's laid out narrower and stays readable. */
  const fit = () => {
    const compact = innerWidth < 600, layout = compact ? 440 : 720;
    press.toggleAttribute('data-compact', compact);
    scale.style.width = `${layout}px`;
    scale.style.zoom = String(Math.min(0.76, (innerWidth - 32) / layout));
  };

  // Replace would type into the browser, so the tape names it, with its icon, as the app does.
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? null : /Chrome\//.test(ua) ? ['chrome', 'Chrome'] : /Safari\//.test(ua) ? ['safari', 'Safari'] : null;
  if (browser) {
    icon.src = `/app/${browser[0]}.png`;
    icon.hidden = false;
    where.textContent = browser[1];
    where.parentElement!.style.marginLeft = '14px';
  }

  let target: { el: HTMLElement; key: string } | null = null;
  let current = 0;
  let opener: HTMLElement | null = null;
  let pressed = false;
  const undo: { el: HTMLElement; html: string }[] = [];
  const smooth: ScrollBehavior = still ? 'auto' : 'smooth';

  const say = (msg: string) => {
    said.textContent = '';
    requestAnimationFrame(() => (said.textContent = msg));
  };
  let noteTimer = 0;
  const toast = (msg: string) => {
    noteText.textContent = msg;
    note.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = window.setTimeout(() => (note.hidden = true), 3600);
  };

  // Every ⌃ ⌥ G on screen goes down with your fingers.
  const capRows = $$<HTMLElement>('[role="img"][aria-label="control option G"]');
  const pressKeys = () => {
    if (still) return;
    for (const row of capRows) {
      const r = row.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || !r.width) continue;
      $$<HTMLElement>('kbd', row).forEach((cap, i) =>
        cap.animate([{ translate: '0 0', scale: '1' }, { translate: '-1px 2px', scale: '0.96' }, { translate: '0 0', scale: '1' }], { duration: 360, delay: i * 70, easing: 'cubic-bezier(.3,.7,.4,1)' }),
      );
    }
  };

  /** The paragraph that has tones, nearest the middle of the screen. */
  const nearest = () => {
    let best: { el: HTMLElement; key: string } | null = null, d = Infinity;
    for (const el of $$<HTMLElement>('[data-tones]')) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 40 || r.top > innerHeight - 40) continue;
      const dd = Math.abs(r.top + r.height / 2 - innerHeight / 2);
      if (dd < d) (d = dd), (best = { el, key: el.dataset.tones! });
    }
    return best;
  };

  const original = (el: HTMLElement) => el.textContent!.trim().replace(/\s+/g, ' ');
  const choose = (i: number) => {
    if (!target) return;
    current = i;
    tabEls.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      t.querySelector<HTMLElement>('[data-plain]')!.hidden = k === i;
      t.querySelector<HTMLElement>('[data-chosen]')!.hidden = k !== i;
    });
    const fix = i === 0;
    // The version on screen goes as the new one comes, as in section 03's panel (PANEL_MOTION).
    const moving = !still && !press.hidden && text.childNodes.length > 0;
    if (moving) {
      const g = overlay(text);
      g.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${PANEL_MOTION.out.lift}px` }], { duration: PANEL_MOTION.out.ms, easing: 'ease-in', fill: 'forwards' }).finished.then(() => g.remove());
    }
    text.replaceChildren(fix ? original(target.el) : marked(original(target.el), data.pageTones[target.key][names[i]]));
    if (moving) {
      text.animate([{ opacity: 0, translate: `0 ${PANEL_MOTION.in.from}px` }, { opacity: 1, translate: '0 0' }], { duration: PANEL_MOTION.in.ms, delay: PANEL_MOTION.in.delay, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      swipeOn(text, PANEL_MOTION.in.delay + 70);
    }
    // The footer as the app's: "looks good" and "nothing to change in" for Fix, else the keys
    // and Replace.
    good.hidden = !fix;
    keys.hidden = fix;
    into.textContent = fix ? 'nothing to change in' : 'into';
    replaceWrap.hidden = fix;
  };

  const place = (r: DOMRect) => {
    const w = press.getBoundingClientRect().width || Math.min(547, innerWidth - 32);
    press.style.left = `${Math.max(16, Math.min(r.left, innerWidth - w - 16)) + scrollX}px`;
    press.style.top = `${r.bottom + scrollY + 16}px`;
  };
  const open = (t: { el: HTMLElement; key: string }) => {
    target = t;
    if (press.hidden) opener = document.activeElement as HTMLElement | null;
    closing?.cancel();
    press.hidden = false;
    replaceBtn.removeAttribute('data-done');
    fit();
    place(t.el.getBoundingClientRect());
    // Room for the longest version of this paragraph, so changing tone never moves anything.
    body.style.minHeight = '';
    let room = 0;
    for (const words of data.tones.map((n) => data.pageTones[t.key][n])) {
      text.replaceChildren(marked(original(t.el), words));
      room = Math.max(room, text.offsetHeight);
    }
    text.textContent = original(t.el);
    room = Math.max(room, text.offsetHeight);
    body.style.minHeight = `${Math.ceil(room)}px`;
    text.replaceChildren();
    choose(0);
    // The panel takes focus, not a tab: Tab, Return and Esc are its keys, as in the app.
    press.focus({ preventScroll: true });
    press.scrollIntoView({ block: 'nearest', behavior: smooth });
    say('Iris: looks good, nothing to fix. Tab for tones, Return to replace, Escape to close.');
    if (!still) press.animate([{ opacity: 0, transform: 'translateY(-6px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: SPRING });
  };
  // It folds away as it came: up a little and out (140ms).
  let closing: Animation | null = null;
  const close = () => {
    if (press.hidden || closing) return;
    target = null;
    opener?.focus?.({ preventScroll: true });
    const done = () => ((press.hidden = true), (closing = null));
    if (still) return done();
    closing = press.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px) scale(0.98)' }], { duration: 140, easing: 'ease-in' });
    closing.onfinish = done;
    closing.oncancel = () => (closing = null);
  };
  const flash = (el: HTMLElement) => {
    if (!still) el.animate([{ backgroundColor: 'rgb(240 134 176 / 0.45)' }, { backgroundColor: 'rgb(240 134 176 / 0)' }], { duration: 1400, easing: 'ease-out' });
  };
  const replace = () => {
    if (!target || current === 0) return;
    undo.push({ el: target.el, html: target.el.innerHTML });
    target.el.textContent = data.pageTones[target.key][names[current]];
    flash(target.el);
    toast(`${names[current]}, on the page. ⌘Z puts it back.`);
    // Replace turns over to "Replaced" (as in section 03), then the panel folds away.
    replaceBtn.setAttribute('data-done', '');
    if (!still) replaceBtn.animate([{ scale: 1 }, { scale: PANEL_MOTION.press.scale, offset: 0.3 }, { scale: 1 }], { duration: PANEL_MOTION.press.ms, easing: PANEL_MOTION.press.ease });
    const t = target;
    setTimeout(() => target === t && close(), still ? 0 : 520);
  };
  const go = (shift: boolean) => {
    pressed = true;
    psst.hidden = true;
    pressKeys();
    if (shift) return toast('Quick Fix: nothing to fix. This page was already fine.');
    // At the foot, the keys play its reveal again.
    if (replayFoot?.()) return;
    const t = nearest();
    if (!t) return toast('looks good: nothing to fix here');
    open(t);
  };
  const step = (dir: number) => choose((current + dir + names.length) % names.length);

  tabEls.forEach((t, i) => t.addEventListener('click', () => choose(i)));
  q('[data-press-next]').addEventListener('click', (e) => {
    tapKeys(e.currentTarget as Element);
    step(1);
  });
  q('[data-press-replace]').addEventListener('click', (e) => {
    e.preventDefault();
    replace();
  });
  addEventListener('pointerdown', (e) => {
    if (!press.hidden && !press.contains(e.target as Node)) close();
  });
  // No keyboard (a phone): the keys on the page are the shortcut.
  for (const row of capRows) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => go(false));
  }

  addEventListener('keydown', (e) => {
    const field = (e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
    if (e.ctrlKey && e.altKey && !e.metaKey && e.code === 'KeyG') {
      if (field) return; // someone's text box: leave it to them (and to Iris, if it's there)
      e.preventDefault();
      go(e.shiftKey);
      return;
    }
    if (!press.hidden) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        step(e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        replace();
      }
      return;
    }
    if (e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'z' && !field && undo.length) {
      e.preventDefault();
      const u = undo.pop()!;
      u.el.innerHTML = u.html;
      flash(u.el);
      toast('Put back.');
    }
  });

  // Once, a nudge: after the cover, a slip says the keys work here too.
  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (touch) psst.querySelector('[data-psst-keys]')!.textContent = 'psst: tap the ⌃ ⌥ G keys';
  let seen = false;
  try { seen = sessionStorage.getItem('iris-psst') === '1'; } catch {}
  const cover = document.querySelector('header');
  if (!seen && cover) {
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting || pressed) return;
      io.disconnect();
      try { sessionStorage.setItem('iris-psst', '1'); } catch {}
      psst.hidden = false;
      if (!still) psst.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 320, easing: SPRING });
      setTimeout(() => (psst.hidden = true), 9000);
    }).observe(cover);
  }
}
