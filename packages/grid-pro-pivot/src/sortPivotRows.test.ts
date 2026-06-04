// MOD-31 G-1 node spine — sortPivotRows. Runs via: node --experimental-strip-types (package "test").
// ★ 2-row-dimension fixture is mandatory: subtotals only exist with ≥2 row dims, and "subtotal stays
// anchored after sort" is the whole claim — a 1-row-dim fixture is the vacuous gate (no subtotal to
// misplace). The fixture mirrors computePivot's emit order (data… subtotal, data… subtotal, grandTotal)
// by hand so the test imports only sortPivotRows (type-only → strip-types clean; computePivot has
// runtime imports). Real computePivot output is exercised end-to-end by the chromium gate.
import { sortPivotRows } from './sortPivotRows.ts';
import type { PivotModel, PivotRow } from './types.ts';

const KEY = '__0';
const r = (over: Partial<PivotRow> & { __kind: PivotRow['__kind']; __id: string }): PivotRow =>
  ({ __depth: 0, ...over }) as PivotRow;

// region(East/West) × product — per-region subtotal + grand total.
const rows: PivotRow[] = [
  r({ __kind: 'data', __depth: 1, __id: '1', region: 'East', product: 'A', [KEY]: 30 }),
  r({ __kind: 'data', __depth: 1, __id: '2', region: 'East', product: 'B', [KEY]: 10 }),
  r({ __kind: 'data', __depth: 1, __id: '3', region: 'East', product: 'C', [KEY]: 20 }),
  r({ __kind: 'subtotal', __depth: 0, __id: '4', region: 'East', [KEY]: 60 }),
  r({ __kind: 'data', __depth: 1, __id: '5', region: 'West', product: 'A', [KEY]: 5 }),
  r({ __kind: 'data', __depth: 1, __id: '6', region: 'West', product: 'B', [KEY]: 50 }),
  r({ __kind: 'subtotal', __depth: 0, __id: '7', region: 'West', [KEY]: 55 }),
  r({ __kind: 'grandTotal', __depth: -1, __id: '8', [KEY]: 115 }),
];
const model: PivotModel = {
  config: { rows: ['region', 'product'], columns: [], values: [{ field: 'amount', aggregationFn: 'sum' }] },
  columnTree: [],
  columnLeafKeys: [KEY],
  rows,
};

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const kinds = (rs: PivotRow[]): string => rs.map((x) => x.__kind).join(',');

// fixture sanity (non-vacuous).
ok('fixture has subtotals (2-row-dim)', rows.some((x) => x.__kind === 'subtotal'));

// ── ascending: data sorted WITHIN segment, synthetic rows anchored ──
const asc = sortPivotRows(model, KEY, 'asc');
ok('asc: kind sequence unchanged (anchoring)', kinds(asc) === kinds(rows));
ok('asc: grandTotal still last', asc[asc.length - 1].__kind === 'grandTotal');
ok('asc: East group sorted B,C,A', JSON.stringify(asc.slice(0, 3).map((x) => x.product)) === JSON.stringify(['B', 'C', 'A']));
ok('asc: East subtotal anchored after its data', asc[3].__kind === 'subtotal' && asc[3].region === 'East');
ok('asc: West group sorted A,B', JSON.stringify([asc[4].product, asc[5].product]) === JSON.stringify(['A', 'B']));
ok('asc: West subtotal anchored', asc[6].__kind === 'subtotal' && asc[6].region === 'West');

// ── descending ──────────────────────────────────────────────────────
const desc = sortPivotRows(model, KEY, 'desc');
ok('desc: kind sequence unchanged', kinds(desc) === kinds(rows));
ok('desc: East group A,C,B', JSON.stringify(desc.slice(0, 3).map((x) => x.product)) === JSON.stringify(['A', 'C', 'B']));

// ── null cells sort to bottom of their segment ──────────────────────
const nulled: PivotModel = { ...model, rows: rows.map((x) => (x.__kind === 'data' && x.product === 'C' ? { ...x, [KEY]: null } : x)) };
const ascNull = sortPivotRows(nulled, KEY, 'asc');
ok('asc: null cell (C) sinks to group bottom', ascNull[2].product === 'C');
ok('asc: null does not displace subtotal', ascNull[3].__kind === 'subtotal');

console.log(`sortPivotRows spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
