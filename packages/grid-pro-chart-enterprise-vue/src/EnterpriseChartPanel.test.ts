// node --experimental-strip-types — real Vue mount + real click + DOM assertions (live reactivity).
// ★non-vacuous: the panel must DRIVE ECharts, not just hold Vue state. `data-rendered-type` is read
// back from chart.getOption() AFTER setOption, so it proves the option reached + was accepted by
// ECharts. Switching the toolbar type must flip rendered-type (a stale/ignored option fails here).
// Same engine (grid-chart-core) as the React package — this verifies the Vue render shell.
import './setup-happydom.ts'; // ★must precede vue (Vue runtime-dom captures global document on eval)
import assert from 'node:assert/strict';
import { createApp, nextTick } from 'vue';
import { EnterpriseChartPanel } from '../dist/index.mjs';

const data = {
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: '제품 A', values: [40, 70, 55, 90] },
    { name: '제품 B', values: [25, 45, 60, 35] },
  ],
};

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};

// --- mount bar panel ---
const c1 = document.createElement('div');
document.body.appendChild(c1);
createApp(EnterpriseChartPanel, { data, initialType: 'bar' }).mount(c1);
await nextTick();

const root = c1.querySelector('[data-chart-type]')!;
const echartsRoot = c1.querySelector('[data-echarts-root]')!;
ok(root.getAttribute('data-chart-type') === 'bar', 'panel data-chart-type = bar');
ok(echartsRoot.querySelector('svg') !== null, '★SVG renderer mounted inline <svg> (not canvas)');
ok(echartsRoot.getAttribute('data-rendered-type') === 'bar', '★ECharts accepted the bar option');

// --- toolbar type switch: bar → pie must reach the ECharts instance ---
const pieBtn = c1.querySelector('[data-chart-type-btn="pie"]')! as HTMLElement;
pieBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
await nextTick();
await nextTick(); // option recompute → child watch → setOption

ok(root.getAttribute('data-chart-type') === 'pie', 'Vue state flipped to pie');
ok(
  echartsRoot.getAttribute('data-rendered-type') === 'pie',
  '★new option reached ECharts (non-vacuous: stale chart would still say bar)',
);

// --- export round-trip ---
const exportBtn = c1.querySelector('[data-chart-export]')! as HTMLElement;
exportBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
await nextTick();
const len = Number(root.getAttribute('data-export-result-len'));
ok(Number.isFinite(len) && len > 100, '★Export produced a substantial SVG data URL');

// --- injected watermark gate (this package imports no React grid-license) ---
const c2 = document.createElement('div');
document.body.appendChild(c2);
createApp(EnterpriseChartPanel, { data, watermark: true }).mount(c2);
await nextTick();
ok(c2.querySelector('[data-watermark]') !== null, 'watermark=true → watermark composited');
ok(c1.querySelector('[data-watermark]') === null, 'watermark=false (default) → none');

console.log(`\n[grid-pro-chart-enterprise-vue] ${pass} passed`);
