// MOD-31 G-2 node spine — collapsePivotRows. Runs via: node --experimental-strip-types.
// ★ 2-row-dim fixture (subtotals exist). Asserts: collapse hides a group's descendant data, the
// subtotal survives as the group representative, grandTotal untouched — AND that collapse composes
// with sort: collapse(sort(rows)) hides the SAME rows (the advisor forward note — isolated passing
// while the chained wiring breaks is the trap).
import { collapsePivotRows } from './collapsePivotRows.ts';
import { sortPivotRows } from './sortPivotRows.ts';
import type { PivotModel, PivotRow } from './types.ts';

const KEY = '__0';
const r = (over: Partial<PivotRow> & { __kind: PivotRow['__kind']; __id: string }): PivotRow =>
  ({ __depth: 0, ...over }) as PivotRow;

// region(East: NY,Boston / West: LA) — East subtotal __id 's4', West 's7', grandTotal 's8'.
const rows: PivotRow[] = [
  r({ __kind: 'data', __depth: 1, __id: 's1', region: 'East', product: 'NY', [KEY]: 300 }),
  r({ __kind: 'data', __depth: 1, __id: 's2', region: 'East', product: 'Boston', [KEY]: 90 }),
  r({ __kind: 'subtotal', __depth: 0, __id: 's4', region: 'East', [KEY]: 390 }),
  r({ __kind: 'data', __depth: 1, __id: 's5', region: 'West', product: 'LA', [KEY]: 160 }),
  r({ __kind: 'subtotal', __depth: 0, __id: 's7', region: 'West', [KEY]: 160 }),
  r({ __kind: 'grandTotal', __depth: -1, __id: 's8', [KEY]: 550 }),
];
const model: PivotModel = {
  config: { rows: ['region', 'product'], columns: [], values: [{ field: 'amount', aggregationFn: 'sum' }] },
  columnTree: [], columnLeafKeys: [KEY], rows,
};

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const ids = (rs: PivotRow[]): string => rs.map((x) => x.__id).join(',');

// no collapse → identity.
ok('empty collapsedIds → identity', collapsePivotRows(rows, new Set()).length === rows.length);

// collapse East → East's 2 data rows hidden; East subtotal + West + grandTotal remain.
const collapsedEast = collapsePivotRows(rows, new Set(['s4']));
ok('collapse East: 2 data rows hidden', collapsedEast.length === 4);
ok('collapse East: East data gone', !collapsedEast.some((x) => x.__id === 's1' || x.__id === 's2'));
ok('collapse East: East subtotal survives (representative)', collapsedEast.some((x) => x.__id === 's4'));
ok('collapse East: West group untouched', collapsedEast.some((x) => x.__id === 's5'));
ok('collapse East: grandTotal last & present', collapsedEast[collapsedEast.length - 1].__id === 's8');

// collapse both → only the 2 subtotals + grandTotal.
const both = collapsePivotRows(rows, new Set(['s4', 's7']));
ok('collapse both: only subtotals + grandTotal', ids(both) === 's4,s7,s8');

// re-expand (remove from set) → full restore.
ok('expand (empty set) → restored', collapsePivotRows(rows, new Set()).length === 6);

// ★ COMPOSITION: collapse(sort(rows)) hides the same group regardless of sort order.
const sorted = sortPivotRows(model, KEY, 'asc'); // East: Boston(90),NY(300) reordered, subtotals anchored
ok('sort kept East data before its subtotal', sorted[2].__id === 's4'); // subtotal still at idx 2
const chained = collapsePivotRows(sorted, new Set(['s4']));
ok('chain: collapse after sort still hides East data', chained.length === 4 && !chained.some((x) => x.__id === 's1' || x.__id === 's2'));
ok('chain: East subtotal still present', chained.some((x) => x.__id === 's4'));

// ── ★ 3-row-dim: exercises the backward-scan's nesting branches (parent collapse hides intermediate
// child subtotals; child collapse leaves sibling subtotals). 2-dim fixtures never run these.
// region × city × product (emit: children before subtotal, depth 2→1→0).
const d3rows: PivotRow[] = [
  r({ __kind: 'data', __depth: 2, __id: 'a1', region: 'East', city: 'NY', product: 'A', [KEY]: 1 }),
  r({ __kind: 'data', __depth: 2, __id: 'a2', region: 'East', city: 'NY', product: 'B', [KEY]: 2 }),
  r({ __kind: 'subtotal', __depth: 1, __id: 'sNY', region: 'East', city: 'NY', [KEY]: 3 }),
  r({ __kind: 'data', __depth: 2, __id: 'a3', region: 'East', city: 'Boston', product: 'A', [KEY]: 4 }),
  r({ __kind: 'subtotal', __depth: 1, __id: 'sBos', region: 'East', city: 'Boston', [KEY]: 4 }),
  r({ __kind: 'subtotal', __depth: 0, __id: 'sEast', region: 'East', [KEY]: 7 }),
  r({ __kind: 'data', __depth: 2, __id: 'a4', region: 'West', city: 'LA', product: 'A', [KEY]: 5 }),
  r({ __kind: 'subtotal', __depth: 1, __id: 'sLA', region: 'West', city: 'LA', [KEY]: 5 }),
  r({ __kind: 'subtotal', __depth: 0, __id: 'sWest', region: 'West', [KEY]: 5 }),
  r({ __kind: 'grandTotal', __depth: -1, __id: 'gt', [KEY]: 12 }),
];

// parent (depth-0) collapse hides ALL East descendants — including the intermediate child subtotals.
const collParent = collapsePivotRows(d3rows, new Set(['sEast']));
ok('3-dim parent collapse: intermediate child subtotals hidden too', !collParent.some((x) => x.__id === 'sNY' || x.__id === 'sBos'));
ok('3-dim parent collapse: East data hidden', !collParent.some((x) => ['a1', 'a2', 'a3'].includes(x.__id)));
ok('3-dim parent collapse: East subtotal survives', collParent.some((x) => x.__id === 'sEast'));
ok('3-dim parent collapse: West group + grandTotal intact', ids(collParent) === 'sEast,a4,sLA,sWest,gt');

// child (depth-1) collapse hides only that child's data; sibling child subtotal remains.
const collChild = collapsePivotRows(d3rows, new Set(['sNY']));
ok('3-dim child collapse: only NY data hidden', !collChild.some((x) => x.__id === 'a1' || x.__id === 'a2'));
ok('3-dim child collapse: NY subtotal survives', collChild.some((x) => x.__id === 'sNY'));
ok('3-dim child collapse: sibling Boston (data + subtotal) intact', collChild.some((x) => x.__id === 'a3') && collChild.some((x) => x.__id === 'sBos'));
ok('3-dim child collapse: parent East subtotal intact', collChild.some((x) => x.__id === 'sEast'));

console.log(`collapsePivotRows spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
