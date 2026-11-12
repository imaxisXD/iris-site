# Iris site

The landing page for [Iris](https://github.com/imaxisXD/iris), printed like the app: a riso
zine of ten pages on warm paper, a sky plate under the flower, a pink plate for privacy, pen
lines that wobble and brush marks with frayed ends. Iris's own [DESIGN.md](../grammly-alt/DESIGN.md)
is the rulebook here too; where the web needs something the app doesn't have, it's noted in
the code.

## How it's built

- **React at build time only.** `src/Page.tsx` is rendered to static HTML once
  (`src/render.tsx`). No React, no hydration, no framework in the browser.
- **StyleX** for every style (`@stylexjs/unplugin` in Vite). Its atomic CSS is inlined into
  the page with `src/global.css` (fonts, the paper, base rules), about 18 KB.
- **2.5 KB of script** (`src/client.ts`): the tone tabs, the shelf of versions, the video
  and the cover's garden playing only while they're on screen, and the foot's sign-off
  fixed as you reach it. Everything still reads without it.
- **The cover's garden is a storyboard** (`src/Garden.tsx`): the flower stretches up and
  sways, the sun rises, four butterflies arrive one by one on loops of their own, petals
  drift. The timings and every value sit at the top of the file in `TIMING` and one config
  per part; it all runs in CSS on transforms and opacity, and holds still under Reduce
  Motion. The build fails if a butterfly's loop would cross the sun.
- **Every mark is drawn at build time** (`src/pen.tsx`): pen rules, hand boxes, marker
  swipes, the dry-brush button, the brush X. Each is seeded, so it always looks the same.
  Areas of ink are masks over the riso screen texture, never a flat fill.
- **Pictures come from Iris itself.** `scripts/assets.mjs` runs the app's own off-screen
  renders (`--readme-images`, `--snapshot`), lifts the flower, garden, icons and menu off
  their paper, encodes AVIF and WebP, subsets Iris's six fonts to WOFF2 and makes the paper and screen textures (a
  shape's ink is Iris's `PrintedInk` screen, with its lighter touch on dark ink).
  `scripts/sprites.mjs` prints the garden's sun, butterflies and petals the way Iris prints
  its sprites (`RisoArt.print`). The results are committed, so a build never needs Iris.
- **The /02 video is a real recording**: the installed Iris, its real model, in TextEdit.
  `scripts/record-demo.py` takes it (it waits until nobody has touched the Mac for a
  minute, uses a scratch document, and puts the Mac back as it found it: light or dark,
  hidden apps, the app in front, however it ends); `scripts/demo-video.mjs` trims, crops
  and encodes it into `public/demo` (about 340 KB).
- **The foot** (`src/Footer.tsx`) is Iris's pink foot: the zine's sign-off, written in a
  hurry, fixed by Iris as you arrive, its marks drawn the way the panel draws them.
- **Cloudflare Workers, static assets only** (`wrangler.jsonc`). Caching rules are in
  `public/_headers`, and `/download` and `/code` redirect via `public/_redirects`.

Lighthouse (simulated mobile, slow 4G): performance 97, accessibility, best practices and
SEO 100. About 255 KB for the first view, 0 ms blocking time.

## Commands

```bash
pnpm install
pnpm dev            # build, serve with wrangler dev on :8788, rebuild on save and reload the page
pnpm build          # dist/ (SITE_URL=https://… for the canonical link and share card)
pnpm check          # use the built page in headless Chromium: tones, keys, shelf, video
pnpm shoot          # full-page screenshots at 1440 and 390 into /tmp/iris-shots
pnpm garden         # the cover's garden at set times, and under Reduce Motion, into /tmp/iris-garden
pnpm typecheck
pnpm assets         # redo public/ from Iris (needs `swift build` in ../grammly-alt, or IRIS=…)
pnpm sprites        # reprint the garden's sprites into public/sprite
pnpm demo           # record /02 again: the real Iris in TextEdit (takes the screen for ~30 s)
pnpm deploy         # build and `wrangler deploy` (needs `wrangler login` first)
```

`check` and `shoot` use the Chromium that Playwright keeps in `~/Library/Caches/ms-playwright`.

## What's on the page

| Folio | Page | From the zine |
|---|---|---|
| /01 | Cover: the sky plate, the wordmark, the stair headline, the garden coming to life | the CAFÉ cover's running head and big word |
| /02 | How it works: a real recording of Iris in TextEdit, taped in | photos taped onto the page |
| /03 | Fix and tones: the real panel in HTML, Tab through the tones | GRiND over a ghost CRUSH |
| /04 | Fix: a tan plate with words up its edge, ink labels, a stacked figure | burrs / blades |
| /05 | Privacy: half a page of pink, a stepped sign-off, the big folio | the back page |
| /06 | Make it yours: drawings with ink labels, the crossed-out lock | brewing methods and the crossed cup |
| /07 | The menu bar and setup | |
| /08 | Install, and why macOS asks | |
| /09 | What's new: each version an issue on a shelf, from Iris's Changelog.md | the manga changelog |
| /10 | The foot: the sign-off Iris fixes, download, links, who made it | the back page's sign-off and folio |

The zine itself (`design-reference/` in the Iris checkout) is someone else's work and never
goes in this repo or on the site.
