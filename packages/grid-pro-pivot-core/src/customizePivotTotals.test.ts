// MOD-44 G-1 node spine — customizePivotTotals. Runs via: node --experimental-strip-types (package "test").
// ★ 2-row-dimension fixture (subtotals only exist with ≥2 row dims) — mirrors computePivot emit order by hand
// (type-only import → strip-types clean; computePivot has runtime imports, exercised end-to-end elsewhere).
import { customizePivotTotals } from './customizePivotTotals.ts';
import type { PivotRow } from './types.ts';

const r = (over: Partial<PivotRow> & { __kind: PivotRow['__kind']; __id: string }): PivotRow =>
  ({ __depth: 0, ...over }) as PivotRow;

// region(A: X,Y / B: Z) × value __0. emit order: data… subtotal, data… subtotal, grandTotal.
const fixture: PivotRow[] = [
  r({ __kind: 'data', __id: 'd1', __depth: 1, region: 'A', product: 'X', __0: 10 }),
  r({ __kind: 'data', __id: 'd2', __depth: 1, region: 'A', product: 'Y', __0: 20 }),
  r({ __kind: 'subtotal', __id: 's1', __depth: 0, region: 'A', __0: 30 }),
  r({ __kind: 'data', __id: 'd3', __depth: 1, region: 'B', product: 'Z', __0: 5 }),
  r({ __kind: 'subtotal', __id: 's2', __depth: 0, region: 'B', __0: 5 }),
  r({ __kind: 'grandTotal', __id: 'g', __depth: -1, __0: 35 }),
];

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const ids = (rows: PivotRow[]) => rows.map((x) => x.__id).join(',');

// default = echo (same kinds/order/length).
ok('default echo (no opts) preserves all', ids(customizePivotTotals(fixture)) === 'd1,d2,s1,d3,s2,g');

// suppress subtotals → data + grandTotal only.
ok('subtotals:false removes subtotal rows', ids(customizePivotTotals(fixture, { subtotals: false })) === 'd1,d2,d3,g');
{
  const out = customizePivotTotals(fixture, { subtotals: false });
  ok('  …data + grandTotal kinds remain', out.every((x) => x.__kind !== 'subtotal') && out.length === 4);
}

// suppress grandTotal → no grandTotal row.
ok('grandTotal:false removes grandTotal row', ids(customizePivotTotals(fixture, { grandTotal: false })) === 'd1,d2,s1,d3,s2');

// position top → grandTotal first, rest order preserved.
ok('grandTotalPosition:top moves grand to front', ids(customizePivotTotals(fixture, { grandTotalPosition: 'top' })) === 'g,d1,d2,s1,d3,s2');

// combined: suppress subtotals + grand top.
ok('combined subtotals:false + top', ids(customizePivotTotals(fixture, { subtotals: false, grandTotalPosition: 'top' })) === 'g,d1,d2,d3');

// suppress both → data only.
ok('subtotals:false + grandTotal:false = data only', ids(customizePivotTotals(fixture, { subtotals: false, grandTotal: false })) === 'd1,d2,d3');

// immutability: input not mutated.
ok('input not mutated', ids(fixture) === 'd1,d2,s1,d3,s2,g');

console.log(`customizePivotTotals spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
