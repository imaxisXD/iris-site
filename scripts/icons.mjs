// The tab and home-screen icons, from Iris's own app icon (assets/AppIcon.icns in $IRIS).
// scripts/assets.mjs runs this; run it alone with `node scripts/icons.mjs`.
//
// A macOS icon has 100 px of empty margin around its rounded square (out of 1024), so at tab size
// the flower would be a speck. Every icon here is cropped to the rounded square first. The
// home-screen icon is also laid on the icon's paper with no transparent corners: iOS rounds it
// itself and turns transparent corners black.
//
//   favicon.png           96 px (Google wants a multiple of 48)
//   favicon.ico           16, 32 and 48 px, for browsers and crawlers that only ask for /favicon.ico
//   apple-touch-icon.png  180 px, square and opaque
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const iris = path.resolve(process.env.IRIS ?? path.join(root, '../grammly-alt'));
const out = (f) => path.join(root, 'public', f);
const paper = '#F0EAE6'; // the icon's own paper, sampled inside its corners

const tmp = mkdtempSync(path.join(tmpdir(), 'iris-icons-'));
const full = path.join(tmp, 'icon.png');
execFileSync('sips', ['-s', 'format', 'png', path.join(iris, 'assets/AppIcon.icns'), '--out', full], { stdio: 'ignore' });
const square = await sharp(full).trim({ threshold: 1 }).png().toBuffer();
rmSync(tmp, { recursive: true, force: true });

const size = (px) => sharp(square).resize(px, px, { kernel: 'lanczos3' });

await size(180).flatten({ background: paper }).png().toFile(out('apple-touch-icon.png'));
await size(96).png().toFile(out('favicon.png'));

// An .ico that holds PNGs: a 6-byte header, a 16-byte entry per size, then the images.
const pngs = await Promise.all([16, 32, 48].map(async (px) => [px, await size(px).png().toBuffer()]));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach(([px, png], i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(px % 256, e);
  header.writeUInt8(px % 256, e + 1);
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(png.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync(out('favicon.ico'), Buffer.concat([header, ...pngs.map(([, png]) => png)]));

console.log('icons done: favicon.png, favicon.ico, apple-touch-icon.png');
