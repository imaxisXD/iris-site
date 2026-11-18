// The words and examples on the page that aren't written straight into a section.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const links = {
  download: 'https://github.com/imaxisXD/iris/releases/latest/download/Iris.zip',
  code: 'https://github.com/imaxisXD/iris',
  problem: 'https://github.com/imaxisXD/iris/issues/new',
  source: 'https://github.com/imaxisXD/iris#install',
};

// ── Windows ───────────────────────────────────────────────────────────────────────────
// Iris's interface is being rebuilt in GPUI so it can run on Windows, and its models come as
// GGUF for Windows too (Hugging Face, ImAXISOG/iris-gemma-4-*-it-gguf), but there's no Windows
// download yet. So the page says Windows is coming, as a beta, and what it will need: the memory
// is the models' own rule (Best quality on 16 GB, Lighter on 8 GB, as on a Mac); Windows 10 or
// 11, 64-bit, is what GPUI runs on; Intel or AMD only until an Arm build has been tried.
// Everything about Windows lives here, so it changes in one place when the beta is out.
export const windows = {
  /** Said after "Windows" and its beta stamp, by every Download Iris. */
  status: 'coming soon',
  /** What a Windows PC needs. Empty says "to be announced". */
  requirements: [
    ['Windows', '10 or 11, 64-bit'],
    ['Processor', 'Intel or AMD'],
    ['Memory', 'Best quality from 16 GB, Lighter with 8 GB'],
    ['Disk', 'About 5 GB for the model'],
  ] as [string, string][],
  /** The Windows action under its requirements; null leaves it out. Never a second brush button. */
  action: { label: 'Follow it on GitHub', href: links.code } as { label: string; href: string } | null,
};

// ── The panel's example ───────────────────────────────────────────────────────────────
// The practice sentence from Iris's setup, and what each tone makes of it.
export const draft = 'hey, i have checked the PR and its look fine but one thing need to change before merge';
export const tones = [
  // Fix leaves your casual "hey" alone, as the app does.
  { name: 'Fix', text: 'hey, I have checked the PR and it looks fine, but one thing needs to change before merge' },
  { name: 'Professional', text: 'Hi, I have reviewed the PR and it looks good, but one thing needs to change before we merge.' },
  { name: 'Friendly', text: 'Hey, I checked the PR and it looks great. Just one small thing to change before we merge.' },
  { name: 'Shorter', text: 'PR looks fine. One change needed before merge.' },
  { name: 'Clearer', text: 'I checked the PR. It looks fine, but one thing needs to change before we merge.' },
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
    Professional: 'Grammar correction and tone adjustment in every Mac application.',
    Friendly: 'Help with your grammar and tone, in every app on your Mac.',
    Shorter: 'Grammar and tone, everywhere on your Mac.',
    Funny: 'Grammar and tone in every app on your Mac. Yes, even that one.',
  },



  private: {
    Professional: 'The language model runs locally on your Mac using Apple’s MLX. Your text is never transmitted: there is no account, no cloud service and no tracking. Once the model is downloaded, Iris also works offline.',
    Friendly: 'Everything happens right on your Mac, with Apple’s MLX. Your words never go anywhere: no account, no cloud, no tracking. Once the model’s in, Iris works offline too.',
    Shorter: 'It all runs on your Mac. No account, no cloud, no tracking, and it works offline.',
    Funny: 'The model lives on your Mac and never leaves the house. No account, no cloud, no tracking. Turn off the Wi-Fi and it won’t even notice.',
  },
  menu: {
    Professional: 'The menu bar icon shows Iris’s current status. Iris loads the model when it is needed and releases its memory automatically after a period of inactivity.',
    Friendly: 'Keep an eye on the little flower in your menu bar: it shows what Iris is up to. It wakes the model when you need it and gives the memory back by itself when you step away.',
    Shorter: 'The menu bar flower shows what Iris is doing. It loads the model when needed and frees the memory when idle.',
    Funny: 'The flower in your menu bar is Iris’s mood ring. It wakes the model when you need it, and naps to give your memory back when you don’t.',
  },
  why: {
    Professional: 'Apple charges an annual fee to notarize apps. Because Iris is free, it is not notarized. Every release is signed with the same certificate, so you confirm and allow Iris once, and both settings persist through updates. The full source code is public for review.',
    Friendly: 'Apple charges a yearly fee to vouch for apps, and since Iris is free, it skips that. Every release is signed with the same certificate, so you only confirm and allow it once, and it sticks through updates. The code’s all public if you want a look.',
    Shorter: 'Iris is free, so it skips Apple’s yearly fee. Confirm it once and it sticks through updates. The code is public.',
    Funny: 'Apple wants a yearly fee to vouch for apps. Iris is free, so it politely declined. Confirm it once and it remembers through every update. The code is public, if you like reading receipts.',
  },
};
