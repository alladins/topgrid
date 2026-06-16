// === GATE 2 (make-or-break, 정정판): Vue 반응성 ↔ headless 상태머신 동기화 ===
// advisor 지적 반영: 동기 getRowModel 읽기는 메모+게터만 검증(반응성 아님).
// 진짜 반응성 검증:
//   (1) row model 을 watchEffect 로 reactive 하게 구독,
//   (2) 상태를 table.setSorting()/setColumnFilters() = 테이블 자체 API 로 변경
//       (onSortingChange→ref→getter 라운드트립 — ref 직접 조작 아님),
//   (3) await nextTick() 후 watchEffect 재실행 + 관찰된 rows 갱신을 단언.
import { effectScope, ref, watchEffect, nextTick } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/vue-table';
import { data, columnData, SCENARIO } from './headless.mjs';
import assert from 'node:assert/strict';

const scope = effectScope();
let table;
let observed = [];
let effectRuns = 0;

scope.run(() => {
  const sorting = ref([]);
  const columnFilters = ref([]);

  table = useVueTable({
    get data() {
      return data;
    },
    get columns() {
      return columnData;
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

  // 반응형 구독: row model 을 effect 안에서 읽어 reactive dependency 형성
  watchEffect(() => {
    effectRuns += 1;
    observed = table.getRowModel().rows.map((r) => r.getValue('region'));
  });
});

const runsInitial = effectRuns;
const observedInitial = [...observed];

// ★ 테이블 자체 API 로 변경 (onSortingChange 라운드트립)
table.setSorting(SCENARIO.sortSalesDesc);
await nextTick();
const runsAfterSort = effectRuns;
const observedAfterSort = [...observed];

table.setColumnFilters([{ id: 'region', value: SCENARIO.filterRegionContains }]);
await nextTick();
const observedAfterFilter = [...observed];

scope.stop();

console.log('[vue] effectRuns initial→afterSort:', runsInitial, '→', runsAfterSort);
console.log('[vue] observed initial    :', observedInitial);
console.log('[vue] observed afterSort   :', observedAfterSort);
console.log('[vue] observed afterFilter :', observedAfterFilter);

assert.ok(
  runsAfterSort > runsInitial,
  'GATE2-CORE: setSorting 후 watchEffect 가 재실행되어야(반응성 트리거)',
);
assert.deepEqual(
  observedAfterSort,
  SCENARIO.expectedSalesDescRegions,
  'GATE2-A: 반응형으로 관찰된 rows 가 정렬 반영',
);
assert.deepEqual(
  observedAfterFilter,
  SCENARIO.expectedFilteredRegions,
  'GATE2-B: 반응형으로 관찰된 rows 가 필터 반영',
);

console.log(
  '\n✅ GATE 2 PASS — table.setSorting → onChange → ref → getter → row model 재계산 → watchEffect 재실행 (genuine 반응성 라운드트립)',
);
