// Written by scripts/fable-flower.mjs: Iris's flower printed part by part, a port of the app's
// rig (IrisRig.swift). Sizes are in the sheet's pixels, `scale` of them to a point of the rig;
// `origin` is the point a part grows from, in its own picture; `angle` is the way it points
// when the bloom is open; `sheet` is where it is on public/fable/flower.webp.
export const flower = {
  scale: 3.125,
  stem: 70,
  sheet: { src: '/fable/flower.webp', width: 420, height: 426 },
  parts: {
    'ground-back': { width: 270, height: 54, origin: [132.8, 49.8], angle: 0, sheet: [0, 334] },
    'ground': { width: 242, height: 36, origin: [120, 19.6], angle: 0, sheet: [0, 390] },
    'leaf': { width: 49, height: 189, origin: [44.3, 184.8], angle: -10, sheet: [20, 0] },
    'stem': { width: 18, height: 233, origin: [8.8, 224.3], angle: 0, sheet: [0, 0] },
    'back-1': { width: 67, height: 113, origin: [35.4, 105.2], angle: -96, sheet: [262, 0] },
    'back-2': { width: 65, height: 115, origin: [31.4, 111.2], angle: 96, sheet: [195, 0] },
    'heart': { width: 73, height: 68, origin: [32, 30], angle: 0, sheet: [270, 235] },
    'standard-2': { width: 50, height: 97, origin: [15.5, 87.4], angle: -70, sheet: [331, 0] },
    'standard-4': { width: 56, height: 93, origin: [34.5, 88.4], angle: 70, sheet: [159, 235] },
    'standard-1': { width: 42, height: 94, origin: [14.8, 83.8], angle: -35, sheet: [61, 235] },
    'standard-5': { width: 51, height: 88, origin: [27.8, 83.8], angle: 35, sheet: [217, 235] },
    'standard-3': { width: 52, height: 94, origin: [23.5, 87.4], angle: 0, sheet: [105, 235] },
    'fall-1': { width: 64, height: 132, origin: [28.7, 128.1], angle: -122, sheet: [129, 0] },
    'fall-3': { width: 56, height: 140, origin: [35.7, 136.1], angle: 122, sheet: [71, 0] },
    'fall-2': { width: 59, height: 97, origin: [31.7, 92.4], angle: 180, sheet: [0, 235] },
    'throat': { width: 21, height: 20, origin: [10.8, 11.9], angle: 0, sheet: [244, 390] },
  },
} as const;
export type FlowerPart = keyof typeof flower.parts;
