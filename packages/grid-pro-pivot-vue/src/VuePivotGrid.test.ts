// node --experimental-strip-types — 실제 Vue mount + vue-table 렌더 + DOM 단언.
// ★non-vacuous: 피벗 모델이 다단 헤더 + 값 셀로 렌더돼야 한다(빈 셸이면 실패).
import './setup-happydom.ts'; // ★must precede vue
import assert from 'node:assert/strict';
import { createApp, nextTick } from 'vue';
import { VuePivotGrid } from '../dist/index.mjs';
import { setLicenseState } from '@topgrid/grid-license-core';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};

const data = [
  { region: 'N', quarter: 'Q1', amt: 10 },
  { region: 'N', quarter: 'Q2', amt: 20 },
  { region: 'S', quarter: 'Q1', amt: 8 },
];
const config = {
  rows: ['region'],
  columns: ['quarter'],
  values: [{ field: 'amt', aggregationFn: 'sum' }],
};

setLicenseState({ status: { valid: true }, rawKey: 'test', setAt: 0 });

const c1 = document.createElement('div');
document.body.appendChild(c1);
createApp(VuePivotGrid, { data, config }).mount(c1);
await nextTick();

// --- 렌더 구조 ---
ok(c1.querySelector('[data-pivot-grid]') !== null, '피벗 그리드 루트 렌더');
ok(c1.querySelector('table[data-topgrid-pivot]') !== null, 'table 렌더');
const headerCells = Array.from(c1.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
ok(headerCells.some((t) => t === 'region'), '★행차원 헤더(region) 렌더');
ok(headerCells.some((t) => t === 'Q1') && headerCells.some((t) => t === 'Q2'), '★열차원 값 헤더(Q1/Q2) 렌더');
ok(headerCells.some((t) => t === 'Total'), 'grand-total 헤더 렌더');

// --- 값 셀 ---
const bodyRows = Array.from(c1.querySelectorAll('tbody tr'));
ok(bodyRows.length >= 2, 'data 행 + subtotal/grandTotal 행 렌더');
const bodyText = c1.querySelector('tbody')!.textContent ?? '';
ok(bodyText.includes('10') && bodyText.includes('20'), '★값 셀(sum: 10, 20) 렌더');
ok(c1.querySelector('tbody tr[data-row-kind="grandTotal"]') !== null, 'grandTotal 행 존재');

// --- 라이선스 게이트 ---
ok(c1.querySelector('[data-watermark]') === null, 'valid license → 워터마크 없음');
setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
const cU = document.createElement('div');
document.body.appendChild(cU);
createApp(VuePivotGrid, { data, config }).mount(cU);
await nextTick();
ok(cU.querySelector('[data-watermark]') !== null, '★unlicensed → auto 워터마크');

console.log(`\n[grid-pro-pivot-vue VuePivotGrid] ${pass} passed`);
