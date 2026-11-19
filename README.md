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
- **About 10 KB of script** (`src/client.ts`): the tone tabs, the shelf of versions (off for now), the
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
- **The air round both skies** (`src/Atmosphere.tsx`) is About's meadow in the app
  (`MakersJourney.swift`), the same pieces at the same values: clouds drawn as
  illustrated clouds (chunky lobes on a flat bottom, a bold pen, a shade along the base) and
  printed in riso as the butterflies are (`scripts/sprites.mjs`), seen
  through About's lens on the cover: the sun's cloud in focus, farther ones soft and paler, a
  big one right in front of the lens very soft at the left edge; warm beams falling from the sun, dust drifting through them, petals on the breeze,
  big soft grainy leaves right in front of the lens in the bottom corners, and a butterfly
  close to the lens, a little out of focus. On the cover it runs on its own and settles with
  the garden; a paper pause button (About's) stops the garden and the air together (WCAG
  2.2.2), and as the cover scrolls away the clouds lag and the leaves run ahead. On the foot
  it comes out with the day as the page lifts off and follows the scroll: no clouds, the beams
  fan up from the rising sun, its rings are in the sun's warm cream and turn slowly with a glow
  running out through them, and a small butterfly flits about over them. Under Reduce Motion it's a still moment.
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
  Iris's pen and riso, in their own colours, and the two computers Iris is for: a silver laptop
  with Apple's apple on its screen, and a graphite one with Windows' four blue panes. The results are committed, so a build never needs Iris.
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
  Security with Done and Open Anyway ringed. Under them, what a Mac needs and what a Windows
  PC will need, and why macOS asks.
- **Windows is coming, as a beta.** Every Download Iris says which computers it's for
  (`Platforms` in `src/parts.tsx`): the button gets the Mac's app, and Windows wears a stamped
  "beta" (`BetaStamp`: a hollow rubber stamp in ink through the screen, never a pill) with
  "coming soon", each line with its drawn computer (`OsIcon`). Windows' status, requirements and
  its button (Follow it on GitHub) live in one place, `windows` in `src/content.ts`: change them
  there when the beta is out.
- **Questions** (`Questions` in `src/Page.tsx`) is printed on its own plate, as Privacy is on
  pink: the pale green of About's meadow haze in the app, with the running head, the stair title
  and the questions beside it. Branches hang and rise round it (`src/Branches.tsx`: a seeded dry
  brush, overprinted), seen through a lens as About's meadow is (`MakersJourney.swift`): far ones
  printed toward the haze and a touch soft, a sharp one under the title, and big soft grainy ones
  right in front of the lens at the corners. Scrolling slides the near ones past the far ones
  (`animation-timeline: view()`, where the browser has it). A breeze sways them once as the plate
  comes on screen and every one settles within 5s (WCAG 2.2.2); never under Reduce Motion. Near
  ones never sit over a question, and on a phone only the one under the list stays. One question
  is open at a time (`<details name>`, no script needed), the first to start. The open one lifts
  off the plate as a paper slip with a pink marker swipe under it; with the script the open one
  folds as the tapped one unfolds, on one curve, and the page is never scrolled for you. The
  plate ends the page: its green runs straight into the foot (`client.ts`,
  storyboard at the top of that part). Each is what someone asks
  before they download; Iris answers with a short lead in brush as it
  talks in its notes, then the plain answer. It's where What's new was: the shelf of versions
  is off for now, but `WhatsNew` still builds it (and its checks are commented out in
  `scripts/check.mjs`), so putting it back is one line in `Page`.
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
pnpm check          # use the built page in headless Chromium: tones, keys, questions, video
pnpm shoot          # full-page screenshots at 1440 and 390 into /tmp/iris-shots
pnpm garden         # the cover's garden at set times, and under Reduce Motion, into /tmp/iris-garden
pnpm typecheck
pnpm assets         # redo public/ from Iris (needs `swift build` in ../grammly-alt, or IRIS=…)
pnpm sprites        # reprint the garden's sprites into public/sprite
node scripts/fable-flower.mjs   # reprint the cover flower's parts from Iris's rig
node scripts/art.mjs            # reprint the backdrops and the menu bar Mac's desktop
node scripts/app-icons.mjs      # redraw the app icons
pnpm deploy         # by hand: build and `wrangler deploy` (needs `wrangler login` first)
```

## Deploying

Cloudflare builds and deploys every push to `main` itself (Workers Builds, connected to this
repo in the `iris-site` Worker's Settings › Builds): `pnpm run build`, then `npx wrangler deploy`.
Nothing runs `pnpm check` first, so run it locally (with `pnpm dev` up) before pushing.

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
| Install | Download, drag to Applications, open it once; what a Mac and a Windows PC need, and why macOS asks |
| Questions | A pale green plate, branches round it at three depths: you ask, Iris answers; the open question a paper slip. What it does, free, private, which apps, updates, Windows |
| What's new | Off for now (`WhatsNew` still builds it): each version an issue on a shelf, from Iris's Changelog.md |
| Foot | Go write something: download, links, and IRIS with the sun and butterflies on it |

The zine itself (`design-reference/` in the Iris checkout) is someone else's work and never
goes in this repo or on the site.
