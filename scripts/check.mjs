// Uses the built page like a person would, in headless Chromium, and fails loudly when
// something they'd touch doesn't work.
//   node scripts/check.mjs [url]
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:8788/';
// On a Mac, the newest headless shell Playwright keeps; anywhere else (CI) the one
// `playwright-core install --only-shell chromium` put where Playwright looks by itself.
const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
const shell = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop() : undefined;
const executablePath = shell ? path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell') : undefined;
const browser = await chromium.launch({ executablePath });
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

  // The shelf of versions is off for now (Page.tsx keeps WhatsNew); put these back with it.
  // const books = page.locator('[data-issue]');
  // const n = await books.count();
  // ok(n >= 2, `the shelf has ${n} versions`);
  // const oldest = books.first();
  // await oldest.click();
  // const no = await oldest.getAttribute('data-issue');
  // ok(await page.locator(`[data-facts="${no}"]`).isVisible(), 'clicking an older issue shows its changes');
  // ok((await page.locator('[data-facts]:not([hidden])').count()) === 1, 'one issue at a time');

  // Questions, where What's new was, and nothing links to What's new any more.
  const questions = await page.locator('#questions [data-question]').count();
  ok(questions >= 6, `Questions answers ${questions} questions`);
  const openOnes = () => page.locator('#questions [data-question][open]');
  ok((await openOnes().count()) === 1 && (await page.locator('#questions [data-question]').first().getAttribute('open')) !== null, 'the first question starts open, and only it');
  const second = page.locator('#questions [data-question] > summary').nth(1);
  await second.scrollIntoViewIfNeeded();
  // Opening a question never moves the page: nothing above it changes, and nothing scrolls.
  const qBefore = await second.evaluate((s) => ({ y: scrollY, top: s.getBoundingClientRect().top }));
  await second.click();
  await page.waitForTimeout(700); // the answer unfolds (client.ts, FOLD)
  const qAfter = await second.evaluate((s) => ({ y: scrollY, top: s.getBoundingClientRect().top }));
  ok(qAfter.y === qBefore.y, `opening a question never scrolls the page (scrolled ${Math.round(qAfter.y - qBefore.y)}px)`);
  ok((await openOnes().count()) === 1 && (await page.locator('#questions [data-question]').nth(1).getAttribute('open')) !== null, 'opening another question folds the first: one open at a time');
  ok(await page.locator('#questions [data-question]').nth(1).locator('[data-question-answer]').isVisible(), 'and shows Iris’s answer');
  const lifted = await page.locator('#questions [data-question]').nth(1).evaluate((d) => getComputedStyle(d).boxShadow !== 'none');
  ok(lifted, 'the open question lifts off the plate as a paper slip');
  await second.click();
  await page.waitForTimeout(700);
  ok((await openOnes().count()) === 0, 'tapped again, it folds');
  await page.locator('#questions [data-question] > summary').first().click();
  await page.waitForTimeout(700);
  // The plate ends the page: no paper margin between its green and the foot.
  const gap = await page.evaluate(() => document.querySelector('[data-sheet]').getBoundingClientRect().bottom - document.querySelector('#questions').getBoundingClientRect().bottom);
  ok(Math.abs(gap) < 1, `the green runs straight into the foot (${Math.round(gap)}px between)`);
  // The sheet's branches: painted, never in the way, swaying only while on screen.
  const branches = page.locator('#questions [data-branch]');
  ok((await branches.count()) >= 4, `the Questions plate has ${await branches.count()} branches`);
  const depths = await page.locator('#questions [data-branch-depth]').evaluateAll((bs) => [...new Set(bs.map((b) => b.dataset.branchDepth))].sort().join(' '));
  ok(depths === 'far mid near', `they're seen through a lens, far, sharp and near (${depths})`);
  ok(await page.locator('#questions [data-depth="near"]').evaluate((l) => getComputedStyle(l).pointerEvents === 'none' && l.getAttribute('aria-hidden') === 'true'), 'the near ones, in front of the words, never take a tap');
  ok(await branches.first().evaluate((b) => getComputedStyle(b.parentElement).pointerEvents === 'none' && b.parentElement.getAttribute('aria-hidden') === 'true'), 'the branches never take a tap, and screen readers skip them');
  const breeze = await page.locator('#questions').evaluate((q) => {
    const all = [...q.querySelectorAll('[data-branch]')].flatMap((b) => b.getAnimations());
    return { on: q.hasAttribute('data-sway') && all.length > 0, longest: Math.max(0, ...all.map((a) => a.effect.getComputedTiming().endTime)) };
  });
  ok(reduce ? !breeze.on : breeze.on, reduce ? 'under Reduce Motion the branches are still' : 'a breeze sways the branches as the sheet comes on screen');
  if (!reduce) ok(breeze.longest > 0 && breeze.longest <= 5000, `and every branch has settled within 5s (${Math.round(breeze.longest)}ms), WCAG 2.2.2`);
  ok(!(await page.locator('a[href="#new"]').count()), 'nothing links to the hidden What’s new');
  ok((await page.locator('a[href="#questions"]').count()) === 2, 'the cover and the foot link to Questions');
  // Every Download Iris says which computers, each with its drawn computer.
  ok((await page.locator('img[src^="/app/mac.png"]').count()) >= 3 && (await page.locator('img[src^="/app/windows.png"]').count()) >= 3, 'the Mac and Windows are drawn beside their names');

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
  // The air round the cover (Atmosphere.tsx): About's clouds, beams, dust, petals, lens leaves
  // and close butterfly; it runs with the garden and the pause button stops all of it.
  const airState = () =>
    page.locator('header').evaluate((h) => {
      const all = [...h.querySelectorAll('[data-air="live"], [data-garden]')].flatMap((e) => e.getAnimations({ subtree: true }));
      return { running: all.filter((a) => a.playState === 'running').length };
    });
  const air = await page.locator('header').evaluate((h) => ({
    clouds: h.querySelectorAll('[data-cloud]').length,
    beams: h.querySelectorAll('[data-garden] [data-beam]').length,
    dust: h.querySelectorAll('[data-dust]').length,
    petals: h.querySelectorAll('[data-petal]').length,
    lens: h.querySelectorAll('[data-lens]').length,
    fly: h.querySelectorAll('[data-close-fly]').length,
    quiet: [...h.querySelectorAll('[data-air="live"]')].every((e) => getComputedStyle(e).pointerEvents === 'none' && e.closest('[aria-hidden="true"]') !== null),
  }));
  ok(air.clouds >= 1 && air.beams === 4 && air.dust > 10 && air.petals >= 3 && air.lens === 2 && air.fly === 1, `the cover has About's air: ${air.clouds} clouds, ${air.beams} beams, ${air.dust} specks, ${air.petals} petals, ${air.lens} lens corners, a close butterfly`);
  ok(air.quiet, 'and it never takes a tap, and screen readers skip it');
  const pauseBtn = page.locator('[data-air-pause]');
  if (reduce) {
    ok(!(await pauseBtn.isVisible()), 'under Reduce Motion there is nothing to pause, so no pause button');
    ok((await airState()).running === 0, 'and the air is still');
  } else {
    ok(await pauseBtn.isVisible(), 'the cover has a pause button, as About does (WCAG 2.2.2)');
    ok((await pauseBtn.getAttribute('aria-label')) === 'Pause the animation', 'named for what it does');
    await pauseBtn.click();
    await page.waitForTimeout(200);
    ok((await airState()).running === 0 && (await pauseBtn.getAttribute('aria-label')) === 'Play the animation', 'pressed, everything on the cover stops, and it offers to play');
    await pauseBtn.click();
    await page.waitForTimeout(200);
    ok((await airState()).running > 20, 'pressed again, it all carries on');
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

  // ⌃ ⌥ G on the page, as the app plays it: the bud grows by the paragraph you're reading and
  // opens, and the panel unrolls out of it, above the paragraph (below with no room), never over it.
  await page.goto(url, { waitUntil: 'networkidle' });
  const lede = page.locator('[data-tones="lede"]');
  const ledeWas = await lede.textContent();
  const at = () => page.locator('[data-press-iris]').getAttribute('data-at');
  const opened = () => page.waitForFunction(() => document.querySelector('[data-press-iris]').dataset.at.includes('panel'), null, { timeout: 5000 });
  await page.keyboard.press('Control+Alt+KeyG');
  if (!reduce) {
    await page.waitForTimeout(100);
    const early = await at();
    ok(early.includes('bud') && !early.includes('panel'), `⌃⌥G grows Iris's bud first, before the panel ("${early}")`);
  }
  await opened();
  await page.waitForTimeout(450);
  const panelOpen = () => page.locator('[data-press]').isVisible();
  ok(await panelOpen(), '⌃⌥G on the page opens Iris\'s panel out of the bloom');
  const pr = await page.locator('[data-press]').boundingBox(), lr = await lede.boundingBox(), fr = await page.locator('[data-press-flower]').boundingBox();
  ok(pr.y + pr.height <= lr.y + 1 || pr.y >= lr.y + lr.height - 1, 'beside the paragraph, not over it');
  ok(fr.x < pr.x + 40 && pr.x >= lr.x - 1, 'with the flower at its left, and nothing left of the text where there\'s no room for it');
  ok(await page.locator('[data-press-good]').isVisible(), 'and Fix says "looks good"');
  ok(await page.locator('[data-press] [data-label-clean]').evaluate((el) => getComputedStyle(el).visibility === 'visible'), 'and its button says Done, as the app\'s does when Fix found nothing');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  ok((await page.locator('[data-press-text] ins').count()) > 0, 'a tone shows its changes marked, as the panel does');
  const foot = await page.locator('[data-press] [data-press-replace]').boundingBox(), hint = await page.locator('[data-press] [data-press-next]').boundingBox();
  ok(Math.abs(foot.y + foot.height / 2 - (hint.y + hint.height / 2)) < 4, 'and its footer sits on one line');
  await page.keyboard.press('Shift+Tab');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  ok((await page.locator('[data-press-tab][aria-selected="true"]').textContent()).includes('Funny'), 'Tab moves through the tones to Funny');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(reduce ? 200 : 600);
  const said = await page.locator('[data-says]').evaluate((el) => [...el.querySelectorAll('[data-says-lead], [data-says-detail], [data-says-keys]:not([hidden])')].map((e) => e.textContent).join(' '));
  ok((await lede.textContent()) !== ledeWas && !(await panelOpen()), 'Return puts the tone on the page, and the panel goes at once');
  ok(said === 'replaced Undo with ⌘Z', `and Iris says what the app's does by it ("${said}")`);
  if (!reduce) ok((await at()).includes('done'), 'and plays the app\'s Done: the stamp and the flower sinking');
  await page.waitForTimeout(1600);
  ok((await at()) === '', 'and the flower has gone after');
  await page.keyboard.press('Meta+z');
  ok((await lede.textContent()) === ledeWas, '⌘Z puts it back, and Iris says nothing (your app undoes it)');
  await page.waitForTimeout(2500);
  await page.keyboard.press('Control+Alt+KeyG');
  await opened();
  ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-press')), 'the panel takes focus, not a tab');
  await page.keyboard.press('Escape');
  if (!reduce) ok((await at()).includes('shut'), 'Esc folds the panel back into the flower, which sinks');
  await page.waitForTimeout(250);
  ok(!(await panelOpen()), 'Esc closes the panel');
  ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-press') || document.activeElement === document.body), 'focus came back after Esc');
  await page.waitForTimeout(600);
  await page.keyboard.press('Control+Alt+KeyG');
  await opened();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  ok(!(await panelOpen()) && (await lede.textContent()) === ledeWas, 'on Fix, Return is Done: it closes and puts nothing on the page');

  // Make it yours: picking a page on the list turns the Settings window to it; ↓ moves on.
  const yoursPage = () => page.locator('#yours [data-yours-page][data-shown="true"]').getAttribute('id');
  ok((await yoursPage()) === 'yours-page-0', 'Make it yours opens at Tones');
  await page.locator('#yours [role="tab"]').nth(2).click();
  ok((await yoursPage()) === 'yours-page-2', 'Make it yours shows Apps when picked');
  await page.keyboard.press('ArrowDown');
  ok((await yoursPage()) === 'yours-page-3', '↓ moves Make it yours to Shortcuts');
  await page.locator('#yours [data-yours-step] p').nth(1).click();
  ok((await yoursPage()) === 'yours-page-1', 'an item’s words pick it too');
  ok((await page.locator('#yours [data-yours-page][inert]').count()) === 3, 'the pages not shown are out of reach');
  const loaded = await page
    .waitForFunction(() => { const img = document.querySelector('#yours [data-yours-page][data-shown="true"] img'); return img?.complete && img.naturalWidth > 0; }, null, { timeout: 5000 })
    .then(() => true, () => false);
  ok(loaded, 'the Settings picture loads');
  // Install: three drawn steps.
  ok((await page.locator('#install ol > li').count()) === 3, 'Install shows three steps');

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

// On a phone ⌃ ⌥ G's panel keeps to the paragraph's column: its edges are the text's, and the
// flower stands on the text's top left, inside the column too.
for (const width of [320, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const el = document.querySelector('[data-tones="private"]'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 500); });
  await page.keyboard.press('Control+Alt+KeyG');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const R = (s) => document.querySelector(s).getBoundingClientRect();
    const t = R('[data-tones="private"]'), p = R('[data-press]'), b = R('[data-press] [data-press-replace]');
    return { left: Math.abs(p.left - t.left), right: Math.abs(p.right - t.right), button: b.right <= p.right + 0.5 };
  });
  ok(r.left < 1 && r.right < 1 && r.button, `at ${width}px ⌃⌥G's panel lines up with the paragraph's edges, its button inside it`);
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
// The cover's Return, as the app finishes a fix (Garden.tsx, DONE): the panel goes at once, the
// flower's fall lands as a stamp with a tick, and Iris's note says "replaced", Undo with ⌘Z.
// Every part of the garden runs on one 12s clock, so seeking them all to a time shows that beat.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const at = (ms) =>
    page.evaluate((ms) => {
      const g = document.querySelector('[data-garden]');
      for (const a of g.getAnimations({ subtree: true })) (a.pause(), (a.currentTime = ms));
      const cs = (sel) => getComputedStyle(g.querySelector(sel));
      return { panel: +cs('[inert]').opacity, note: +cs('[data-done-note]').opacity, stamp: cs('[data-done-stamp]').scale, words: g.querySelector('[data-done-note]').textContent };
    }, ms);
  const open = await at(6000), done = await at(8700), later = await at(11500), rest = await at(0);
  ok(open.panel === 1 && open.note === 0 && rest.stamp === '0', 'the cover shows Iris\'s panel, and no note or stamp before Return');
  ok(done.panel === 0 && done.note === 1 && Math.abs(parseFloat(done.stamp) - 1) < 0.05, `after Return the panel is gone, the stamp is down and Iris's note is up (stamp ${done.stamp})`);
  ok(/replaced/.test(done.words) && /Undo with/.test(done.words), `and the note says what the app's does ("${done.words.replace(/\s+/g, ' ').trim()}")`);
  ok(later.note === 0 && later.stamp === '0', 'and both are gone before the garden comes round again');
  await page.close();
}

// Once the garden has played its loops it settles for good, and the air round it with it: with
// nothing left moving on the cover, the pause button goes. (Its loops are counted off the panel's
// pop, so they're told here instead of waited out.)
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const pauseBtn = page.locator('[data-air-pause]');
  ok(await pauseBtn.isVisible(), 'while the garden plays, the cover offers its pause button');
  await page.evaluate(() => {
    const pop = document.querySelector('[data-garden] [inert]');
    for (let i = 0; i < 5; i++) pop.dispatchEvent(new AnimationEvent('animationiteration'));
  });
  await page.waitForTimeout(200);
  const running = await page.locator('header').evaluate((h) => [...h.querySelectorAll('[data-air="live"], [data-garden]')].flatMap((e) => e.getAnimations({ subtree: true })).filter((a) => a.playState === 'running').length);
  ok(running === 0, `once the garden settles, the air settles with it (${running} still moving)`);
  ok(!(await pauseBtn.isVisible()), 'and with nothing left moving, the pause button goes');
  await page.close();
}

// On phones and narrow windows Iris's panel in section 03 keeps its tone names on one line and
// its footer on one line, as the app's, with every tone chosen; and on a phone its message is
// still big enough to read.
for (const width of [320, 390, 520, 820]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    const p = document.querySelector('#tones [data-panel]');
    const tabs = [...p.querySelectorAll('[role="tab"]')];
    /** Whether any of `els` starts below where the highest of them ends: a second row. */
    const twoRows = (els) => {
      const v = els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect());
      const end = Math.min(...v.map((b) => b.bottom));
      return v.some((b) => b.top >= end - 1);
    };
    let tonesWrap = false;
    for (const t of tabs) (t.click(), (tonesWrap ||= twoRows(tabs)));
    const foot = [...p.querySelectorAll('[data-panel-keys] button, [data-replace-wrap]')];
    const into = p.querySelector('[data-replace-wrap]').parentElement.firstElementChild; // the app's tape
    const box = p.closest('[data-phone-panel]');
    const msg = p.querySelector('[role="tabpanel"]:not([hidden])');
    return { tonesWrap, footWraps: twoRows([...foot, into]), text: parseFloat(getComputedStyle(msg).fontSize) * (Number(box.querySelector(':scope > div').style.zoom) || 1) };
  });
  ok(!r.tonesWrap && !r.footWraps, `at ${width}px section 03's panel keeps its tones and its footer each on one line`);
  if (width >= 360) ok(r.text >= 11.5, `and its message reads at ${r.text.toFixed(1)}px`);
  await page.close();
}

// On a phone the foot's stub lies over the sun's rings, not under them.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const covered = (undo) => page.evaluate((undo) => {
    const word = [...document.querySelectorAll('footer span')].find((e) => e.textContent === 'Made by Abhishek');
    const stub = word.parentElement.parentElement;
    // The wordmark's layers let the pointer through, so let them catch it here to find what's on top.
    for (const el of document.querySelectorAll('footer [aria-hidden] *')) el.style.pointerEvents = 'auto';
    if (undo) stub.parentElement.style.setProperty('z-index', 'auto');
    const b = stub.getBoundingClientRect();
    let over = 0;
    for (let x = 0.04; x < 1; x += 0.04)
      for (let y = 0.1; y < 1; y += 0.2) {
        const h = document.elementFromPoint(b.left + b.width * x, b.top + b.height * y);
        if (h && !stub.contains(h)) over++;
      }
    if (undo) stub.parentElement.style.removeProperty('z-index');
    return over > 0;
  }, undo);
  ok(!(await covered(false)), 'on a phone nothing at the foot is drawn over "Made by Abhishek"');
  ok(await covered(true), 'and this check sees the rings when they are on top');
  await page.close();
}
// A phone or tablet can't run Iris: its button sends the page to a Mac instead (parts.tsx,
// GetIris). The share sheet gets the page's address; closing it does nothing more; with no
// share sheet the link's own email to yourself goes. On the cover the sun stays on the screen.
for (const mode of ['shares', 'closed', 'none']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.addInitScript((mode) => {
    window.__shared = [];
    if (mode === 'none') return void delete Navigator.prototype.share;
    Navigator.prototype.share = function (d) {
      window.__shared.push(d);
      return mode === 'closed' ? Promise.reject(new DOMException('closed', 'AbortError')) : Promise.resolve();
    };
  }, mode);
  const page = await ctx.newPage();
  await page.goto(url + '#install', { waitUntil: 'load' });
  if (mode === 'shares') {
    ok(!(await page.getByRole('link', { name: 'Download Iris' }).count()), 'on a phone there is no Download Iris button');
    ok((await page.getByRole('link', { name: 'Send to my Mac' }).count()) === 3, 'but Send to my Mac, on the cover, at Install and at the foot');
    ok((await page.getByRole('link', { name: 'Download it here instead' }).first().getAttribute('href'))?.endsWith('/Iris.zip'), 'and Download it here instead still gets the zip');
    const sun = await page.evaluate(() => document.querySelector('img[src="/sprite/sun-face.png"]').getBoundingClientRect().right);
    ok(sun <= 390, `the cover's sun is all on the screen (its right edge at ${Math.round(sun)}px)`);
  }
  const res = await page.evaluate(async () => {
    const a = [...document.querySelectorAll('[data-send-to-mac]')].find((e) => e.getClientRects().length);
    let prevented;
    addEventListener('click', (e) => { prevented = e.defaultPrevented; e.preventDefault(); }, { once: true });
    a.click();
    await new Promise((r) => setTimeout(r, 300));
    return { prevented, shared: window.__shared, href: a.getAttribute('href') };
  });
  if (mode === 'shares') ok(res.prevented && res.shared.length === 1 && res.shared[0].url === new URL(url).origin + new URL(url).pathname, `Send to my Mac shares the page, without the #install ("${res.shared[0]?.url}")`);
  if (mode === 'closed') ok(res.prevented && res.shared.length === 1, 'closing the share sheet does nothing more');
  if (mode === 'none') ok(!res.prevented && res.href.startsWith('mailto:'), 'with no share sheet, it writes an email to yourself');
  await ctx.close();
}
// How it works ends each app's turn as the app (and the cover) do (Done.tsx): the panel goes at
// once, the front fall lands on the box's edge as a stamp with a tick, Iris's note says
// "replaced", Undo with ⌘Z, the flower sinks, and nothing of it is left when the next app comes.
// Under Reduce Motion the panel just stays open.
for (const reduce of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelector('[data-desk-screen]').scrollIntoView({ block: 'center' }));
  const look = () =>
    page.evaluate(() => {
      const desk = document.querySelector('[data-desk]'), app = desk.querySelector('[data-desk-app][data-on="true"]');
      const cs = (el) => getComputedStyle(el);
      return {
        panel: +cs(app.querySelector('[data-desk-panel]')).opacity,
        stamp: cs(desk.querySelector('[data-desk-done] [data-dd="stamp"]')).scale,
        note: +cs(desk.querySelector('[data-desk-done] [data-done-note]')).opacity,
        words: desk.querySelector('[data-desk-done] [data-done-note]').textContent,
        fixed: cs(app.querySelector('[data-desk-fixed]')).visibility,
        noteBox: desk.querySelector('[data-desk-done] [data-done-note]').getBoundingClientRect(),
        box: app.querySelector('[data-desk-box]').getBoundingClientRect(),
      };
    });
  if (reduce) {
    await page.waitForTimeout(800);
    const r = await look();
    ok(r.panel === 1 && r.note === 0 && r.stamp === '0', 'under Reduce Motion How it works holds the panel open, with no stamp or note');
    await page.close();
    continue;
  }
  await page.waitForFunction(() => document.querySelector('[data-desk]').dataset.at.includes('s5'), null, { timeout: 30000, polling: 'raf' });
  await page.click('[data-moment-toggle]');
  const seek = (ms) => page.evaluate((ms) => { for (const a of document.querySelector('[data-desk]').getAnimations({ subtree: true })) if (a.animationName !== 'desk-caret') (a.pause(), (a.currentTime = ms)); }, ms);
  await seek(700);
  const done = await look();
  ok(done.panel === 0 && Math.abs(parseFloat(done.stamp) - 1) < 0.05 && done.note === 1 && done.fixed === 'visible', `How it works ends as the app does: the panel gone, the fix in, the stamp down (${done.stamp}) and Iris's note up`);
  ok(done.words === 'replacedUndo with ⌘Z', `and the note says what the app's does ("${done.words}")`);
  ok(Math.abs(done.noteBox.right - done.box.right) < 30 && done.noteBox.bottom <= done.box.top + 8, 'and it sits on the text box\'s top right edge, as the app puts it, not over the text');
  await seek(4000);
  const after = await look();
  ok(after.note === 0 && after.stamp === '0', 'and the stamp and the note are gone before the next app');
  await page.close();
}
await browser.close();
if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
