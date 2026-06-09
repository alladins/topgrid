// MOD-61 redo node spine — makeExportItem invocation (PAT-005 injectable exporter).
// Run: node --experimental-strip-types src/internal/makeExportItem.test.ts
import { makeExportItem } from './makeExportItem.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface Row extends Record<string, unknown> { id: number; name: string }
const rows: Row[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const columns = [{ key: 'id', header: 'ID' }, { key: 'name', header: '이름' }];

// onClick 호출 시 주입된 exporter 가 closed-over rows/columns 로 실제 호출된다.
let captured: { rows: Row[]; columns: unknown[]; options?: unknown } | null = null;
const item = makeExportItem<Row>({
  rows,
  columns,
  exportOptions: { fileName: 'orders.xlsx' },
  exporter: (r, c, o) => { captured = { rows: r, columns: c, options: o }; },
});

ok('label default', item.label === 'Excel 내보내기');
ok('icon default present', item.icon !== undefined);
ok('onClick exists', typeof item.onClick === 'function');

item.onClick!(rows[0]!, {} as never, {} as never);
ok('exporter invoked', captured !== null);
ok('exporter got the rows', captured!.rows === rows && captured!.rows.length === 2);
ok('exporter got the columns', captured!.columns === columns);
ok('exporter got exportOptions', (captured!.options as { fileName?: string })?.fileName === 'orders.xlsx');

// label/icon override
const custom = makeExportItem<Row>({ rows, columns, label: 'CSV', icon: '★', exporter: () => {} });
ok('label override', custom.label === 'CSV');
ok('icon override', custom.icon === '★');

console.log(`makeExportItem.test.ts: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
