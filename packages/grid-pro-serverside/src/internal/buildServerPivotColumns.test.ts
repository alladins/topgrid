// MOD-67 G-1 node spine — buildServerPivotColumns. Run: node --experimental-strip-types buildServerPivotColumns.test.ts
import { buildServerPivotColumns, type ServerPivotColumn } from './buildServerPivotColumns.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };
const J = (x: unknown) => JSON.stringify(x);

// 1) single dimension: East|sales, East|units, West|sales → 2 groups, 2/1 leaves.
const c1 = buildServerPivotColumns(['East|sales', 'East|units', 'West|sales']);
ok('1-dim: 2 root groups', c1.length === 2 && c1[0]!.header === 'East' && c1[1]!.header === 'West');
ok('1-dim: East has sales+units leaves', c1[0]!.columns!.length === 2 && c1[0]!.columns![0]!.header === 'sales' && c1[0]!.columns![1]!.header === 'units');
ok('1-dim: leaf accessorKey = full field', c1[0]!.columns![0]!.accessorKey === 'East|sales');
ok('1-dim: West has 1 leaf', c1[1]!.columns!.length === 1 && c1[1]!.columns![0]!.accessorKey === 'West|sales');

// 2) nested 2-dim: East|2024|sales, East|2025|sales → East > [2024 > sales, 2025 > sales].
const c2 = buildServerPivotColumns(['East|2024|sales', 'East|2025|sales']);
ok('2-dim: 1 root (East)', c2.length === 1 && c2[0]!.header === 'East');
ok('2-dim: East has 2 year groups', c2[0]!.columns!.length === 2 && c2[0]!.columns![0]!.header === '2024' && c2[0]!.columns![1]!.header === '2025');
ok('2-dim: deepest leaf accessorKey', c2[0]!.columns![0]!.columns![0]!.accessorKey === 'East|2024|sales');

// 3) first-seen order preserved (West before East if it appears first).
const c3 = buildServerPivotColumns(['West|x', 'East|x']);
ok('order: West then East', c3[0]!.header === 'West' && c3[1]!.header === 'East');

// 4) single-segment fields = flat leaves (no group).
const c4 = buildServerPivotColumns(['total', 'count']);
ok('single-seg: flat leaves', c4.length === 2 && c4[0]!.accessorKey === 'total' && c4[0]!.columns === undefined);

// 5) empty input.
ok('empty → []', J(buildServerPivotColumns([])) === '[]');

// 6) duplicate field → group merges, leaf appended twice (server contract: caller dedups; we preserve).
const c6 = buildServerPivotColumns(['East|sales', 'East|sales']);
ok('dup: single East group', c6.length === 1 && c6[0]!.columns!.length === 2);

// 7) custom separator.
const c7 = buildServerPivotColumns(['East::sales'], '::');
ok('custom sep: East group + sales leaf', c7[0]!.header === 'East' && c7[0]!.columns![0]!.accessorKey === 'East::sales');

// 8) group id = path prefix (stable).
const c8: ServerPivotColumn[] = buildServerPivotColumns(['East|2024|sales']);
ok('group id = path prefix', c8[0]!.id === 'East' && c8[0]!.columns![0]!.id === 'East|2024');

console.log(`buildServerPivotColumns: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
