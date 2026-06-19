// node --experimental-strip-types — SSR proof with NO browser/DOM:
//  1) renderChartToSvgString produces a real <svg> string headless (ECharts SSR mode).
//  2) EnterpriseChartPanel is SSR-safe: vue/server-renderer renderToString emits the container +
//     toolbar without a DOM and without throwing (onMounted/ECharts client init do NOT run on server).
// ★No happy-dom import here — that's the point: this verifies the server path.
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { renderChartToSvgString, EnterpriseChartPanel } from '../dist/index.mjs';
import { matrixToEChartsOption } from '@topgrid/grid-chart-core';

let pass = 0;
const ok = (c: boolean, m: string): void => {
  assert.ok(c, m);
  pass++;
};

const data = {
  categories: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [{ name: 'A', values: [40, 70, 55, 90] }],
};

// 1) headless SVG string — no DOM.
const svg = renderChartToSvgString(matrixToEChartsOption(data, { type: 'bar' }), { width: 640, height: 300 });
ok(svg.includes('<svg'), 'SSR produced an <svg> root');
ok(svg.length > 500, 'SVG is substantial (a real chart, not an empty stub)');
ok(svg.includes('path') || svg.includes('rect'), 'SVG contains rendered series geometry');

// 2) the component server-renders without a DOM (SSR-safe).
const html = await renderToString(
  createSSRApp({ render: () => h(EnterpriseChartPanel, { data, watermark: false }) }),
);
ok(html.includes('data-echarts-root'), 'panel chart container server-rendered');
ok(html.includes('data-chart-toolbar'), 'panel toolbar server-rendered');

console.log(`\n[grid-pro-chart-enterprise-vue ssr] ${pass} passed`);
