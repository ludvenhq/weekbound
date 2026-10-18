// The contour map (DESIGN.md, Overview), from the approved preview: seeded value noise in three
// octaves, cut at six heights by marching squares into line segments. Everything is seeded, so
// the map is the same on every visit and in every browser.

// A small seeded random number generator: the same seed gives the same numbers everywhere.
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 256;
const grid = (() => {
  const random = mulberry32(1987);
  const values = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < values.length; i++) values[i] = random();
  return values;
})();

function at(x: number, y: number): number {
  return grid[(y & 255) * SIZE + (x & 255)]!;
}

function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = at(xi, yi);
  const b = at(xi + 1, yi);
  const c = at(xi, yi + 1);
  const d = at(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function elevation(x: number, y: number): number {
  return (noise(x, y) + 0.5 * noise(x * 2.1, y * 2.1) + 0.25 * noise(x * 4.3, y * 4.3)) / 1.75;
}

// For each corner pattern (top left 8, top right 4, bottom right 2, bottom left 1), the pairs of
// cell edges a line joins: 0 top, 1 right, 2 bottom, 3 left.
const CASES: readonly (readonly [number, number])[][] = [
  [],
  [[3, 2]],
  [[2, 1]],
  [[3, 1]],
  [[0, 1]],
  [
    [3, 0],
    [2, 1],
  ],
  [[0, 2]],
  [[3, 0]],
  [[3, 0]],
  [[0, 2]],
  [
    [3, 2],
    [0, 1],
  ],
  [[0, 1]],
  [[3, 1]],
  [[2, 1]],
  [[3, 2]],
  [],
];

const LEVELS = [0.36, 0.42, 0.48, 0.54, 0.6, 0.66];
const SCALE = 340;

export type Segment = [number, number, number, number];
export type Level = { major: boolean; segments: Segment[] };

// The contour lines over a width by height area in CSS pixels, sampled every `step` pixels.
export function contourSegments(width: number, height: number, step: number): Level[] {
  const cols = Math.ceil(width / step) + 1;
  const rows = Math.ceil(height / step) + 1;
  const field = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let k = 0; k < cols; k++) {
      field[j * cols + k] = elevation((k * step) / SCALE + 3.7, (j * step) / SCALE + 1.3);
    }
  }
  return LEVELS.map((level, index) => {
    const segments: Segment[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let k = 0; k < cols - 1; k++) {
        const tl = field[j * cols + k]!;
        const tr = field[j * cols + k + 1]!;
        const br = field[(j + 1) * cols + k + 1]!;
        const bl = field[(j + 1) * cols + k]!;
        const pattern =
          (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
        const pairs = CASES[pattern]!;
        if (pairs.length === 0) continue;
        const x = k * step;
        const y = j * step;
        const edges: [number, number][] = [
          [x + (step * (level - tl)) / (tr - tl), y],
          [x + step, y + (step * (level - tr)) / (br - tr)],
          [x + (step * (level - bl)) / (br - bl), y + step],
          [x, y + (step * (level - tl)) / (bl - tl)],
        ];
        for (const [from, to] of pairs) {
          const a = edges[from]!;
          const b = edges[to]!;
          segments.push([a[0], a[1], b[0], b[1]]);
        }
      }
    }
    return { major: index % 3 === 1, segments };
  });
}
