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
  const stop = () => (touched = true);
  panel.addEventListener('pointerdown', stop);
  panel.addEventListener('keydown', stop);
  panel.querySelector('[data-next]')?.addEventListener('click', () => choose((current + 1) % tabEls.length));
  panel.querySelector('[data-replace]')?.addEventListener('click', () => {
    replaceWrap.setAttribute('hidden', '');
    replaced.removeAttribute('hidden');
    setTimeout(() => {
      replaced.setAttribute('hidden', '');
      replaceWrap.removeAttribute('hidden');
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
const video = document.querySelector<HTMLVideoElement>('[data-moment]');
if (video) {
  if (still) {
    // Under Reduce Motion it holds its poster; a click plays it once.
    video.loop = false;
    video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  } else {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        video.preload = 'auto';
        video.play().catch(() => {});
      } else video.pause();
    }, { threshold: 0.35 }).observe(video);
  }
}

// ── The cover's garden plays only while it's on screen ────────────────────────────────
// It all runs in CSS (Garden.tsx); this only holds it still while the cover is scrolled away,
// and lets it carry on from there when it comes back. Finished parts (the arrivals) stay put.
const garden = document.querySelector<HTMLElement>('[data-garden]');
if (garden && !still && 'getAnimations' in garden) {
  new IntersectionObserver(([e]) => {
    for (const a of garden.getAnimations({ subtree: true })) {
      if (e.isIntersecting && a.playState === 'paused') a.play();
      else if (!e.isIntersecting && a.playState === 'running') a.pause();
    }
  }).observe(garden);
}
