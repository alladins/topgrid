/**
 * Vue 체크박스(selection) 컬럼 팩토리 — headless `CreateSelectionColumn` 시임의 Vue 구현.
 * headless 는 selection 정규화/prepend 정책만 담당하고, 셀/헤더 렌더(프레임워크별)는 여기서 주입한다.
 * (React 측 `createCheckboxColumn` 의 Vue 대응 — 동일 시임, 다른 렌더.)
 */
import { h } from 'vue';
import type { CreateSelectionColumn } from '@topgrid/grid-core-headless';

export function createVueCheckboxColumn<TData>(): CreateSelectionColumn<TData> {
  return (mode, selectAllPages) => ({
    id: '__select__',
    header:
      mode === 'multi'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ table }: any) =>
            h('input', {
              type: 'checkbox',
              checked: selectAllPages
                ? table.getIsAllRowsSelected()
                : table.getIsAllPageRowsSelected(),
              onChange: selectAllPages
                ? table.getToggleAllRowsSelectedHandler()
                : table.getToggleAllPageRowsSelectedHandler(),
              'aria-label': 'select all rows',
            })
        : () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: ({ row }: any) =>
      h('input', {
        type: 'checkbox',
        checked: row.getIsSelected(),
        onChange: row.getToggleSelectedHandler(),
        'aria-label': 'select row',
      }),
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
  });
}
