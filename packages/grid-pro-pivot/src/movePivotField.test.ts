// MOD-64 G-1 node — movePivotField. Runs via: node --experimental-strip-types.
import { movePivotField } from './movePivotField.ts';
import type { PivotConfig } from './types.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

const base: PivotConfig = {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'sales', aggregationFn: 'sum' }],
};
const J = (x: unknown): string => JSON.stringify(x);

// 1) available field → rows (added at end).
const r1 = movePivotField(base, 'city', 'rows');
ok('available→rows: appended', J(r1.rows) === J(['region', 'city']));
ok('available→rows: columns/values untouched', J(r1.columns) === J(['quarter']) && r1.values.length === 1);

// 2) rows field → columns (removed from rows, added to columns).
const r2 = movePivotField(base, 'region', 'columns');
ok('rows→columns: removed from rows', J(r2.rows) === J([]));
ok('rows→columns: appended to columns', J(r2.columns) === J(['quarter', 'region']));

// 3) available field → values (default aggregationFn 'sum').
const r3 = movePivotField(base, 'amount', 'values');
ok('→values: appended', r3.values.length === 2 && r3.values[1].field === 'amount');
ok('→values: default aggregationFn sum', r3.values[1].aggregationFn === 'sum');

// 4) field → available (removed from every zone, added nowhere).
const r4 = movePivotField(base, 'region', 'available');
ok('→available: removed from rows', J(r4.rows) === J([]));
ok('→available: not added anywhere', r4.columns.length === 1 && r4.values.length === 1);

// 5) values→values direct re-drop preserves the measure def (custom fn/label survive a same-zone drop).
//    NOTE: once a measure LEAVES values (→ rows/available), its def is gone from the config — there is
//    nowhere to store an aggregationFn for a non-values field; returning it to values yields the 'sum'
//    default. That round-trip loss is the honest semantics (see test 5b), not preservation.
const labelled: PivotConfig = {
  rows: [], columns: [],
  values: [{ field: 'sales', aggregationFn: 'avg', label: 'Mean Sales' }],
};
const redrop = movePivotField(labelled, 'sales', 'values');  // sales values → values (reorder-to-end)
ok('values→values re-drop: def (avg+label) preserved', redrop.values[0].aggregationFn === 'avg' && redrop.values[0].label === 'Mean Sales');
// 5b) round-trip through another zone drops the agg memory → 'sum' default (documented limitation).
const out = movePivotField(labelled, 'sales', 'rows');       // sales → rows (leaves values, def lost)
const back = movePivotField(out, 'sales', 'values');         // sales → values again (fresh def)
ok('round-trip via rows → values: agg resets to sum (no external memory)', back.values[0].aggregationFn === 'sum' && back.values[0].label === undefined);

// 6) moving a field not present anywhere = no-op except the add.
const r6 = movePivotField(base, 'ghost', 'available');
ok('unknown field → available: identity-ish', J(r6.rows) === J(['region']) && J(r6.columns) === J(['quarter']) && r6.values.length === 1);

// 7) original config never mutated.
ok('original not mutated', J(base.rows) === J(['region']) && J(base.columns) === J(['quarter']) && base.values.length === 1);

// 8) re-drop into the SAME zone moves field to end (rows reorder-to-end semantics).
const multi: PivotConfig = { rows: ['region', 'city'], columns: [], values: [] };
const r8 = movePivotField(multi, 'region', 'rows');
ok('same-zone re-drop: region moved to end', J(r8.rows) === J(['city', 'region']));

console.log(`movePivotField: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
