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

// 3) WHY in-place SSR→hydrate of the same node is deferred (not a bug — a documented limitation):
//    ECharts names SVG classes `zr{instanceId}-cls-{n}`, where instanceId is a module-global counter
//    incremented per echarts.init(). So two renders of the IDENTICAL option are NOT byte-identical —
//    the server SVG (zr0…) can never match a client init's SVG (zrN…), which would trip Vue hydration.
//    This locks in that fact so a future session does not naively attempt same-node hydration.
const svgA = renderChartToSvgString(matrixToEChartsOption(data, { type: 'bar' }), { width: 640, height: 300 });
const svgB = renderChartToSvgString(matrixToEChartsOption(data, { type: 'bar' }), { width: 640, height: 300 });
ok(svgA !== svgB, 'two renders of the same option are NOT byte-identical (non-deterministic ids)');
ok(/zr\d+-cls-/.test(svgA), 'SVG classes carry the per-instance zr{id}-cls prefix (the mismatch source)');

console.log(`\n[grid-pro-chart-enterprise-vue ssr] ${pass} passed`);
