// MOD-GRID-36 G-2 node spine — computeChangedCells. Run: node --experimental-strip-types.
// ★ Non-vacuous, identity-based: a value EDIT flags exactly that cell; a REORDER of unchanged rows
// flags NOTHING (the whole point of diffing by getRowId, not index); a NEW row is not a "change";
// Object.is means NaN→NaN is not spurious. An index-based diff would flag every cell after a sort.
import { computeChangedCells, cellKey } from './computeChangedCells.ts';

let pass = 0,
  fail = 0;
const ok = (n: string, c: boolean): void => {
  if (c) pass++;
  else {
    fail++;
    console.log('  ❌', n);
  }
};
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

interface Row {
  sku: string;
  price: number;
  name: string;
}
const getRowId = (r: Row) => r.sku;
const columns = [
  { id: 'price', get: (r: Row) => r.price },
  { id: 'name', get: (r: Row) => r.name },
];
const base: Row[] = [
  { sku: 'A', price: 10, name: '사과' },
  { sku: 'B', price: 20, name: '바나나' },
  { sku: 'C', price: 30, name: '체리' },
];

// identical snapshots → no changes.
ok('no change when data is identical', eq(computeChangedCells({ prev: base, next: base, getRowId, columns }), []));

// one cell edited (B.price 20→25) → exactly that cell.
const edited = base.map((r) => (r.sku === 'B' ? { ...r, price: 25 } : r));
ok(
  'a value edit flags exactly that cell',
  eq(computeChangedCells({ prev: base, next: edited, getRowId, columns }), [cellKey('B', 'price')]),
);

// ★ reorder unchanged rows (C,A,B) → NO changes (identity diff, not position).
const reordered = [base[2], base[0], base[1]];
ok(
  'a pure reorder flags nothing (identity, not index)',
  eq(computeChangedCells({ prev: base, next: reordered, getRowId, columns }), []),
);

// reorder AND edit B.name in the moved row → only B.name flagged (identity tracked across the move).
const reorderedEdited = [base[2], base[0], { ...base[1], name: '바나나(수입)' }];
ok(
  'edit within a reordered row is still caught by id',
  eq(computeChangedCells({ prev: base, next: reorderedEdited, getRowId, columns }), [cellKey('B', 'name')]),
);

// new row Z → its cells are NOT flagged (addition, not change).
const withNew: Row[] = [{ sku: 'Z', price: 99, name: '신규' }, ...base];
ok(
  'a newly added row is not flagged as changed',
  eq(computeChangedCells({ prev: base, next: withNew, getRowId, columns }), []),
);

// two cells changed in one row → both flagged.
const twoEdits = base.map((r) => (r.sku === 'A' ? { ...r, price: 11, name: '청사과' } : r));
ok(
  'multiple changed cells in a row are all flagged',
  eq(new Set(computeChangedCells({ prev: base, next: twoEdits, getRowId, columns })), new Set([cellKey('A', 'price'), cellKey('A', 'name')])),
);

// Object.is: NaN→NaN is not a change.
const nanBase = [{ sku: 'A', price: NaN, name: 'x' }];
const nanNext = [{ sku: 'A', price: NaN, name: 'x' }];
ok('NaN→NaN is not a spurious change', eq(computeChangedCells({ prev: nanBase, next: nanNext, getRowId, columns }), []));

console.log(`\ncomputeChangedCells: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
