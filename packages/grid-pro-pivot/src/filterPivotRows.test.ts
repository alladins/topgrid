// MOD-44 G-2 node spine — filterPivotRows. Runs via: node --experimental-strip-types (package "test").
// ★ 2-row-dimension fixture: the load-bearing claim is "filter a child → its subtotal value is UNCHANGED"
// (totals-over-all, NOT avg-of-avgs recompute). A 1-row-dim fixture (no subtotal) is the vacuous gate.
import { filterPivotRows } from './filterPivotRows.ts';
import type { PivotRow } from './types.ts';

const r = (over: Partial<PivotRow> & { __kind: PivotRow['__kind']; __id: string }): PivotRow =>
  ({ __depth: 0, ...over }) as PivotRow;

const fixture: PivotRow[] = [
  r({ __kind: 'data', __id: 'd1', __depth: 1, region: 'A', product: 'X', __0: 10 }),
  r({ __kind: 'data', __id: 'd2', __depth: 1, region: 'A', product: 'Y', __0: 20 }),
  r({ __kind: 'subtotal', __id: 's1', __depth: 0, region: 'A', __0: 30 }), // true-group A = 10+20
  r({ __kind: 'data', __id: 'd3', __depth: 1, region: 'B', product: 'Z', __0: 5 }),
  r({ __kind: 'subtotal', __id: 's2', __depth: 0, region: 'B', __0: 5 }),
  r({ __kind: 'grandTotal', __id: 'g', __depth: -1, __0: 35 }),
];

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const ids = (rows: PivotRow[]) => rows.map((x) => x.__id).join(',');

// predicate keeps data rows with __0 >= 15: drops d1(10) AND d3(5), keeps d2(20).
{
  const out = filterPivotRows(fixture, (row) => (row.__0 as number) >= 15);
  ok('filters data rows by predicate (d1,d3 dropped)', ids(out) === 'd2,s1,s2,g');
  // ★ subtotal s1 UNCHANGED (true-group = 30) even though its child d1 was filtered out.
  const s1 = out.find((x) => x.__id === 's1')!;
  ok('★ subtotal value unchanged after child filtered (totals-over-all, not avg-of-avgs)', s1.__0 === 30);
  // grandTotal also unchanged.
  ok('grandTotal unchanged (35)', out.find((x) => x.__id === 'g')!.__0 === 35);
  // all non-data rows preserved.
  ok('all subtotals + grandTotal preserved', out.filter((x) => x.__kind !== 'data').length === 3);
}

// predicate always true → echo.
ok('predicate true → echo', ids(filterPivotRows(fixture, () => true)) === 'd1,d2,s1,d3,s2,g');

// predicate always false → 0 data rows, synthetic rows remain.
{
  const out = filterPivotRows(fixture, () => false);
  ok('predicate false → data 0, synthetic rows remain', ids(out) === 's1,s2,g' && out.every((x) => x.__kind !== 'data'));
}

// immutability.
ok('input not mutated', ids(fixture) === 'd1,d2,s1,d3,s2,g');

console.log(`filterPivotRows spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
