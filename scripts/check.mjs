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
  const replaceBox = await page.locator('[data-replace]').boundingBox();
  await page.locator('[data-replace]').click();
  await page.waitForTimeout(500);
  ok((await page.locator('[data-replace] [data-label-done]').evaluate((el) => getComputedStyle(el).opacity)) === '1', 'Replace turns over to "Replaced"');
  const pressedBox = await page.locator('[data-replace]').boundingBox();
  ok(Math.abs(pressedBox.width - replaceBox.width) < 1 && Math.abs(pressedBox.x - replaceBox.x) < 1, 'without changing size or moving anything');
  await page.waitForTimeout(2300);
  ok((await page.locator('[data-replace]').getAttribute('data-done')) === null && (await page.locator('[data-replace] [data-label-now]').evaluate((el) => getComputedStyle(el).opacity)) === '1', 'and turns back to Replace after a moment');
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

  // How it works: the desk (Desk.tsx) plays its apps in turn while it's on screen.
  const desk = page.locator('[data-desk]');
  const toggle = page.locator('[data-moment-toggle]');
  const deskState = () => desk.evaluate((d) => `${d.querySelector('[data-desk-name][data-on="true"]')?.textContent}|${d.dataset.at}`);
  await page.locator('#moment figure').scrollIntoViewIfNeeded();
  const deskBefore = await deskState();
  await page.waitForTimeout(2200);
  const moved = (await deskState()) !== deskBefore;
  ok(reduce ? !moved : moved, reduce ? 'the desk holds still under Reduce Motion' : 'the desk plays once it is on screen');
  ok((await toggle.innerText()).toLowerCase() === (reduce ? 'play' : 'pause'), `its button offers to ${reduce ? 'play' : 'pause'} it`);
  if (reduce) ok((await deskState()).includes('s3'), 'and holds Iris’s panel open');
  if (!reduce) {
    await toggle.click();
    const held = await deskState();
    await page.waitForTimeout(1500);
    ok((await deskState()) === held, 'Pause stops it');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.locator('#moment figure').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    ok((await deskState()) === held, 'and scrolling back never starts it again');
    await toggle.click();
  }
  // The steps beside it are its chapters: picking one jumps the turn there and lights it up.
  await page.getByRole('button', { name: /Show step 2/ }).click();
  await page.waitForTimeout(900);
  const panelShown = await page.locator('[data-desk-app][data-on="true"] [data-desk-panel]').evaluate((el) => getComputedStyle(el).opacity === '1');
  ok((await page.locator('[data-chapter="1"]').getAttribute('data-active')) === 'true' && panelShown, 'picking "Read" shows Iris’s panel open in the app');
  await page.getByRole('button', { name: /Show step 3/ }).click();
  await page.waitForTimeout(150);
  ok((await page.locator('[data-chapter="2"]').getAttribute('data-active')) === 'true' && (await desk.getAttribute('data-at')).includes('s4'), 'picking "Replace" jumps to it');
  if (!reduce) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const away = await deskState();
    await page.waitForTimeout(1500);
    ok((await deskState()) === away, 'and it holds when scrolled away');
  }

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

  // The foot: the sun comes up and the butterflies land once it's in view; ⌃ ⌥ G there plays
  // it again; the foot never changes height.
  const reveal = page.locator('[data-reveal]');
  const played = () => reveal.evaluate((r) => r.getAnimations({ subtree: true }).filter((a) => a.playState === 'finished' || (a.currentTime ?? 0) > 2500).length);
  const footHeight = () => page.locator('footer').evaluate((f) => Math.round(f.getBoundingClientRect().height));
  // The foot waits under the page: before the end it's covered and hasn't played.
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight - innerHeight * 2.2));
  await page.waitForTimeout(400);
  if (!reduce) ok((await played()) === 0, 'the foot waits under the page until you reach the end');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  ok(Number(await page.locator('footer').evaluate((f) => getComputedStyle(f).getPropertyValue('--reveal'))) > 0.9, 'at the end the page has lifted off the foot');
  const h0 = await footHeight();
  await page.waitForTimeout(reduce ? 300 : 3200);
  if (reduce) ok((await reveal.evaluate((r) => r.getAnimations({ subtree: true }).length)) === 0, 'under Reduce Motion the foot is simply there');
  else ok((await played()) >= 4, 'the sun comes up and the butterflies land at the foot');
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(300);
  ok(!(await page.locator('[data-press]').isVisible()), '⌃⌥G at the foot opens no panel there');
  if (!reduce) ok((await reveal.evaluate((r) => r.getAnimations({ subtree: true }).filter((a) => (a.currentTime ?? 0) < 1000).length)) > 0, 'and plays the foot again');
  if (!reduce) {
    await page.waitForTimeout(6000);
    const spots = await page.locator('[data-wander]').evaluateAll((els) => els.map((e) => e.style.translate));
    ok(spots.filter(Boolean).length >= 2, 'then the butterflies wander off on their own');
  }
  ok((await footHeight()) === h0, `and the foot never changes height (${h0}px)`);

  // ⌃ ⌥ G on the page: the panel opens on the paragraph you're reading.
  await page.goto(url, { waitUntil: 'networkidle' });
  const lede = page.locator('[data-tones="lede"]');
  const ledeWas = await lede.textContent();
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(400);
  const panelOpen = () => page.locator('[data-press]').isVisible();
  ok(await panelOpen(), '⌃⌥G on the page opens Iris\'s panel');
  ok(await page.locator('[data-press-good]').isVisible(), 'and Fix says "looks good"');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  ok((await page.locator('[data-press-text] ins').count()) > 0, 'a tone shows its changes marked, as the panel does');
  const foot = await page.locator('[data-press] [data-press-replace]').boundingBox(), hint = await page.locator('[data-press] [data-press-next]').boundingBox();
  ok(Math.abs(foot.y + foot.height / 2 - (hint.y + hint.height / 2)) < 4, 'and its footer sits on one line');
  await page.keyboard.press('Shift+Tab');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  ok((await page.locator('[data-press-tab][aria-selected="true"]').textContent()).includes('Funny'), 'Tab moves through the tones to Funny');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  ok((await lede.textContent()) !== ledeWas && !(await panelOpen()), 'Return puts the tone on the page');
  await page.keyboard.press('Meta+z');
  ok((await lede.textContent()) === ledeWas, '⌘Z puts it back');
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-press')), 'the panel takes focus, not a tab');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
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
