// The words and examples on the page that aren't written straight into a section.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const links = {
  download: 'https://github.com/imaxisXD/iris/releases/latest/download/Iris.zip',
  code: 'https://github.com/imaxisXD/iris',
  problem: 'https://github.com/imaxisXD/iris/issues/new',
  source: 'https://github.com/imaxisXD/iris#install',
};

// ── The panel's example ───────────────────────────────────────────────────────────────
// The practice sentence from Iris's setup, and what each tone makes of it.
export const draft = 'hey, i have checked the PR and its look fine but one thing need to change before merge';
export const tones = [
  { name: 'Fix', text: 'Hey, I have checked the PR and it looks fine, but one thing needs to change before merge' },
  { name: 'Professional', text: 'Hi, I have reviewed the PR and it looks good, but one thing needs to change before we merge.' },
  { name: 'Friendly', text: 'Hey, I checked the PR and it looks great. Just one small thing to change before we merge.' },
  { name: 'Shorter', text: 'PR looks fine. One change needed before merge.' },
  { name: 'Clearer', text: 'I checked the PR. It looks fine, but one thing needs to change before we merge.' },
] as const;

export type Seg = { kind: 'same' | 'gone' | 'new'; text: string };
/** Word by word, like Iris marks a change: removed words struck through, new ones in pink. */
export function diff(from: string, to: string): Seg[] {
  const tok = (s: string) => s.match(/[\w']+|[^\w\s]+/g) ?? [];
  const a = tok(from), b = tok(to);
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: Seg[] = [];
  const push = (kind: Seg['kind'], t: string) => {
    const last = out[out.length - 1];
    const glue = /^[^\w]/.test(t) ? '' : ' ';
    if (last && last.kind === kind) last.text += glue + t;
    else out.push({ kind, text: t });
  };
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) (push('same', a[i]), i++, j++);
    // Removed words come before the words that replace them, as Iris shows them.
    else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) (push('gone', a[i]), i++);
    else (push('new', b[j]), j++);
  }
  return out;
}

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
