// node --experimental-strip-types — 실제 Vue mount + drop 시뮬 + DOM 단언(라이브 반응성).
// ★non-vacuous: 필드를 rows 존에 drop 하면 movePivotField 로 새 config 가 update:config emit 돼야 한다.
import './setup-happydom.ts'; // ★must precede vue
import assert from 'node:assert/strict';
import { createApp, nextTick } from 'vue';
import { VuePivotPanel } from '../dist/index.mjs';
import type { PivotConfig } from '../dist/index.mjs';
import { setLicenseState } from '@topgrid/grid-license-core';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};

const fields = ['region', 'city', 'quarter', 'amt'];
const config = { rows: ['region'], columns: ['quarter'], values: [{ field: 'amt', aggregationFn: 'sum' }] };

// valid license → no watermark for the interaction mounts
setLicenseState({ status: { valid: true }, rawKey: 'test', setAt: 0 });

let emitted: PivotConfig | null = null;
const c1 = document.createElement('div');
document.body.appendChild(c1);
createApp(VuePivotPanel, {
  config,
  fields,
  'onUpdate:config': (next: PivotConfig) => {
    emitted = next;
  },
}).mount(c1);
await nextTick();

// --- 존 렌더 + 필드 배치 ---
ok(c1.querySelectorAll('[data-pivot-zone]').length === 4, '4개 존 렌더(available/rows/columns/values)');
const rowsZone = c1.querySelector('[data-pivot-zone="rows"]')!;
ok(rowsZone.querySelector('[data-pivot-field="region"]') !== null, 'region 이 rows 존에');
const availZone = c1.querySelector('[data-pivot-zone="available"]')!;
ok(availZone.querySelector('[data-pivot-field="city"]') !== null, 'city(미배정) 는 available 존에');
ok(availZone.querySelector('[data-pivot-field="amt"]') === null, 'amt(values 배정) 는 available 에 없음');

// --- ★drop: city 를 rows 존으로 → update:config emit(city in rows) ---
const dt = new DataTransfer();
dt.setData('text/plain', 'city');
const dropEv = new Event('drop', { bubbles: true });
Object.defineProperty(dropEv, 'dataTransfer', { value: dt });
Object.defineProperty(dropEv, 'preventDefault', { value: () => {} });
rowsZone.dispatchEvent(dropEv);
await nextTick();

ok(emitted !== null, '★update:config emit 됨');
const next = emitted as unknown as PivotConfig;
ok(next.rows.includes('city'), '★새 config.rows 에 city 포함(movePivotField 순수 로직)');
ok(next.rows.includes('region'), 'region 유지');

// --- 라이선스 자동 게이트: unlicensed → 워터마크 ---
setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
const cU = document.createElement('div');
document.body.appendChild(cU);
createApp(VuePivotPanel, { config, fields }).mount(cU);
await nextTick();
ok(cU.querySelector('[data-watermark]') !== null, '★unlicensed → auto 워터마크');

// valid → 워터마크 없음(항상-켜짐이면 이 단언이 실패)
setLicenseState({ status: { valid: true }, rawKey: 'test', setAt: 0 });
const cL = document.createElement('div');
document.body.appendChild(cL);
createApp(VuePivotPanel, { config, fields }).mount(cL);
await nextTick();
ok(cL.querySelector('[data-watermark]') === null, '★valid license → 워터마크 없음(상태 바인딩)');

// prop override
setLicenseState({ status: { valid: false, reason: 'invalid' }, rawKey: '', setAt: 0 });
const cF = document.createElement('div');
document.body.appendChild(cF);
createApp(VuePivotPanel, { config, fields, watermark: false }).mount(cF);
await nextTick();
ok(cF.querySelector('[data-watermark]') === null, 'watermark=false 강제 override');

console.log(`\n[grid-pro-pivot-vue VuePivotPanel] ${pass} passed`);
