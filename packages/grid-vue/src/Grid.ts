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
    rowSelection: { type: String as PropType<RowSelectionMode>, default: 'none' },
  },
  setup(props) {
    // 9개 state 슬라이스 (Vue ref). 반응성 = Vue(by design).
    const sorting = ref<GridStateBag['sorting']>([]);
    const columnFilters = ref<GridStateBag['columnFilters']>([]);
    const rowSelection = ref<GridStateBag['rowSelection']>({});
    const pagination = ref<GridStateBag['pagination']>({ pageIndex: 0, pageSize: 10 });
    const columnPinning = ref<GridStateBag['columnPinning']>({});
    const columnSizing = ref<GridStateBag['columnSizing']>({});
    const expanded = ref<GridStateBag['expanded']>({});
    const columnVisibility = ref<GridStateBag['columnVisibility']>({});
    const columnOrder = ref<GridStateBag['columnOrder']>([]);

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
      get data() { return props.data; },
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

    return () =>
      h('table', { 'data-topgrid-vue': '' }, [
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
              row.getVisibleCells().map((cell) => {
                const cdef = cell.column.columnDef.cell;
                return h('td', { 'data-col': cell.column.id }, [
                  cdef
                    ? h(FlexRender, { render: cdef, props: cell.getContext() })
                    : String(cell.getValue() ?? ''),
                ]);
              }),
            ),
          ),
        ),
      ]);
  },
});
