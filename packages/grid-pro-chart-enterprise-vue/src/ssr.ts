// Server-side rendering helper — turn an ECharts option into a static SVG string with NO DOM.
// For Nuxt/SSR: render a static chart on the server (SEO / no-JS / fast first paint); the interactive
// EnterpriseChartPanel takes over on the client. Uses ECharts' zero-dependency SSR mode (5.3+).
import { echarts } from './echarts-setup.js';
import type { EChartsOption } from 'echarts';

export interface SsrChartSize {
  /** SSR needs explicit pixels (no DOM to measure). Default 600×300. */
  width?: number;
  height?: number;
}

/**
 * Render a chart option to an SVG string server-side (no browser). Pair with `matrixToEChartsOption`:
 *
 * ```ts
 * import { matrixToEChartsOption } from '@topgrid/grid-chart-core';
 * import { renderChartToSvgString } from '@topgrid/grid-pro-chart-enterprise-vue';
 * const svg = renderChartToSvgString(matrixToEChartsOption(data, { type: 'bar' }), { width: 640 });
 * // → inject `svg` into your SSR'd HTML
 * ```
 */
export function renderChartToSvgString(option: EChartsOption, size: SsrChartSize = {}): string {
  const width = size.width ?? 600;
  const height = size.height ?? 300;
  // `ssr: true` + null container → headless SVG string (no document required).
  const chart = echarts.init(null as unknown as HTMLElement, undefined, {
    renderer: 'svg',
    ssr: true,
    width,
    height,
  });
  try {
    chart.setOption(option);
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}
