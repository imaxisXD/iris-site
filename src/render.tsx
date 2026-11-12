// Renders the whole page to HTML at build time. React never reaches the browser.
import { renderToStaticMarkup } from 'react-dom/server';
import assets from './assets.json';
import { heroSizes, Page } from './Page';

const title = 'Iris: fix your grammar, keep your voice';
const description =
  'Iris fixes your grammar and changes your tone in any app on your Mac. Press ⌃ ⌥ G in a text box, read the fix, press Return. Free, open source, and it never sends your text anywhere.';

/** `origin` is where the site lives (SITE_URL at build time), for the canonical link and the
 *  share card, which need full addresses. */
export function render({ css, script, origin = '' }: { css: string; script: string; origin?: string }) {
  const body = renderToStaticMarkup(<Page />);
  // Only the faces the first screen sets big; the rest swap in as they arrive.
  const fonts = ['martian', 'londrina', 'knewave'];
  const hero = assets['hero-garden'];
  const heroSet = hero.sizes.map((w) => `/img/hero-garden-${w}.avif ${w}w`).join(', ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#78A2DC">
<meta name="color-scheme" content="light">
${origin ? `<link rel="canonical" href="${origin}/">` : ''}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${origin}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${fonts.map((f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}
<link rel="preload" as="image" type="image/avif" imagesrcset="${heroSet}" imagesizes="${heroSizes}" fetchpriority="high">
<link rel="preload" href="/tex/screen.png" as="image">
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Iris',
    operatingSystem: 'macOS 15 or later',
    applicationCategory: 'UtilitiesApplication',
    description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: 'https://github.com/imaxisXD/iris/releases/latest/download/Iris.zip',
  })}</script>
</head>
<body>
${body}
<script type="module">${script}</script>
</body>
</html>
`;
}
