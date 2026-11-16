# Iris site

The landing page for [Iris](https://github.com/imaxisXD/iris), printed like the app: a riso
zine on warm paper, a sky plate under the flower, a pink plate for privacy, pen
lines that wobble and brush marks with frayed ends. Iris's own [DESIGN.md](../grammly-alt/DESIGN.md)
is the rulebook here too; where the web needs something the app doesn't have, it's noted in
the code.

## How it's built

- **React at build time only.** `src/Page.tsx` is rendered to static HTML once
  (`src/render.tsx`). No React, no hydration, no framework in the browser.
- **StyleX** for every style (`@stylexjs/unplugin` in Vite). Its atomic CSS is inlined into
  the page with `src/global.css` (fonts, the paper, base rules), about 18 KB.
- **About 10 KB of script** (`src/client.ts`): the tone tabs, the shelf of versions, the
  video and its Pause button, the cover's garden, the foot's sign-off, and ⌃ ⌥ G on the
  page. Everything still reads without it.
- **The cover's garden is a storyboard** (`src/Garden.tsx`, first drawn by a Fable 5.2
  agent): Iris's flower, built part by part from the app's own rig
  (`scripts/fable-flower.mjs` ports `IrisRig.swift`), the sun and four butterflies, in depth
  planes. ⌃ ⌥ G goes down, Iris's panel pops out of the bloom, three butterflies each fly
  from their own spot to one of its fixes, and Return finishes as the app does
  (`IrisRig.swift`'s "Done"): the panel goes at once, the flower flicks its front petal onto
  the text, where it lands as a stamp with a tick, and Iris's note says "replaced", Undo
  with ⌘ Z. `TIMING` and one config
  per part sit at the top, and the build fails if a keyframe drifts from them. It plays
  three times and settles, pauses while scrolled away, and holds still under Reduce Motion.
- **One panel for the whole site** (`src/Panel.tsx`): the app's panel (`PanelView.swift`),
  tone names, the marked message, the keys, "into" an app on tape with its icon, Replace.
  Section 03, the cover and the ⌃ ⌥ G panel all use it. Where its footer would wrap it drops
  its key hints, and on a phone section 03's is laid out wider and zoomed down (`client.ts`),
  so its tones and its footer each stay on one line, as the app's.
- **⌃ ⌥ G works on the page.** The keys go down and the panel opens on the paragraph you're
  reading: Fix says "looks good", Tab tries hand-written tones (`content.ts`), Return puts
  one on the page, ⌘Z takes it back. With Iris installed, Iris takes the keys instead.
- **Every mark is drawn at build time** (`src/pen.tsx`): pen rules, hand boxes, marker
  swipes, the dry-brush button, the brush X. Each is seeded, so it always looks the same.
  Areas of ink are masks over the riso screen texture, never a flat fill.
- **Pictures come from Iris itself.** `scripts/assets.mjs` runs the app's own off-screen
  renders (`--readme-images`, `--snapshot`), lifts the flower, garden, icons and menu off
  their paper, encodes AVIF and WebP, subsets Iris's six fonts to WOFF2 and makes the paper and screen textures (a
  shape's ink is Iris's `PrintedInk` screen, with its lighter touch on dark ink).
  `scripts/sprites.mjs` prints the garden's sun, butterflies and petals the way Iris prints
  its sprites (`RisoArt.print`). `scripts/art.mjs` prints the backdrops behind the panels
  (flat riso plates with Iris's flower and ghost words) and the menu bar Mac's desktop;
  `scripts/app-icons.mjs` draws the apps the page names (Slack, Mail, Notes, 1Password…) in
  Iris's pen and riso, in their own colours. The results are committed, so a build never needs Iris.
- **How it works is drawn, not recorded** (`src/Desk.tsx`): the top left corner of a Mac on a
  torn pink sheet, its desktop a green plate with loops and brush-stroke flowers. Slack, Mail,
  Messages, Notes, Chrome and Safari take turns, simply drawn, each with a made-up reply in its
  box: the shortcut goes down, Iris's own flower grows by the box, the shared panel
  (`src/Panel.tsx`) marks the fixes, and Return puts them in. Every name and sentence is made
  up. Its storyboard is at the top of the file; `client.ts` runs the clock (only while it's on
  screen; Pause holds it), zooms its fixed canvas to the screen, follows the text box on a
  phone, and makes the steps beside it chapters; `global.css` turns the beats into motion.
  Under Reduce Motion it holds Iris's panel open in Slack.
- **Make it yours** shows Iris's own Settings window, as the app draws it, lying on a torn
  sheet of How it works' green. The list beside it (Tones, Words, Apps, Shortcuts) turns the window to that page;
  the pictures are the app's `--snapshot` renders, made by `scripts/assets.mjs` at a higher
  quality than the rest, since they're shown small and are mostly type.
- **Install is a collage** like Fix's: small torn sheets, each with a few drawn pieces on it.
  It shows the zip
  in Downloads, Iris dragged to Applications, and the first-open dialog over Privacy &
  Security with Done and Open Anyway ringed. The specs and why macOS asks sit under them.
- **The foot** (`src/Footer.tsx`) waits under the page, pinned to the bottom of the window;
  at the end the page lifts off it like a sheet, and it comes forward out of the page's
  shade. It's the sky with the IRIS wordmark, big and cut off by the page's edge, drawn as
  the app draws it (`IrisLogo`), and a torn-off back-cover stub with the keys. As it comes into view the sun
  climbs out from behind the S and three butterflies land on the letters; over the foot the
  pointer is a butterfly. ⌃ ⌥ G there plays it again. Its height never changes.
- **Cloudflare Workers, static assets only** (`wrangler.jsonc`). Caching rules are in
  `public/_headers`, and `/download` and `/code` redirect via `public/_redirects`.

Lighthouse (simulated mobile, slow 4G): performance 95, accessibility, best practices and
SEO 100. About 310 KB for the first view, 0 ms blocking time.

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
node scripts/fable-flower.mjs   # reprint the cover flower's parts from Iris's rig
node scripts/art.mjs            # reprint the backdrops and the menu bar Mac's desktop
node scripts/app-icons.mjs      # redraw the app icons
pnpm deploy         # build and `wrangler deploy` (needs `wrangler login` first)
```

`check` and `shoot` use the Chromium that Playwright keeps in `~/Library/Caches/ms-playwright`.

## What's on the page

| Section | What's there |
|---|---|
| Cover | The sky plate, the stair headline, the garden where Iris fixes a note |
| How it works | Press, read, replace; a Mac drawn on the page, Iris fixing a reply in six apps in turn |
| Fix and tones | The panel on a collage of printed sheets; Tab through the tones |
| Fix | Fixes, not rewrites: what Iris leaves alone |
| Privacy | The pink plate: the model runs on your Mac |
| Make it yours | Iris's Settings window on a green sheet; pick Tones, Words, Apps or Shortcuts to turn its page |
| Menu bar | A Mac's corner with Iris's menu open under its flower; setup in three steps |
| Install | Download, drag to Applications, open it once; the specs, and why macOS asks |
| What's new | Each version an issue on a shelf, from Iris's Changelog.md |
| Foot | Go write something: download, links, and IRIS with the sun and butterflies on it |

The zine itself (`design-reference/` in the Iris checkout) is someone else's work and never
goes in this repo or on the site.
