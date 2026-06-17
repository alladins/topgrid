// node --experimental-strip-types — 실제 mount + 실제 클릭 + DOM 단언(live 반응성).
// ★SSR(renderToString) 금지: pre-sorted 데이터 렌더는 데이터 경로만 증명(gate-2 함정류).
// 헤더를 '클릭'해 Vue 이벤트→useVueTable→headless row model→반응형 재렌더→DOM 행 순서 변경을 관찰.
import './setup-happydom.ts'; // ★vue import 보다 먼저 — DOM 글로벌 등록 후 Vue runtime-dom 평가
import assert from 'node:assert/strict';
import { createApp, nextTick } from 'vue';
import { Grid, textFilterFn } from '../dist/index.mjs';

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

// ★옵션2: 필터 — headless textFilterFn(1a 추출분)을 Vue 가 소비. 입력→DOM 행 live 필터.
const c3 = document.createElement('div');
document.body.appendChild(c3);
const filterCols = [
  { id: 'region', accessorKey: 'region', header: '지역', filterFn: textFilterFn },
  { id: 'sales', accessorKey: 'sales', header: '매출' },
];
createApp(Grid, { data, columns: filterCols, enableFilter: true }).mount(c3);
await nextTick();
const rowCount = () => c3.querySelectorAll('tbody tr').length;
const beforeFilter = rowCount();
const regionFilterInput = c3.querySelector(
  'thead tr[data-filter-row] th input[data-filter-col="region"]',
) as HTMLInputElement;
ok(!!regionFilterInput, '필터 입력행에 region 필터 input 렌더');
regionFilterInput.value = '부'; // '부산' 만 매치
regionFilterInput.dispatchEvent(new Event('input', { bubbles: true }));
await nextTick();
const afterFilter = rowCount();
const afterRegions = [...c3.querySelectorAll('tbody tr td[data-col="region"]')].map((td) => td.textContent);
console.log('[grid-vue] filter before/after rows:', beforeFilter, '→', afterFilter, afterRegions);
ok(beforeFilter === data.length, `필터 전 ${data.length}행`);
ok(afterFilter === 1 && afterRegions[0] === '부산', "★'부' 입력→headless textFilterFn 으로 DOM 행 1개(부산) live 필터");

// ★옵션2: 범위 선택 — headless range math(1b 추출분: normalizeRange/isInRange)를 Vue 가 소비.
// 클릭(0,0)+shift클릭(1,1)→정규화 범위 (0,0)-(1,1)=4셀 data-selected (live DOM).
const c4 = document.createElement('div');
document.body.appendChild(c4);
createApp(Grid, { data, columns, enableRangeSelection: true }).mount(c4);
await nextTick();
const cellAt = (r: number, ci: number) =>
  c4.querySelector(`tbody td[data-row-index="${r}"][data-col-index="${ci}"]`) as HTMLElement;
cellAt(0, 0).dispatchEvent(new MouseEvent('click', { bubbles: true })); // 앵커
await nextTick();
cellAt(1, 1).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); // 범위 확장
await nextTick();
const selectedCount = c4.querySelectorAll('tbody td[data-selected]').length;
console.log('[grid-vue] range select cells:', selectedCount);
ok(selectedCount === 4, "★(0,0)+shift(1,1)→headless normalizeRange/isInRange 로 4셀 live 선택");

// ★옵션2 드래그-fill — grid-vue 가 headless fillRange 를 호출. 선택 [10,20] → 핸들 mousedown →
// 아래 대상 클릭 → 등차 시리즈(30,40) 채움(live DOM). 1b range math 를 grid-vue 가 완전히 활용.
const c5 = document.createElement('div');
document.body.appendChild(c5);
const fillData = [{ n: 10 }, { n: 20 }, { n: 0 }, { n: 0 }];
const fillColumns = [{ id: 'n', accessorKey: 'n', header: 'N' }];
createApp(Grid, { data: fillData, columns: fillColumns, enableRangeSelection: true }).mount(c5);
await nextTick();
const fcell = (r: number) =>
  c5.querySelector(`tbody td[data-row-index="${r}"][data-col-index="0"]`) as HTMLElement;
fcell(0).dispatchEvent(new MouseEvent('click', { bubbles: true })); // 앵커 (0,0)=10
await nextTick();
fcell(1).dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); // 범위 10,20
await nextTick();
const handle = c5.querySelector(
  'td[data-row-index="1"][data-col-index="0"] span[data-fill-handle]',
) as HTMLElement;
ok(!!handle, 'fill 핸들이 선택 우하단 셀에 렌더');
handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); // 채우기 시작
await nextTick();
fcell(3).dispatchEvent(new MouseEvent('click', { bubbles: true })); // 대상 (3,0) → row 2,3 채움
await nextTick();
const filled = [fcell(2).textContent?.trim(), fcell(3).textContent?.trim()];
console.log('[grid-vue] drag-fill rows 2,3:', filled);
ok(filled[0] === '30' && filled[1] === '40', '★드래그-fill: headless fillRange 로 등차 30,40 채움(live)');

// ★옵션2 pagination — headless buildTableOptions 의 getPaginationRowModel 배선을 가져다 씀.
// pageSize 2 + 5행 → 페이지당 2행, 다음 버튼 클릭 → 다른 페이지 행(live DOM).
const c6 = document.createElement('div');
document.body.appendChild(c6);
const pgData = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];
const pgCols = [{ id: 'n', accessorKey: 'n', header: 'N' }];
createApp(Grid, { data: pgData, columns: pgCols, enablePagination: true, pageSize: 2 }).mount(c6);
await nextTick();
const pgRows = () => c6.querySelectorAll('tbody tr').length;
const pageInfo = () => c6.querySelector('[data-page-info]')?.textContent;
const pgVals = () => [...c6.querySelectorAll('tbody td[data-col="n"]')].map((td) => td.textContent);
ok(pgRows() === 2, `page0: pageSize 2 → 2행(실제 ${pgRows()})`);
ok(pageInfo() === '1 / 3', `page info 1/3(실제 ${pageInfo()})`);
const page0 = pgVals();
(c6.querySelector('[data-page-next]') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
await nextTick();
const page1 = pgVals();
console.log('[grid-vue] pagination page0→page1:', page0, '→', page1, pageInfo());
ok(pageInfo() === '2 / 3', '다음 클릭 → page info 2/3');
ok(page1[0] === '3' && page1[1] === '4', '★다음→page1 행(3,4) live(headless pagination row model)');

console.log(`\n✅ grid-vue: ${pass} passed, 0 failed — 정렬+selection+필터+범위선택+드래그fill+pagination 전부 live(headless 코어)`);
