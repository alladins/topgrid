// === GATE 2 (make-or-break): Vue 반응성(ref) ↔ headless(table-core) 상태머신 동기화 ===
// 동일한 headless 컬럼/row-model 을 @tanstack/vue-table 로 소비하고,
// Vue ref 상태를 변경했을 때 headless row model 이 재계산되는지(=반응성 동기화) 실증.
import { effectScope, ref } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/vue-table';
import { data, columnData, SCENARIO } from './headless.mjs';
import assert from 'node:assert/strict';

const scope = effectScope();
const out = scope.run(() => {
  const sorting = ref([]);
  const columnFilters = ref([]);

  const table = useVueTable({
    get data() {
      return data;
    },
    get columns() {
      return columnData; // ← 동일 headless 컬럼 데이터(render 없음)
    },
    state: {
      get sorting() {
        return sorting.value;
      },
      get columnFilters() {
        return columnFilters.value;
      },
    },
    onSortingChange: (u) => {
      sorting.value = typeof u === 'function' ? u(sorting.value) : u;
    },
    onColumnFiltersChange: (u) => {
      columnFilters.value = typeof u === 'function' ? u(columnFilters.value) : u;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const initial = table.getRowModel().rows.map((r) => r.getValue('region'));

  // 반응성 핵심: Vue ref 변경 → headless row model 재계산?
  sorting.value = SCENARIO.sortSalesDesc;
  const afterSort = table.getRowModel().rows.map((r) => r.getValue('region'));

  columnFilters.value = [{ id: 'region', value: SCENARIO.filterRegionContains }];
  const afterFilter = table.getRowModel().rows.map((r) => r.getValue('region'));

  return { initial, afterSort, afterFilter };
});
scope.stop();

console.log('[vue] initial    :', out.initial);
console.log('[vue] afterSort  :', out.afterSort);
console.log('[vue] afterFilter:', out.afterFilter);

assert.deepEqual(
  out.afterSort,
  SCENARIO.expectedSalesDescRegions,
  'GATE2-A: Vue ref(sorting) 변경이 headless row model 에 반영',
);
assert.deepEqual(
  out.afterFilter,
  SCENARIO.expectedFilteredRegions,
  'GATE2-B: Vue ref(columnFilters) 변경이 headless filtered model 에 반영',
);

console.log('\n✅ GATE 2 PASS — Vue 반응성(ref) ↔ headless(table-core) 상태머신 동기화 실증');
