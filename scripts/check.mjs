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
  ok(fix.includes('Hey') && fix.includes('needs'), 'the panel opens on Fix with the fixes marked');
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
  await video.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const playing = await video.evaluate((v) => !v.paused && v.currentTime > 0);
  ok(reduce ? !playing : playing, reduce ? 'the video holds still under Reduce Motion' : 'the video plays once it is on screen');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  if (!reduce) ok(await video.evaluate((v) => v.paused), 'and pauses when scrolled away');

  // The cover's garden: plays on screen, holds still scrolled away, never moves under Reduce Motion.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const gardenState = () =>
    page.locator('[data-garden]').evaluate((g) => {
      const all = g.getAnimations({ subtree: true });
      return { running: all.filter((a) => a.playState === 'running').length, paused: all.filter((a) => a.playState === 'paused').length };
    });
  const butterflies = await page.locator('[data-garden] img[src*="-wings"]').count();
  ok(butterflies === 4, `the garden has ${butterflies} butterflies`);
  const onScreen = await gardenState();
  if (reduce) {
    ok(onScreen.running === 0, 'under Reduce Motion nothing in the garden moves');
    const shown = await page.locator('[data-garden] img[src*="-wings"]').evaluateAll((els) =>
      els.every((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && Number(getComputedStyle(el.closest('[style*="--px"]')).opacity) === 1; }));
    ok(shown, 'and every butterfly rests in view');
  } else {
    ok(onScreen.running > 20, `the garden plays (${onScreen.running} parts moving)`);
    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForTimeout(400);
    const away = await gardenState();
    ok(away.running === 0 && away.paused > 0, 'and holds still when scrolled away');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    // The arrivals may have finished by now; the loops must all be going again.
    const back = await gardenState();
    ok(back.paused === 0 && back.running > 20, 'and carries on when it comes back');
  }
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the page never scrolls sideways');

  // The foot: Iris fixes the sign-off once it's on screen, and again on "fix it again".
  const line = page.locator('#foot-line');
  // Struck words take no room once they're replaced (the flower's box aside).
  const struckWidth = () => line.evaluate((p) => [...p.querySelectorAll(':scope > span[aria-hidden="true"]')].filter((s) => !s.querySelector('picture')).reduce((w, s) => w + s.getBoundingClientRect().width, 0));
  await line.scrollIntoViewIfNeeded();
  await page.waitForTimeout(reduce ? 300 : 4200);
  ok((await line.getAttribute('aria-label')) === 'Thanks for reading. Now go write something in your own voice.', 'the foot line reads fixed to a screen reader');
  ok((await struckWidth()) < 1, reduce ? 'under Reduce Motion the foot line is simply fixed' : 'Iris fixes the foot line once it is on screen');
  if (!reduce) {
    await page.getByRole('button', { name: /fix it again/ }).click();
    await page.waitForTimeout(1600);
    ok((await struckWidth()) > 20, '"fix it again" marks the slips again');
    await page.waitForTimeout(3000);
    ok((await struckWidth()) < 1, 'and replaces them');
  } else {
    ok(!(await page.getByRole('button', { name: /fix it again/ }).isVisible()), 'and offers no replay');
  }

  // Links.
  const download = await page.getByRole('link', { name: 'Download Iris' }).first().getAttribute('href');
  ok(download?.endsWith('/Iris.zip'), 'Download Iris points at the latest release');
  ok(errors.length === 0, `no errors in the console${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await page.close();
}
await browser.close();
if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
