import * as stylex from '@stylexjs/stylex';

// Iris's riso inks, the same bytes as `Riso` in the app (DesignSystem.swift).
export const ink = stylex.defineVars({
  paper: 'rgb(255 252 249)',
  i1: '#F7F3F0',
  i2: '#F0EBE6',
  i3: '#E9E2DC',
  i4: '#E1D9D2',
  i8: '#A3958B',
  i9: '#84766D',
  i10: '#6B5F58',
  i11: '#4A403B',
  i12: 'rgb(42 26 22)',
  pink: 'rgb(240 134 176)',
  platePink: 'rgb(236 110 176)',
  pinkTint: 'rgb(252 228 238)',
  pinkText: 'rgb(142 36 83)',
  rose: 'rgb(170 102 124)',
  espresso: 'rgb(100 56 46)',
  red: 'rgb(217 67 46)',
  crema: 'rgb(226 200 185)',
  tan: 'rgb(196 157 122)',
  sky: 'rgb(120 162 220)',
  skyGhost: 'rgb(150 184 230)',
  khaki: 'rgb(226 218 196)',
  tape: '#E0D1BB',
  green: '#1E8C55',
  /** Green deep enough to read as small text: 5.7:1 on the Questions sheet, 4.9:1 on its open tint. */
  greenText: 'rgb(22 108 64)',
});

export const font = stylex.defineVars({
  mono: '"Martian Mono", "Martian Fallback", ui-monospace, monospace',
  brush: '"Caveat Brush", "Marker Felt", cursive',
  chunky: '"Londrina Solid", Impact, sans-serif',
  fat: 'Knewave, "Marker Felt", cursive',
  sketch: 'Mansalva, "Marker Felt", cursive',
  logo: '"Rubik Doodle Shadow", "Marker Felt", cursive',
});

// Paper and the riso screen, as tiles made by scripts/assets.mjs.
export const tex = stylex.defineVars({
  grain: 'url(/tex/grain.png)',
  paper: 'url(/tex/paper.png)',
  screen: 'url(/tex/screen.png)',
  streaks: 'url(/tex/streaks.png)',
  /** A shape's ink, as Iris's PrintedInk: pale inks, and dark ones with a lighter touch. */
  ink: 'url(/tex/ink.png)',
  inkDark: 'url(/tex/ink-dark.png)',
});
