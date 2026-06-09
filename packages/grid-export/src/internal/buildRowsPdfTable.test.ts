// MOD-73 node spine — buildRowsPdfTable pure head/body construction.
// Run: node --experimental-strip-types src/internal/buildRowsPdfTable.test.ts
import { buildRowsPdfTable } from './buildRowsPdfTable.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface Row extends Record<string, unknown> { id: number; name: string; note: unknown }
const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '이름' },
  { key: 'note', header: '비고' },
];
const rows: Row[] = [
  { id: 1, name: 'Alice', note: 'ok' },
  { id: 2, name: 'Bob', note: null },
];

const { head, body } = buildRowsPdfTable(rows, columns);

ok('single header row', head.length === 1);
ok('head columns', JSON.stringify(head[0]) === JSON.stringify(['ID', '이름', '비고']));
ok('body row count', body.length === 2);
ok('body row 1 stringified', JSON.stringify(body[0]) === JSON.stringify(['1', 'Alice', 'ok']));
ok('body null cell → empty string', JSON.stringify(body[1]) === JSON.stringify(['2', 'Bob', '']));

const empty = buildRowsPdfTable([], columns);
ok('empty rows → header only, no body', empty.head.length === 1 && empty.body.length === 0);

console.log(`\nbuildRowsPdfTable: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
