// MOD-GRID-34 G-1 node spine — chartScale. Runs via: node --experimental-strip-types.
// ★ Non-vacuous claims (each catches a real bug, not "it returns a number"):
//   - max value → TOP pixel (smallest y), min → BOTTOM pixel (largest y)   [inverted-axis bug]
//   - N data points → N coordinates, evenly spaced, in plot bounds          [off-by-one / drift]
//   - niceTicks are ROUND, ascending, span the domain                        [ugly/!covering axis]
//   - non-finite values leave a GAP, never shift later points left           [silent index shift]
// Local assert (no node:assert import → no @types/node needed for typecheck; matches pivot tests).
const assert = {
  ok(cond: unknown, msg?: string): void {
    if (!cond) throw new Error(`assert.ok failed: ${msg ?? ''}`);
  },
  equal(a: unknown, b: unknown, msg?: string): void {
    if (a !== b) throw new Error(`assert.equal failed: ${String(a)} !== ${String(b)} ${msg ?? ''}`);
  },
  deepEqual(a: unknown, b: unknown, msg?: string): void {
    if (JSON.stringify(a) !== JSON.stringify(b))
      throw new Error(`assert.deepEqual failed: ${JSON.stringify(a)} !== ${JSON.stringify(b)} ${msg ?? ''}`);
  },
};
import {
  linearScale,
  niceTicks,
  bandScale,
  computeChartGeometry,
  type ChartSeries,
} from './chartScale.ts';

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('  ok -', name);
};

// ── linearScale ──────────────────────────────────────────────────────────────
test('linearScale maps domain ends to range ends, midpoint to midpoint', () => {
  const s = linearScale([0, 100], [0, 200]);
  assert.equal(s(0), 0);
  assert.equal(s(100), 200);
  assert.equal(s(50), 100);
});

test('linearScale flat domain → range midpoint (no divide-by-zero)', () => {
  const s = linearScale([5, 5], [10, 30]);
  assert.equal(s(5), 20);
  assert.equal(s(999), 20);
});

// ── niceTicks ────────────────────────────────────────────────────────────────
test('niceTicks are round, ascending, and span the domain', () => {
  const t = niceTicks(0, 95, 5);
  assert.deepEqual(t, [0, 20, 40, 60, 80, 100]);
  assert.ok(t[0] <= 0 && t[t.length - 1] >= 95, 'spans [0,95]');
});

test('niceTicks flat input → single tick; non-finite → empty', () => {
  assert.deepEqual(niceTicks(7, 7), [7]);
  assert.deepEqual(niceTicks(NaN, 10), []);
});

test('niceTicks fractional domain stays round (no float drift)', () => {
  // 0..1 in 5 → step 0.2; must NOT be 0.30000000000000004 etc.
  assert.deepEqual(niceTicks(0, 1, 5), [0, 0.2, 0.4, 0.6, 0.8, 1]);
});

// ── bandScale ────────────────────────────────────────────────────────────────
test('bandScale centres are evenly spaced and inside the range', () => {
  const b = bandScale(4, [0, 400]);
  assert.equal(b.count, 4);
  assert.deepEqual([b.center(0), b.center(1), b.center(2), b.center(3)], [50, 150, 250, 350]);
  // equal spacing
  assert.equal(b.center(1) - b.center(0), b.center(2) - b.center(1));
  // bar fits inside its slot (bandwidth < step)
  assert.ok(b.bandwidth < 100 && b.bandwidth > 0);
});

// ── computeChartGeometry (the integration spine) ──────────────────────────────
const SERIES: ChartSeries[] = [{ name: 'rev', values: [10, 50, 30, 90] }];
const GEO = computeChartGeometry(SERIES, { width: 200, height: 120 });

test('N data points produce N coordinates', () => {
  assert.equal(GEO.series[0].points.length, 4);
});

test('max value maps to the TOP pixel, min toward the bottom (axis not inverted)', () => {
  const pts = GEO.series[0].points;
  const maxPt = pts.find((p) => p.value === 90)!;
  const minPt = pts.find((p) => p.value === 10)!;
  // top of plot = smaller y. max must be higher (smaller y) than min.
  assert.ok(maxPt.y < minPt.y, `max y ${maxPt.y} should be < min y ${minPt.y}`);
  // max sits at/above plot.top tick edge; nothing escapes the plot box.
  for (const p of pts) {
    assert.ok(p.y >= GEO.plot.top - 0.001 && p.y <= GEO.plot.bottom + 0.001, `y ${p.y} in bounds`);
    assert.ok(p.x >= GEO.plot.left && p.x <= GEO.plot.right, `x ${p.x} in bounds`);
  }
});

test('x positions are strictly increasing with index (left→right order preserved)', () => {
  const xs = GEO.series[0].points.map((p) => p.x);
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1], 'x ascending');
});

test('non-finite value leaves a gap — later points keep their slot (no left-shift)', () => {
  const geo = computeChartGeometry([{ name: 's', values: [10, NaN, 30] }], {
    width: 200,
    height: 120,
  });
  const pts = geo.series[0].points;
  assert.equal(pts.length, 2, 'NaN dropped');
  // the surviving points keep indices 0 and 2 (NOT compacted to 0,1).
  assert.deepEqual(pts.map((p) => p.index), [0, 2]);
  // and index-2 point sits in band-2's x, not band-1's.
  assert.equal(pts[1].x, geo.xBand.center(2));
});

test('all-positive data includes 0 baseline so bars read from zero', () => {
  // domain min should be clamped to 0 (yTicks start at 0) for ≥0 data.
  assert.equal(GEO.yTicks[0], 0);
});

test('mixed-sign data straddles a 0 baseline (negatives below, positives above)', () => {
  // ★ LESS-006 close-out: the bar code hangs bars from yScale(0); prove the geometry actually
  // puts 0 between the values so a negative bar can render BELOW the baseline.
  const geo = computeChartGeometry([{ name: 's', values: [-30, 50] }], { width: 200, height: 120 });
  assert.ok(geo.yTicks.includes(0), 'domain spans 0');
  const y0 = geo.yScale(0);
  const yNeg = geo.series[0].points.find((p) => p.value === -30)!.y;
  const yPos = geo.series[0].points.find((p) => p.value === 50)!.y;
  assert.ok(yNeg > y0, 'negative value sits below baseline (larger y)');
  assert.ok(yPos < y0, 'positive value sits above baseline (smaller y)');
});

console.log(`\n${n} chartScale assertions passed.`);
