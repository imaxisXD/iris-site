// Renders the whole page to HTML at build time. React never reaches the browser.
import { renderToStaticMarkup } from 'react-dom/server';
import assets from './assets.json';
import { Page } from './Page';

const title = 'Iris: fix your grammar, change your tone';
// Which computer this is, on <html data-os="mac|windows|other"> before anything draws (global.css
// swaps the words and the download on it). ?os=mac|windows|other overrides it, to look at each.
// An iPhone or iPad says Mac; the page's touch rules take those over.
const OS_SCRIPT = `(function(){var d=document.documentElement,q=/[?&]os=(mac|windows|other)\\b/.exec(location.search),o=q&&q[1];if(!o){var n=navigator,p=((n.userAgentData&&n.userAgentData.platform)||n.platform||'')+' '+(n.userAgent||'');o=/Win/.test(p)?'windows':/Mac|iPhone|iPad/.test(p)?'mac':'other'}d.setAttribute('data-os',o)})()`;
const description =
  'A free, private Grammarly alternative for Mac and Windows. Fix grammar and change tone in any app with one shortcut. Works offline and never sends your writing to the cloud.';
// What the share card shows, for people who can't see it.
const cardAlt =
  'Iris: fix your grammar, change your tone. Iris’s panel fixes “cant”, “tmrw” and “their” in a note, under a sun and butterflies.';

/** `origin` is where the site lives (SITE_URL at build time), for the canonical link and the
 *  share card, which need full addresses. */
export function render({ css, script, origin = '' }: { css: string; script: string; origin?: string }) {
  const body = renderToStaticMarkup(<Page />);
  // Only the faces the first screen sets big; the rest swap in as they arrive.
  const fonts = ['martian', 'londrina', 'knewave'];
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
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Iris">
${origin ? `<meta property="og:url" content="${origin}/">` : ''}
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${origin}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="${cardAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${origin}/og.jpg">
<meta name="twitter:image:alt" content="${cardAlt}">
${fonts.map((f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}
<link rel="preload" as="image" href="/fable/flower.webp" fetchpriority="high">
<link rel="preload" href="/tex/screen.png" as="image">
<script>${OS_SCRIPT}</script>
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Iris',
    operatingSystem: 'macOS 15 or later; Windows 10 or 11 (64-bit, beta)',
    applicationCategory: 'UtilitiesApplication',
    description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: 'https://github.com/imaxisXD/iris/releases/latest',
  })}</script>
</head>
<body>
${body}
<script type="module">${script}</script>
</body>
</html>
`;
}
