// Everything the page does after it loads, with no framework: the tones, the versions and
// the video. The page reads fine without it.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** A row of tabs: click, or arrow keys, chooses one and shows its panel. */
function tabs(list: HTMLElement[], show: (i: number) => void) {
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
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      choose((i + step + list.length) % list.length, true);
    });
  });
  return choose;
}

// ── The panel's tones ─────────────────────────────────────────────────────────────────
const panel = document.querySelector<HTMLElement>('[data-panel]');
if (panel) {
  const tabEls = $$<HTMLElement>('[data-tab]', panel);
  const messages = $$<HTMLElement>('[data-tone]', panel);
  let current = 0;
  let touched = false;
  const choose = tabs(tabEls, (i) => {
    current = i;
    tabEls.forEach((t, k) => {
      t.querySelector('[data-plain]')!.toggleAttribute('hidden', k === i);
      t.querySelector('[data-chosen]')!.toggleAttribute('hidden', k !== i);
    });
    messages.forEach((m, k) => m.toggleAttribute('hidden', k !== i));
    replaced.setAttribute('hidden', '');
    replaceWrap.removeAttribute('hidden');
  });
  const replaced = panel.querySelector<HTMLElement>('[data-replaced]')!;
  const replaceWrap = panel.querySelector<HTMLElement>('[data-replace-wrap]')!;
  const said = panel.querySelector<HTMLElement>('[data-said]')!;
  // It stops for good once someone reaches for it: a pointer over it, or focus inside it.
  const stop = () => (touched = true);
  for (const ev of ['pointerenter', 'pointerdown', 'focusin', 'keydown']) panel.addEventListener(ev, stop);
  panel.querySelector('[data-next]')?.addEventListener('click', () => choose((current + 1) % tabEls.length));
  panel.querySelector('[data-replace]')?.addEventListener('click', () => {
    replaceWrap.setAttribute('hidden', '');
    replaced.removeAttribute('hidden');
    said.textContent = 'Replaced';
    setTimeout(() => {
      replaced.setAttribute('hidden', '');
      replaceWrap.removeAttribute('hidden');
      said.textContent = '';
    }, 1800);
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

// ── TRY AGAIN in a panel (Panel.tsx) ──────────────────────────────────────────────────
// As ⌘R does in the app, it asks for the tone again: the version is marked afresh, Iris's
// words swiped back on one after another. (⌘R itself stays the browser's.)
for (const again of $$<HTMLButtonElement>('[data-try-again]')) {
  again.addEventListener('click', () => {
    const box = again.closest('[data-panel], [data-press]');
    const msg = box?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden]), [data-press-text]');
    if (!msg || still) return;
    msg.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    $$<HTMLElement>('ins', msg).forEach((w, i) =>
      w.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 280, delay: 160 + i * 110, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }),
    );
  });
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

// ── The ⌃⌥G video plays only while it's on screen ─────────────────────────────────────
// Its button pauses and plays it; once someone pauses it, scrolling never starts it again.
const video = document.querySelector<HTMLVideoElement>('[data-moment]');
const toggle = document.querySelector<HTMLButtonElement>('[data-moment-toggle]');
if (video && toggle) {
  let held = still;
  const label = () => (toggle.textContent = video.paused ? 'Play' : 'Pause');
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  label();
  const flip = () => {
    held = !video.paused;
    if (video.paused) {
      video.preload = 'auto';
      video.play().catch(() => {});
    } else video.pause();
  };
  toggle.addEventListener('click', flip);
  video.addEventListener('click', flip);
  // The half-size still is enough on a phone; where the video shows wide, the full one.
  if (video.clientWidth * devicePixelRatio > 720 && video.dataset.posterWide) video.poster = video.dataset.posterWide;
  // Under Reduce Motion it holds its poster and plays once when asked.
  if (still) video.loop = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !held) {
      video.preload = 'auto';
      video.play().catch(() => {});
    } else if (!e.isIntersecting) video.pause();
  }, { threshold: 0.35 }).observe(video);
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

// ── The foot's sign-off, fixed as you arrive ──────────────────────────────────────────
// The marks are CSS animations (Footer.tsx, its storyboard): held at their start here, played
// once the line is on screen, and again from the start on "fix it again".
const fixline = document.querySelector<HTMLElement>('[data-fixline]');
if (fixline && !still && 'getAnimations' in fixline) {
  const marks = () => fixline.getAnimations({ subtree: true }).filter((a) => (a as CSSAnimation).animationName !== undefined && a.effect?.getComputedTiming().iterations !== Infinity);
  const from = (play: boolean) =>
    marks().forEach((a) => {
      a.currentTime = 0;
      play ? a.play() : a.pause();
    });
  from(false);
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    from(true);
  }, { threshold: 0.6 }).observe(fixline.querySelector('p') ?? fixline);
  fixline.querySelector('[data-fixline-again]')?.addEventListener('click', () => from(true));
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
    text.textContent = fix ? original(target.el) : data.pageTones[target.key][names[i]];
    if (!still) text.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    // The footer as the app's: "looks good" and "nothing to change in" for Fix, else the keys
    // and Replace.
    good.hidden = !fix;
    keys.hidden = fix;
    into.textContent = fix ? 'nothing to change in' : 'into';
    replaceWrap.hidden = fix;
  };

  const place = (r: DOMRect) => {
    const w = press.offsetWidth || Math.min(680, innerWidth - 32);
    press.style.left = `${Math.max(16, Math.min(r.left, innerWidth - w - 16)) + scrollX}px`;
    press.style.top = `${r.bottom + scrollY + 16}px`;
  };
  const open = (t: { el: HTMLElement; key: string }) => {
    target = t;
    if (press.hidden) opener = document.activeElement as HTMLElement | null;
    press.hidden = false;
    place(t.el.getBoundingClientRect());
    // Room for the longest version of this paragraph, so changing tone never moves anything.
    body.style.minHeight = '';
    let room = 0;
    for (const words of [original(t.el), ...data.tones.map((n) => data.pageTones[t.key][n])]) {
      text.textContent = words;
      room = Math.max(room, text.getBoundingClientRect().height);
    }
    body.style.minHeight = `${Math.ceil(room)}px`;
    choose(0);
    // The panel takes focus, not a tab: Tab, Return and Esc are its keys, as in the app.
    press.focus({ preventScroll: true });
    press.scrollIntoView({ block: 'nearest', behavior: smooth });
    say('Iris: looks good, nothing to fix. Tab for tones, Return to replace, Escape to close.');
    if (!still) press.animate([{ opacity: 0, transform: 'translateY(-6px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: SPRING });
  };
  const close = () => {
    if (press.hidden) return;
    press.hidden = true;
    target = null;
    opener?.focus?.({ preventScroll: true });
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
    close();
  };
  const go = (shift: boolean) => {
    pressed = true;
    psst.hidden = true;
    pressKeys();
    if (shift) return toast('Quick Fix: nothing to fix. This page was already fine.');
    const t = nearest();
    if (!t) return toast('looks good: nothing to fix here');
    open(t);
  };
  const step = (dir: number) => choose((current + dir + names.length) % names.length);

  tabEls.forEach((t, i) => t.addEventListener('click', () => choose(i)));
  q('[data-press-next]').addEventListener('click', () => step(1));
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
