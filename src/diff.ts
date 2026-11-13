// Word by word, the way Iris marks a change. Shared by the page (Panel.tsx's Marks, at build
// time) and its script (client.ts, the ⌃ ⌥ G panel), so it imports nothing.
export type Seg = { kind: 'same' | 'gone' | 'new'; text: string };
/** Word by word, like Iris marks a change: removed words struck through, new ones in pink. */
export function diff(from: string, to: string): Seg[] {
  const tok = (s: string) => s.match(/[\w'’]+|[^\w\s]+/g) ?? []; // ’ keeps a word whole (it’s, don’t)
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
