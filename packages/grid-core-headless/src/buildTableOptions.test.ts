// node --experimental-strip-types — buildTableOptions characterization (shape, not deep-equal).
// TableOptions 는 함수 인스턴스(getSortedRowModel(), onXxxChange 클로저)로 가득 → deep-equal 불가.
// flag→키 존재 여부 / enable 값 / effectiveColumns.length / selectionMode 만 단언(MOD-53 특성화 규율).
import assert from 'node:assert/strict';
// 빌드된 dist 를 테스트(repo 관례: pnpm -r test 는 build 선행). 소스는 extensionless(typecheck-clean),
// dist 는 단일 번들이라 node 가 relative chain 없이 로드 가능.
import { buildTableOptions } from '../dist/index.mjs';
import type { GridStateBag, TableOptionsInput } from './types';

const noop = () => {};
const state: GridStateBag = {
  sorting: [], setSorting: noop,
  columnFilters: [], setColumnFilters: noop,
  rowSelection: {}, setRowSelection: noop,
  pagination: { pageIndex: 0, pageSize: 10 }, setPagination: noop,
  columnPinning: {}, setColumnPinning: noop,
  columnSizing: {}, setColumnSizing: noop,
  expanded: {}, setExpanded: noop,
  columnVisibility: {}, setColumnVisibility: noop,
  columnOrder: [], setColumnOrder: noop,
};

type Row = { a: number; b: string };
const cols = [
  { id: 'a', accessorKey: 'a', header: 'A' },
  { id: 'b', accessorKey: 'b', header: 'B' },
];
const selCol = (mode: 'single' | 'multi') => ({ id: '__select__', header: mode });

function build(props: Partial<TableOptionsInput<Row>>) {
  return buildTableOptions<Row>(
    { data: [], columns: cols as never, ...props },
    state,
    selCol as never,
  );
}

let pass = 0;
const ok = (cond: boolean, msg: string) => { assert.ok(cond, msg); pass++; };

// 1) sort: enableSort && !manual → getSortedRowModel 존재
{
  const r = build({ enableSort: true });
  ok(typeof r.options.getSortedRowModel === 'function', 'enableSort → getSortedRowModel');
  ok(r.options.enableSorting === true, 'enableSorting=true');
}
{
  const r = build({ enableSort: false });
  ok(r.options.getSortedRowModel === undefined, '!enableSort → no getSortedRowModel');
}
{
  const r = build({ enableSort: true, manualSorting: true });
  ok(r.options.getSortedRowModel === undefined, 'manualSorting suppresses getSortedRowModel');
  ok(r.options.manualSorting === true, 'manualSorting=true');
}

// 2) filter: enableFilter → filtered + faceted models
{
  const r = build({ enableFilter: true });
  ok(typeof r.options.getFilteredRowModel === 'function', 'enableFilter → getFilteredRowModel');
  ok(typeof r.options.getFacetedRowModel === 'function', 'enableFilter → getFacetedRowModel');
  ok(typeof r.options.getFacetedUniqueValues === 'function', 'enableFilter → getFacetedUniqueValues');
}
{
  const r = build({ enableFilter: true, manualFiltering: true });
  ok(r.options.getFilteredRowModel === undefined, 'manualFiltering suppresses getFilteredRowModel');
}

// 3) selection: mode 'multi' → 체크박스 컬럼 prepend
{
  const r = build({ rowSelection: 'multi' });
  ok(r.selectionMode === 'multi', 'selectionMode=multi');
  ok(r.effectiveColumns.length === cols.length + 1, 'multi → +1 컬럼 prepend');
  ok((r.effectiveColumns[0] as { id: string }).id === '__select__', '주입된 selection 컬럼이 선두');
  ok(r.options.enableRowSelection === true, 'enableRowSelection=true');
  ok(r.options.enableMultiRowSelection === true, 'enableMultiRowSelection=true');
}
{
  const r = build({}); // selection 미지정
  ok(r.selectionMode === 'none', 'selection 미지정 → none');
  ok(r.effectiveColumns.length === cols.length, 'none → 컬럼 prepend 없음');
  ok(r.options.enableRowSelection === false, 'enableRowSelection=false');
}
{
  const r = build({ rowSelection: 'single' });
  ok(r.options.enableMultiRowSelection === false, 'single → enableMultiRowSelection=false');
}

// 4) pagination: mode='server' → manualPagination + rowCount + pageCount + model
{
  const r = build({ pagination: { mode: 'server', totalCount: 95, pageSize: 10 } });
  ok(r.options.manualPagination === true, 'server → manualPagination=true');
  ok(r.options.rowCount === 95, 'server → rowCount=95');
  ok(r.options.pageCount === 10, 'server → pageCount=ceil(95/10)=10');
  ok(typeof r.options.getPaginationRowModel === 'function', 'paginationActive → getPaginationRowModel');
}
{
  const r = build({ pagination: { mode: 'client' } });
  ok(r.options.manualPagination === false, 'client → manualPagination=false');
  ok(typeof r.options.getPaginationRowModel === 'function', 'client → getPaginationRowModel');
}

// 5) expanding + 기타 기본값
{
  const r = build({ enableExpanding: true });
  ok(typeof r.options.getExpandedRowModel === 'function', 'enableExpanding → getExpandedRowModel');
}
{
  const r = build({});
  ok(r.options.columnResizeMode === 'onChange', 'columnResizeMode 기본 onChange');
  ok(typeof r.options.getCoreRowModel === 'function', '항상 getCoreRowModel');
}

console.log(`buildTableOptions characterization: ${pass} passed, 0 failed`);
