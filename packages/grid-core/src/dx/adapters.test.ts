// W3-4 node spine — toGridCell / toGridFilterColumn. Run: node --experimental-strip-types src/dx/adapters.test.ts
import { toGridCell, toGridFilterColumn } from './adapters.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface User { id: number; name: string }
const user: User = { id: 7, name: '김철수' };

// toGridCell: pulls a clean {rowId, columnId, value, row} from a TanStack-Cell-shaped object.
const cell = {
  row: { id: '7', original: user },
  column: { id: 'name' },
  getValue: () => '김철수',
};
const gc = toGridCell<User>(cell);
ok('rowId', gc.rowId === '7');
ok('columnId', gc.columnId === 'name');
ok('value', gc.value === '김철수');
ok('row is original ref', gc.row === user);

// toGridFilterColumn: normalises getFilterValue/setFilterValue → value/setValue.
let stored: unknown = 'init';
const col = {
  id: 'age',
  getFilterValue: () => stored,
  setFilterValue: (v: unknown) => { stored = v; },
};
const gf = toGridFilterColumn(col);
ok('filter id', gf.id === 'age');
ok('filter value (read)', gf.value === 'init');
gf.setValue('30');
ok('filter setValue writes through', stored === '30');

console.log(`dx adapters spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
