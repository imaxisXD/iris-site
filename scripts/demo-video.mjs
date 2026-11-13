// Makes the /02 video from a take recorded by scripts/record-demo.py: the real Iris in
// TextEdit, trimmed to the moment, eased in and out of the print's paper so the loop doesn't
// jump, as H.264 (every browser) with a poster from the frame where the fixes show.
//
//   node scripts/demo-video.mjs [take-dir]      (default /tmp/iris-demo)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const dir = process.argv[2] ?? '/tmp/iris-demo';
const take = JSON.parse(readFileSync(path.join(dir, 'take.json'), 'utf8'));
const out = path.join(root, 'public/demo');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const CUT = {
  lead: 1.1,      // s of the draft before the shortcut
  tail: 2.2,      // s of the fixed text after Replace lands
  fade: 0.35,     // s eased in from and out to the paper
  width: 1400,    // px wide
  fps: 30,
  paper: '0xFFFCF9',
};
const { press, answer, replaced } = take.events;
// What's kept of the recorded area, in points of the screen: from the flower to the window's
// right edge, from the panel's top to a little under the text (the rest is desktop and an
// empty page). The recording is at 2 pixels a point.
const [bud, panel] = take.rects.slice(1).sort((a, b) => a.width - b.width);
const page = take.rects[0];
const keep = { x0: bud.x + 10, y0: panel.y - 14, x1: page.x + page.width + 14, y1: page.y + 190 };
const px = (v) => Math.round(v * 2);
const crop = `crop=${px(keep.x1 - keep.x0)}:${px(keep.y1 - keep.y0)}:${px(keep.x0 - take.area.x)}:${px(keep.y0 - take.area.y)}`;
const start = Math.max(0, press - CUT.lead);
const length = replaced + CUT.tail - start;
const fadeOut = length - CUT.fade;
const ff = (...args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args]);

const mp4 = path.join(out, 'iris-in-textedit.mp4');
ff(
  '-ss', start.toFixed(2), '-t', length.toFixed(2), '-i', path.join(dir, 'take.mov'),
  '-vf', [
    `fps=${CUT.fps}`,
    crop,
    `scale=${CUT.width}:-2:flags=lanczos`,
    `fade=t=in:st=0:d=${CUT.fade}:color=${CUT.paper}`,
    `fade=t=out:st=${fadeOut.toFixed(2)}:d=${CUT.fade}:color=${CUT.paper}`,
    'format=yuv420p',
  ].join(','),
  '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-tune', 'animation', '-profile:v', 'high', '-an', '-movflags', '+faststart',
  mp4,
);

// The poster: the panel with its fixes, a beat after it answered.
const posterPng = path.join(dir, 'poster.png');
ff('-ss', (answer + 1.2).toFixed(2), '-i', path.join(dir, 'take.mov'), '-frames:v', '1', '-vf', `${crop},scale=${CUT.width}:-2:flags=lanczos`, posterPng);
await sharp(posterPng).avif({ quality: 60 }).toFile(path.join(out, 'iris-in-textedit.avif'));
await sharp(posterPng).webp({ quality: 80 }).toFile(path.join(out, 'iris-in-textedit.webp'));
// A half-size still for phones; client.ts swaps in the full one where the video shows wide.
await sharp(posterPng).resize(700).webp({ quality: 80 }).toFile(path.join(out, 'iris-in-textedit-700.webp'));
const { width, height } = await sharp(posterPng).metadata();

writeFileSync(path.join(root, 'src/demo.json'), JSON.stringify({ width, height, seconds: +length.toFixed(2), draft: take.draft, fixed: take.fixed }, null, 2) + '\n');
const kb = (f) => `${(statSync(f).size / 1024).toFixed(0)} KB`;
console.log(`demo: ${width}×${height}, ${length.toFixed(1)} s, ${kb(mp4)}`);
