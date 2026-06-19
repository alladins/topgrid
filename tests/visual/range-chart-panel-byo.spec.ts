import { test, expect, type Page } from '@playwright/test';

// BYO seam (ADR-003 R4) — RangeChartPanel renders whatever `renderChart` returns, with NO chart
// library of its own. ★non-vacuous: we inject a custom NON-ECharts renderer and assert ITS output
// appears AND its data→geometry logic actually ran (bigger value → taller bar). Without renderChart,
// the panel shows a graceful placeholder (never throws).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const BASE = 'grid-pro-chart-rangechartpanel';

test('injected BYO (non-ECharts) renderer renders through the seam', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--byo-renderer`));
  const root = page.locator('#storybook-root');

  // the consumer's own SVG (not bundled by the panel) is present → seam is library-agnostic.
  const svg = root.locator('svg[data-byo-chart]');
  await expect(svg).toBeVisible();
  const bars = svg.locator('rect[data-byo-bar]');
  await expect(bars).toHaveCount(4);

  // ★ the injected renderer's data→geometry actually executed: bar for 95 is taller than for 30.
  const heights: Record<string, number> = {};
  for (let i = 0; i < 4; i++) {
    const r = bars.nth(i);
    heights[(await r.getAttribute('data-byo-bar'))!] = parseFloat((await r.getAttribute('height'))!);
  }
  expect(heights['95'], 'tallest bar = max value').toBeGreaterThan(heights['30']);
  expect(heights['80']).toBeGreaterThan(heights['45']);
});

test('no renderChart → graceful placeholder (never throws)', async ({ page }: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--no-renderer`));
  const root = page.locator('#storybook-root');
  await expect(root.getByText(/No chart renderer provided/i)).toBeVisible();
  await expect(root.locator('svg[data-byo-chart]')).toHaveCount(0);
});
