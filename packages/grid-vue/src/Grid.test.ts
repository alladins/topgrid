// node --experimental-strip-types — 실제 mount + 실제 클릭 + DOM 단언(live 반응성).
// ★SSR(renderToString) 금지: pre-sorted 데이터 렌더는 데이터 경로만 증명(gate-2 함정류).
// 헤더를 '클릭'해 Vue 이벤트→useVueTable→headless row model→반응형 재렌더→DOM 행 순서 변경을 관찰.
import './setup-happydom.ts'; // ★vue import 보다 먼저 — DOM 글로벌 등록 후 Vue runtime-dom 평가
import assert from 'node:assert/strict';
import { createApp, nextTick } from 'vue';
import { Grid } from '../dist/index.mjs';

const data = [
  { region: '서울', sales: 320 },
  { region: '부산', sales: 510 },
  { region: '대구', sales: 150 },
];
const columns = [
  { id: 'region', accessorKey: 'region', header: '지역' },
  { id: 'sales', accessorKey: 'sales', header: '매출' },
];

const container = document.createElement('div');
document.body.appendChild(container);
createApp(Grid, { data, columns, enableSort: true }).mount(container);
await nextTick();

const regionOrder = () =>
  [...container.querySelectorAll('tbody tr td[data-col="region"]')].map((td) => td.textContent);

const before = regionOrder();

const salesHeader = container.querySelector('thead th[data-col="sales"]')!;
// ★TanStack 휴리스틱: 숫자 컬럼은 첫 클릭=내림차순(sortDescFirst 기본). 1st=desc, 2nd=asc.
salesHeader.dispatchEvent(new MouseEvent('click', { bubbles: true }));
await nextTick();
const after1st = regionOrder();
salesHeader.dispatchEvent(new MouseEvent('click', { bubbles: true }));
await nextTick();
const after2nd = regionOrder();

console.log('[grid-vue] before  :', before);
console.log('[grid-vue] 1st click(desc):', after1st);
console.log('[grid-vue] 2nd click(asc) :', after2nd);

let pass = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, m); pass++; };

assert.deepEqual(before, ['서울', '부산', '대구'], '초기 순서 = 입력 순서'); pass++;
assert.deepEqual(after1st, ['부산', '서울', '대구'], '1st click desc by sales(510,320,150) → 부산,서울,대구'); pass++;
assert.deepEqual(after2nd, ['대구', '서울', '부산'], '2nd click asc by sales(150,320,510) → 대구,서울,부산'); pass++;
assert.notDeepEqual(before, after1st, '★클릭으로 DOM 행 순서 실제 변경(live 반응성, SSR 아님)'); pass++;
assert.notDeepEqual(after1st, after2nd, '★2번째 클릭도 재정렬(토글 반응성)'); pass++;

// selection 주입 시임: rowSelection='multi' → __select__ 체크박스 컬럼 렌더(Vue h() 주입)
const c2 = document.createElement('div');
document.body.appendChild(c2);
createApp(Grid, { data, columns, rowSelection: 'multi' }).mount(c2);
await nextTick();
const selBoxes = c2.querySelectorAll('td[data-col="__select__"] input[type="checkbox"]');
ok(selBoxes.length === data.length, `selection 주입 시임: 행마다 체크박스(${selBoxes.length}=${data.length})`);

console.log(`\n✅ grid-vue: ${pass} passed, 0 failed — 헤더 클릭→DOM 행 재정렬(live) + selection 주입 시임`);
