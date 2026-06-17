/**
 * Vue 3 Grid (스켈레톤) — `@topgrid/grid-core-headless` 공유 코어 + `@tanstack/vue-table`.
 *
 * ★범위(정직): 정렬(헤더 클릭) + selection 컬럼 주입 시임만. filter/pin/virt/pagination/editing 미포함.
 * ★통합 시임 발견(스켈레톤이 드러낸 것): headless `buildTableOptions` 의 `options.state` 는 호출 시점
 *   값을 **eager 스냅샷**으로 굳힌다(React=매 render 재호출이라 무방). Vue(setup 1회)에선 그 스냅샷이
 *   얼어붙으므로, `state` 만 Vue 반응형 getter 로 **오버라이드**한다. 나머지(row models·enable 플래그·
 *   onChange 핸들러·selection 컬럼 주입)는 headless 그대로 재사용 = 진짜 공유.
 */
import { defineComponent, h, ref, type PropType } from 'vue';
import {
  FlexRender,
  useVueTable,
} from '@tanstack/vue-table';
import type { ColumnDef } from '@tanstack/table-core';
import {
  buildTableOptions,
  fillRange,
  isInRange,
  normalizeRange,
  type CellCoord,
  type CellRange,
  type GridStateBag,
  type RowSelectionMode,
  type TableOptionsInput,
} from '@topgrid/grid-core-headless';
import { createVueCheckboxColumn } from './CheckboxColumn';

type Row = Record<string, unknown>;

export const Grid = defineComponent({
  name: 'TopGridVue',
  props: {
    data: { type: Array as PropType<Row[]>, required: true },
    columns: { type: Array as PropType<ColumnDef<Row, unknown>[]>, required: true },
    enableSort: { type: Boolean, default: false },
    enableFilter: { type: Boolean, default: false },
    enableRangeSelection: { type: Boolean, default: false },
    enablePagination: { type: Boolean, default: false },
    pageSize: { type: Number, default: 10 },
    rowSelection: { type: String as PropType<RowSelectionMode>, default: 'none' },
  },
  setup(props) {
    // 9개 state 슬라이스 (Vue ref). 반응성 = Vue(by design).
    const sorting = ref<GridStateBag['sorting']>([]);
    const columnFilters = ref<GridStateBag['columnFilters']>([]);
    const rowSelection = ref<GridStateBag['rowSelection']>({});
    const pagination = ref<GridStateBag['pagination']>({ pageIndex: 0, pageSize: props.pageSize });
    const columnPinning = ref<GridStateBag['columnPinning']>({});
    const columnSizing = ref<GridStateBag['columnSizing']>({});
    const expanded = ref<GridStateBag['expanded']>({});
    const columnVisibility = ref<GridStateBag['columnVisibility']>({});
    const columnOrder = ref<GridStateBag['columnOrder']>([]);

    // ★옵션2 드래그-fill: 채우기 결과가 화면에 보이려면 데이터가 변경 가능해야 함 → props.data 복사본.
    const rows = ref<Row[]>(props.data.map((r) => ({ ...r })));

    const apply = <T>(r: { value: T }, u: T | ((p: T) => T)) => {
      r.value = typeof u === 'function' ? (u as (p: T) => T)(r.value) : u;
    };

    // headless GridStateBag 브리지 (getter=ref 읽기, setter=ref 갱신).
    const stateBag: GridStateBag = {
      get sorting() { return sorting.value; },
      setSorting: (u) => apply(sorting, u as never),
      get columnFilters() { return columnFilters.value; },
      setColumnFilters: (u) => apply(columnFilters, u as never),
      get rowSelection() { return rowSelection.value; },
      setRowSelection: (u) => apply(rowSelection, u as never),
      get pagination() { return pagination.value; },
      setPagination: (u) => apply(pagination, u as never),
      get columnPinning() { return columnPinning.value; },
      setColumnPinning: (u) => apply(columnPinning, u as never),
      get columnSizing() { return columnSizing.value; },
      setColumnSizing: (u) => apply(columnSizing, u as never),
      get expanded() { return expanded.value; },
      setExpanded: (u) => apply(expanded, u as never),
      get columnVisibility() { return columnVisibility.value; },
      setColumnVisibility: (u) => apply(columnVisibility, u as never),
      get columnOrder() { return columnOrder.value; },
      setColumnOrder: (u) => apply(columnOrder, u as never),
    };

    // ★headless 위임: row models·enable 플래그·onChange 핸들러·selection 컬럼 주입 전부 여기서 옴.
    const built = buildTableOptions<Row>(
      props as unknown as TableOptionsInput<Row>,
      stateBag,
      createVueCheckboxColumn<Row>(),
    );

    const table = useVueTable<Row>({
      get data() { return rows.value; },
      get columns() { return built.effectiveColumns; },
      ...built.options,
      // ★state 만 Vue 반응형 getter 로 오버라이드(eager 스냅샷 대체).
      state: {
        get sorting() { return sorting.value; },
        get columnFilters() { return columnFilters.value; },
        get rowSelection() { return rowSelection.value; },
        get pagination() { return pagination.value; },
        get columnPinning() { return columnPinning.value; },
        get columnSizing() { return columnSizing.value; },
        get expanded() { return expanded.value; },
        get columnVisibility() { return columnVisibility.value; },
        get columnOrder() { return columnOrder.value; },
      },
    });

    // ★옵션2: 범위 선택 — headless range math(normalizeRange/isInRange) 소비(1b→2 시너지).
    // 클릭=앵커, shift+클릭=범위 확장. 선택 셀은 isInRange 로 data-selected 표시(반응형).
    const selection = ref<CellRange | null>(null);
    const anchor = ref<CellCoord | null>(null);
    const selectCell = (r: number, c: number, shift: boolean) => {
      const coord: CellCoord = { row: r, col: c };
      if (shift && anchor.value) {
        selection.value = normalizeRange({ start: anchor.value, end: coord });
      } else {
        anchor.value = coord;
        selection.value = { start: coord, end: coord };
      }
    };

    // ★드래그-fill: fill 핸들 mousedown → 채우기 시작, 아래쪽 대상 셀 클릭 → headless fillRange 호출.
    // 컬럼 인덱스 → 데이터 키(accessorKey) 변환(스켈레톤: 단순 컬럼 가정).
    const colKey = (ci: number): string => {
      const cd = props.columns[ci] as { accessorKey?: string; id?: string } | undefined;
      return cd?.accessorKey ?? cd?.id ?? String(ci);
    };
    const fillingFrom = ref<CellRange | null>(null);
    const startFill = () => {
      fillingFrom.value = selection.value;
    };
    const applyFillTo = (targetRow: number) => {
      const src = fillingFrom.value;
      if (!src) return;
      const n = normalizeRange(src);
      if (targetRow <= n.end.row) return; // 스켈레톤: 아래 방향만. 핸들 자체 클릭=무동작(유지).
      const count = targetRow - n.end.row;
      const updates = fillRange<unknown>(n, 'down', count, (r, c) => rows.value[r]?.[colKey(c)]);
      // ★새 배열로 교체(참조 변경) — vue-table getRowModel 은 data 참조 기준 메모라
      //   인덱스 in-place 할당은 재계산 안 됨.
      const next = rows.value.slice();
      for (const u of updates) {
        const cur = next[u.row];
        if (cur) next[u.row] = { ...cur, [colKey(u.col)]: u.value };
      }
      rows.value = next;
      fillingFrom.value = null;
    };

    return () => {
      const tableEl = h('table', { 'data-topgrid-vue': '' }, [
        h('thead', [
          ...table.getHeaderGroups().map((hg) =>
            h(
              'tr',
              hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const label = header.column.columnDef.header;
                const content =
                  typeof label === 'function'
                    ? h(FlexRender, { render: label, props: header.getContext() })
                    : (label ?? '');
                return h(
                  'th',
                  {
                    'data-col': header.column.id,
                    style: canSort ? 'cursor:pointer' : undefined,
                    onClick: canSort ? header.column.getToggleSortingHandler() : undefined,
                  },
                  [content, sorted === 'desc' ? ' ▼' : sorted === 'asc' ? ' ▲' : ''],
                );
              }),
            ),
          ),
          // ★옵션2: 필터 입력행 — headless textFilterFn(column.filterFn) 을 소비. 입력→setFilterValue→
          // onColumnFiltersChange→ref→getFilteredRowModel 재계산→행 필터(live 반응성).
          props.enableFilter
            ? h(
                'tr',
                { 'data-filter-row': '' },
                table.getHeaderGroups()[0]!.headers.map((header) =>
                  h(
                    'th',
                    {},
                    header.column.getCanFilter()
                      ? [
                          h('input', {
                            'data-filter-col': header.column.id,
                            onInput: (e: Event) => {
                              const v = (e.target as HTMLInputElement).value;
                              header.column.setFilterValue(
                                v ? { operator: 'contains', value: v } : undefined,
                              );
                            },
                          }),
                        ]
                      : [],
                  ),
                ),
              )
            : null,
        ]),
        h(
          'tbody',
          table.getRowModel().rows.map((row) =>
            h(
              'tr',
              { 'data-row-id': row.id },
              row.getVisibleCells().map((cell, ci) => {
                const cdef = cell.column.columnDef.cell;
                const selected =
                  props.enableRangeSelection && isInRange(row.index, ci, selection.value);
                const sel = selection.value ? normalizeRange(selection.value) : null;
                const isFillCorner =
                  props.enableRangeSelection &&
                  !!sel &&
                  row.index === sel.end.row &&
                  ci === sel.end.col;
                return h(
                  'td',
                  {
                    'data-col': cell.column.id,
                    'data-row-index': row.index,
                    'data-col-index': ci,
                    'data-selected': selected ? '' : undefined,
                    style: selected ? 'background:#dbeafe' : undefined,
                    onClick: props.enableRangeSelection
                      ? (e: MouseEvent) => {
                          if (fillingFrom.value) applyFillTo(row.index);
                          else selectCell(row.index, ci, e.shiftKey);
                        }
                      : undefined,
                  },
                  [
                    cdef
                      ? h(FlexRender, { render: cdef, props: cell.getContext() })
                      : String(cell.getValue() ?? ''),
                    isFillCorner
                      ? h('span', {
                          'data-fill-handle': '',
                          style:
                            'display:inline-block;width:8px;height:8px;background:#2563eb;cursor:crosshair;margin-left:4px',
                          onMousedown: (e: MouseEvent) => {
                            e.stopPropagation();
                            startFill();
                          },
                        })
                      : null,
                  ],
                );
              }),
            ),
          ),
        ),
      ]);
      if (!props.enablePagination) return tableEl;
      // ★옵션2 pagination: headless buildTableOptions 가 enablePagination 시 getPaginationRowModel 배선.
      // 버튼은 table API(previousPage/nextPage) 호출 → onPaginationChange → ref → 현재 페이지만 렌더.
      const ps = table.getState().pagination;
      return h('div', [
        tableEl,
        h('div', { 'data-pagination': '' }, [
          h(
            'button',
            {
              'data-page-prev': '',
              disabled: !table.getCanPreviousPage(),
              onClick: () => table.previousPage(),
            },
            '이전',
          ),
          h('span', { 'data-page-info': '' }, `${ps.pageIndex + 1} / ${table.getPageCount()}`),
          h(
            'button',
            {
              'data-page-next': '',
              disabled: !table.getCanNextPage(),
              onClick: () => table.nextPage(),
            },
            '다음',
          ),
        ]),
      ]);
    };
  },
});
