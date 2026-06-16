// === 판별 체크 (advisor): 구(舊) gate2 가 '반응성'을 테스트했는지 검증 ===
// ref 를 plain object {value} 로 바꿔도 구 방식(변경 후 동기 getRowModel 읽기)이 통과하면,
// 그건 Vue 반응성이 아니라 table-core 메모이제이션+게터를 테스트한 것 = 구 gate2 불충분.
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/vue-table';
import { data, columnData, SCENARIO } from './headless.mjs';
import assert from 'node:assert/strict';

const sorting = { value: [] }; // ★ ref 아님 — 그냥 객체 (반응성 없음)
const table = useVueTable({
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
  },
  onSortingChange: (u) => {
    sorting.value = typeof u === 'function' ? u(sorting.value) : u;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

sorting.value = SCENARIO.sortSalesDesc; // 동기 변경
const afterSort = table.getRowModel().rows.map((r) => r.getValue('region')); // 동기 읽기

console.log('[discriminator] plain-object afterSort:', afterSort);
try {
  assert.deepEqual(afterSort, SCENARIO.expectedSalesDescRegions);
  console.log(
    '\n⚠️  판별 결과: ref 없이(plain object)도 통과 → 구 gate2 는 반응성이 아니라 메모+게터를 테스트했음.',
  );
  console.log('   → 진짜 반응성 테스트(watchEffect+setSorting+nextTick) 필요. gate2-vue.mjs 참조.');
} catch {
  console.log('\n판별 결과: plain object 로는 실패 → 구 방식이 반응성에 의존했었음(예상과 다름).');
}
