// The words and examples on the page that aren't written straight into a section.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const links = {
  download: 'https://github.com/imaxisXD/iris/releases/latest/download/Iris.zip',
  /** Windows' installer, from the same release (the app's update_win.rs checks its signature). */
  downloadWindows: 'https://github.com/imaxisXD/iris/releases/latest/download/Iris-Setup-x64.exe',
  code: 'https://github.com/imaxisXD/iris',
  problem: 'https://github.com/imaxisXD/iris/issues/new',
  source: 'https://github.com/imaxisXD/iris#install',
};

// ── Windows ───────────────────────────────────────────────────────────────────────────
// Iris for Windows is out as a beta (0.5.0): the same panel and tones, from the taskbar, with
// the models as GGUF. What a PC needs is the installer's own rule (Windows 10 1809 or later,
// 64-bit; Arm PCs run it through Windows' emulation) and the models' (Best quality on 16 GB,
// Lighter on 8 GB, as on a Mac; about 2.8 GB to download). Everything about Windows lives
// here, so it changes in one place.
export const windows = {
  /** Said after "Windows" and its beta stamp, by every Download Iris. */
  status: '10 or 11',
  /** What a Windows PC needs. Empty says "to be announced". */
  requirements: [
    ['Windows', '10 or 11 (64-bit)'],
    ['Processor', 'Intel, AMD or Arm'],
    ['Memory', '8 GB works, 16 GB+ for best quality'],
    ['Storage', 'About 3 GB of free space'],
  ] as [string, string][],
  /** The Windows action under its requirements; null leaves it out. Never a second brush button. */
  action: null as { label: string; href: string } | null,
};

// ── The panel's example ───────────────────────────────────────────────────────────────
// The practice sentence from Iris's setup, and what each tone makes of it.
export const draft = 'hey, i have checked the draft and its look fine but one thing need to change before we send';
export const tones = [
  // Fix leaves your casual "hey" alone, as the app does.
  { name: 'Fix', text: 'hey, I have checked the draft and it looks fine, but one thing needs to change before we send it' },
  { name: 'Professional', text: 'Hi, I have reviewed the draft and it looks good, but one thing needs to change before we send it.' },
  { name: 'Friendly', text: 'Hey, I checked the draft and it looks great! Just one small thing to change before we send it.' },
  { name: 'Shorter', text: 'Draft looks fine. One change needed before sending.' },
  { name: 'Clearer', text: 'I checked the draft. It looks fine, but one thing needs to change before we send it.' },
] as const;

export { diff, type Seg } from './diff';

// ── What's new ────────────────────────────────────────────────────────────────────────
export type Issue = { no: number; version: string; title: string; date: string; headlines: { title: string; line: string }[]; also: string[] };
export function issues(): Issue[] {
  const text = readFileSync(path.resolve(import.meta.dirname ?? '.', '../src/content/Changelog.md'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const blocks = text.split(/^# /m).slice(1);
  const list = blocks.map((block) => {
    const [head, ...rest] = block.split('\n');
    const [version, title] = head.split(' · ').map((s) => s.trim());
    const body = rest.join('\n');
    const date = body.match(/^date:\s*(\S+)/m)?.[1] ?? '';
    const headlines = [...body.matchAll(/^## (.+)\n([^\n#-][^\n]*)/gm)].map((m) => ({ title: m[1].trim(), line: m[2].trim() }));
    const also = [...body.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
    return { no: 0, version, title, date, headlines, also };
  });
  list.forEach((issue, i) => (issue.no = list.length - i));
  return list;
}

export const month = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z');
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// ── ⌃ ⌥ G on the page itself ──────────────────────────────────────────────────────────
// Press the keys anywhere and Iris's panel opens on the paragraph you're reading. Fix finds
// nothing (the page is already fine: "looks good"); each tone is a version written by hand,
// because no model runs in the browser. Return puts it on the page; ⌘Z takes it back.
export const pressTones = ['Professional', 'Friendly', 'Shorter', 'Funny'] as const;
export const pageTones: Record<string, Record<(typeof pressTones)[number], string>> = {
  lede: {
    Professional: 'Runs 100% locally and stays free forever. No cloud connection required, works offline.',
    Friendly: '100% local on your computer and free forever, with no cloud needed and full offline support.',
    Shorter: '100% local. Free forever. Works offline.',
    Funny: '100% local, free forever, zero cloud, zero Wi-Fi needed. Your words never leave the building.',
  },



  private: {
    Professional: 'Iris runs its AI directly on your computer. Your text is never transmitted: there is no cloud service, no account, and no tracking. After a one-time setup download, it also works without Wi-Fi.',
    Friendly: 'Everything happens right on your computer, with no cloud, no account, and no tracking. After one quick download during setup, your words stay put and it works without Wi-Fi too.',
    Shorter: 'Runs directly on your computer. No cloud, no account, no tracking, and it works offline.',
    Funny: 'Iris lives on your computer and never leaves the house. No cloud, no account, no tracking. Turn off the Wi-Fi and it will not even notice.',
  },
  menu: {
    Professional: 'Iris sits quietly in your menu bar without a window or Dock icon. It runs only when called and sleeps automatically when idle to keep your Mac fast.',
    Friendly: 'Keep an eye on the little flower at the top of your screen. It only wakes up when you need it, then goes back to sleep so your Mac stays fast.',
    Shorter: 'A quiet flower in your menu bar. Runs when you call it, sleeps when you do not.',
    Funny: 'The flower in your menu bar is Iris’s mood ring. It wakes up when you need it, and naps so your Mac stays speedy when you do not.',
  },
  menuWin: {
    Professional: 'Iris sits quietly by the clock in your taskbar, with no window in your way; click it for Settings. It runs only when called and sleeps automatically when idle to keep your PC fast.',
    Friendly: 'Look for the little flower by the clock in your taskbar, and click it for Settings. It only wakes up when you need it, then goes back to sleep so your PC stays fast.',
    Shorter: 'A quiet flower by your clock. Runs when you call it, sleeps when you do not.',
    Funny: 'The flower by your clock is Iris’s mood ring. Click it for Settings. It wakes up when you need it, and naps so your PC stays speedy when you do not.',
  },
  whyWin: {
    Professional: 'Windows warns about apps without a paid code-signing certificate, and this free beta does not have one yet. Confirm Iris once; updates then install from inside Iris, checked against its own signature. The source code is public for anyone to verify.',
    Friendly: 'Windows is cautious about apps without a paid certificate, and this free beta skips it for now. Confirm it once, and updates install from inside Iris after that, checked by its own signature. The code is all public if you want a look.',
    Shorter: 'No paid certificate yet, so Windows asks once. Updates install from inside Iris, checked by its own signature. The code is public.',
    Funny: 'Windows likes apps with a paid certificate. Iris is free, so it asks you once instead. After that, updates check their own signature at the door. The code is public, if you like reading receipts.',
  },
  why: {
    Professional: 'Apple charges an annual fee to remove the first-time security prompt. Because Iris is completely free, we skip that fee. Confirm Iris once and your Mac remembers through future updates. The source code is public for anyone to verify.',
    Friendly: 'Apple charges a yearly fee to remove that first-time popup, and since Iris is free, we skip it. Confirm it once and your Mac remembers through every update. The code is all public if you want to take a look.',
    Shorter: 'Iris is free, so we skip Apple’s yearly fee. Confirm it once and it sticks through updates. The code is public.',
    Funny: 'Apple wants a yearly fee to vouch for apps. Iris is free, so we politely declined. Confirm it once and it remembers through every update. The code is public, if you like reading receipts.',
  },
};
