// Uses the built page like a person would, in headless Chromium, and fails loudly when
// something they'd touch doesn't work.
//   node scripts/check.mjs [url]
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:8788/';
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const browser = await chromium.launch({ executablePath: path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') });
let failed = 0;
const ok = (cond, what) => {
  console.log(`${cond ? '✓' : '✗'} ${what}`);
  if (!cond) failed++;
};

for (const reduce of [false, true]) {
  console.log(reduce ? '\n— with Reduce Motion' : '— as usual');
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });

  // The tones.
  const shown = () => page.locator('[data-tone]:not([hidden])').innerText();
  const fix = await shown();
  ok(fix.includes('I have') && fix.includes('needs'), 'the panel opens on Fix with the fixes marked');
  await page.getByRole('tab', { name: 'Professional' }).click();
  ok((await shown()).includes('reviewed'), 'clicking Professional shows the professional version');
  ok((await page.getByRole('tab', { name: 'Professional' }).getAttribute('aria-selected')) === 'true', 'Professional reads as the chosen tab');
  await page.keyboard.press('ArrowRight');
  ok((await page.getByRole('tab', { name: 'Friendly' }).getAttribute('aria-selected')) === 'true', '→ moves to Friendly');
  ok(await page.getByRole('tab', { name: 'Friendly' }).evaluate((el) => el === document.activeElement), 'and focus follows it');
  await page.getByRole('button', { name: 'Next tone' }).click();
  ok((await shown()).startsWith('PR looks fine') || (await shown()).includes('One change'), 'the ⇥ key in the footer moves to Shorter');
  await page.locator('[data-replace]').click();
  ok(await page.locator('[data-replaced]').isVisible(), 'Replace says "replaced"');
  await page.waitForTimeout(2000);
  ok(await page.locator('[data-replace]').isVisible(), 'and Replace comes back after a moment');
  // Left alone, the panel cycles only without Reduce Motion, and stops once touched.
  const before = await shown();
  await page.waitForTimeout(3600);
  ok((await shown()) === before, 'a panel someone touched stays on their tone');

  // The shelf of versions.
  const books = page.locator('[data-issue]');
  const n = await books.count();
  ok(n >= 2, `the shelf has ${n} versions`);
  const oldest = books.first();
  await oldest.click();
  const no = await oldest.getAttribute('data-issue');
  ok(await page.locator(`[data-facts="${no}"]`).isVisible(), 'clicking an older issue shows its changes');
  ok((await page.locator('[data-facts]:not([hidden])').count()) === 1, 'one issue at a time');

  // The video.
  const video = page.locator('[data-moment]');
  const toggle = page.locator('[data-moment-toggle]');
  await video.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const playing = await video.evaluate((v) => !v.paused && v.currentTime > 0);
  ok(reduce ? !playing : playing, reduce ? 'the video holds still under Reduce Motion' : 'the video plays once it is on screen');
  ok((await toggle.innerText()).toLowerCase() === (reduce ? 'play' : 'pause'), `its button offers to ${reduce ? 'play' : 'pause'} it`);
  if (!reduce) {
    await toggle.click();
    await page.waitForTimeout(300);
    ok(await video.evaluate((v) => v.paused), 'Pause stops it');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    ok(await video.evaluate((v) => v.paused), 'and scrolling back never starts it again');
    await toggle.click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  if (!reduce) ok(await video.evaluate((v) => v.paused), 'and pauses when scrolled away');

  // The cover's garden: plays on screen, holds still scrolled away, never moves under Reduce
  // Motion; there's one cover and no switch.
  ok(!(await page.locator('[data-hero-pick]').count()), 'there is one cover, with no switch');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const gardenState = () =>
    page.locator('[data-garden]').evaluate((g) => {
      const all = g.getAnimations({ subtree: true });
      return { running: all.filter((a) => a.playState === 'running').length, paused: all.filter((a) => a.playState === 'paused').length };
    });
  ok(await page.locator('[data-garden]').isVisible(), 'the cover shows its garden');
  ok((await page.locator('[data-garden] [data-panel], [data-garden] [role="tablist"]').count()) > 0, 'with Iris\'s panel in it');
  const onScreen = await gardenState();
  if (reduce) {
    ok(onScreen.running === 0, 'under Reduce Motion nothing in the garden moves');
  } else {
    ok(onScreen.running > 20, `the garden plays (${onScreen.running} parts moving)`);
    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForTimeout(400);
    const away = await gardenState();
    ok(away.running === 0 && away.paused > 0, 'and holds still when scrolled away');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const back = await gardenState();
    ok(back.running > 20, 'and carries on when it comes back');
  }
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the page never scrolls sideways');

  // The foot: Iris fixes the sign-off once it's on screen, and again on "fix it again".
  const line = page.locator('#foot-line');
  // Slips showing: how many struck words can be seen. The foot's height never changes.
  const slipsShown = () => line.evaluate((p) => [...p.querySelectorAll('[data-slip-was]')].filter((s) => Number(getComputedStyle(s).opacity) > 0.5).length);
  const footHeight = () => page.locator('footer').evaluate((f) => Math.round(f.getBoundingClientRect().height));
  await line.scrollIntoViewIfNeeded();
  const h0 = await footHeight();
  await page.waitForTimeout(reduce ? 300 : 4800);
  ok((await line.getAttribute('aria-label')) === 'Thanks for reading. Now go write something in your own voice.', 'the foot line reads fixed to a screen reader');
  ok((await slipsShown()) === 0, reduce ? 'under Reduce Motion the foot line is simply fixed' : 'Iris fixes the foot line once it is on screen');
  if (!reduce) {
    await page.getByRole('button', { name: /fix it again/ }).click();
    await page.waitForTimeout(2600);
    ok((await slipsShown()) >= 3, '"fix it again" marks the slips again');
    const hMid = await footHeight();
    await page.waitForTimeout(2600);
    ok((await slipsShown()) === 0, 'and replaces them');
    ok(hMid === h0 && (await footHeight()) === h0, `and the foot never changes height (${h0}px)`);
  } else {
    ok(!(await page.getByRole('button', { name: /fix it again/ }).isVisible()), 'and offers no replay');
  }

  // ⌃ ⌥ G on the page: the panel opens on the paragraph you're reading.
  await page.goto(url, { waitUntil: 'networkidle' });
  const lede = page.locator('[data-tones="lede"]');
  const ledeWas = await lede.textContent();
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(400);
  const panelOpen = () => page.locator('[data-press]').isVisible();
  ok(await panelOpen(), '⌃⌥G on the page opens Iris\'s panel');
  ok(await page.locator('[data-press-good]').isVisible(), 'and Fix says "looks good"');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  ok((await page.locator('[data-press-tab][aria-selected="true"]').textContent()).includes('Funny'), 'Tab moves through the tones to Funny');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  ok((await lede.textContent()) !== ledeWas && !(await panelOpen()), 'Return puts the tone on the page');
  await page.keyboard.press('Meta+z');
  ok((await lede.textContent()) === ledeWas, '⌘Z puts it back');
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-press')), 'the panel takes focus, not a tab');
  await page.keyboard.press('Escape');
  ok(!(await panelOpen()), 'Esc closes the panel');
  ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-press') || document.activeElement === document.body), 'focus came back after Esc');

  // The first Tab shows the skip link.
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { text: a.textContent, w: r.width, h: r.height }; });
  ok(skip.text.startsWith('Skip') && skip.w > 40 && skip.h > 20, `the first Tab shows the skip link (${Math.round(skip.w)}×${Math.round(skip.h)})`);

  // Links.
  const download = await page.getByRole('link', { name: 'Download Iris' }).first().getAttribute('href');
  ok(download?.endsWith('/Iris.zip'), 'Download Iris points at the latest release');
  ok(errors.length === 0, `no errors in the console${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await page.close();
}

// At 320px (a phone, or 400% zoom) nothing a person reads or presses runs past the edge.
// The macOS drawing scrolls sideways on purpose, and tilted tape may hang over.
{
  const page = await browser.newPage({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  const over = await page.evaluate(() =>
    [...document.querySelectorAll('main *, header *, footer *')]
      .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && el.innerText?.trim() && getComputedStyle(el).position !== 'absolute' && !el.closest('[aria-hidden="true"], [data-scrolls], [data-overhang]'))
      .map((el) => `${el.tagName.toLowerCase()} “${el.innerText.trim().replace(/\s+/g, ' ').slice(0, 30)}”`),
  );
  ok(over.length === 0, `at 320px nothing runs past the edge${over.length ? ': ' + over.slice(0, 3).join(', ') : ''}`);
  await page.close();
}
await browser.close();
if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
