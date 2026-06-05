// MOD-GRID-34 G-3 node spine — seriesFromMatrix. Runs via: node --experimental-strip-types.
// ★ Non-vacuous: orientation actually TRANSPOSES the grouping. 'columns' → one series per column
// (down the rows); 'rows' → one series per row (across columns). Charting the wrong axis is a
// silent, plausible bug — same numbers, wrong story. We assert both the series NAMES and the
// VALUES flip with orientation, plus the x-categories switch accordingly.
const assert = {
  ok(c: unknown, m?: string): void {
    if (!c) throw new Error(`assert.ok failed: ${m ?? ''}`);
  },
  equal(a: unknown, b: unknown, m?: string): void {
    if (a !== b) throw new Error(`assert.equal failed: ${String(a)} !== ${String(b)} ${m ?? ''}`);
  },
  deepEqual(a: unknown, b: unknown, m?: string): void {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`deepEqual failed: ${JSON.stringify(a)} vs ${JSON.stringify(b)} ${m ?? ''}`);
  },
};
import { seriesFromMatrix } from './seriesFromMatrix.ts';

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('  ok -', name);
};

// 2 regions × 3 quarters.
const categories = ['East', 'West']; // rows
const columns = ['Q1', 'Q2', 'Q3']; // cols
const matrix = [
  [10, 20, 30], // East
  [40, 50, 60], // West
];

test("orientation 'columns' → one series per quarter, values read down the regions", () => {
  const out = seriesFromMatrix({ categories, columns, matrix, orientation: 'columns' });
  assert.deepEqual(out.categories, ['East', 'West'], 'x = region labels');
  assert.deepEqual(out.series.map((s) => s.name), ['Q1', 'Q2', 'Q3']);
  // Q1 series = first column down the rows = [10,40]; Q3 = [30,60].
  assert.deepEqual(out.series[0].values, [10, 40]);
  assert.deepEqual(out.series[2].values, [30, 60]);
});

test("orientation 'rows' → one series per region, values read across the quarters", () => {
  const out = seriesFromMatrix({ categories, columns, matrix, orientation: 'rows' });
  assert.deepEqual(out.categories, ['Q1', 'Q2', 'Q3'], 'x = quarter labels');
  assert.deepEqual(out.series.map((s) => s.name), ['East', 'West']);
  // East series = first row = [10,20,30]; West = [40,50,60].
  assert.deepEqual(out.series[0].values, [10, 20, 30]);
  assert.deepEqual(out.series[1].values, [40, 50, 60]);
});

test('orientation flips the grouping (columns vs rows are genuinely transposed)', () => {
  const byCol = seriesFromMatrix({ categories, columns, matrix, orientation: 'columns' });
  const byRow = seriesFromMatrix({ categories, columns, matrix, orientation: 'rows' });
  assert.equal(byCol.series.length, 3, 'columns → 3 series');
  assert.equal(byRow.series.length, 2, 'rows → 2 series');
  assert.ok(byCol.categories[0] !== byRow.categories[0], 'x axis differs by orientation');
});

test('colors map to produced series by index', () => {
  const out = seriesFromMatrix({
    categories,
    columns,
    matrix,
    orientation: 'columns',
    colors: ['#111', '#222', '#333'],
  });
  assert.equal(out.series[1].color, '#222');
});

test('default orientation is columns', () => {
  const out = seriesFromMatrix({ categories, columns, matrix });
  assert.equal(out.series.length, 3);
  assert.deepEqual(out.series[0].values, [10, 40]);
});

console.log(`\n${n} seriesFromMatrix assertions passed.`);
