import { test, expect, type Page } from '@playwright/test';

// W2 단계③ 증분2 — EnterpriseChartPanel (ECharts adapter, SVG renderer). ★non-vacuous: the panel must
// actually DRIVE ECharts, not just hold React state. `data-rendered-type` is read back from
// chart.getOption() AFTER setOption, so it proves the option reached and was accepted by ECharts.
//  1) bar story → inline <svg> mounts and ECharts rendered type 'bar'.
//  2) clicking the 'pie' toolbar button → ECharts re-renders as 'pie' (rendered-type flips, not just
//     the React data-chart-type) — a stale/ignored option would fail here.
//  3) Export → a non-empty SVG data URL is produced (getDataURL round-trip).
//  4) Unlicensed story → Pro watermark composited (PAT-003).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const BASE = 'grid-pro-chart-enterprise-enterprisechartpanel';

test('bar story mounts an inline SVG and ECharts renders type "bar"', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--default`));
  const root = page.locator('#storybook-root [data-chart-type]');
  await expect(root).toHaveAttribute('data-chart-type', 'bar');

  // SVG renderer → inline <svg> (not canvas), proving the ECharts instance mounted.
  await expect(page.locator('#storybook-root [data-echarts-root] svg')).toBeVisible();

  // ★ ECharts actually accepted the option (read back from getOption()).
  await expect(page.locator('#storybook-root [data-echarts-root]')).toHaveAttribute(
    'data-rendered-type',
    'bar',
  );
});

test('toolbar type switch re-renders ECharts (bar → pie reaches the instance)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--default`));
  await page.locator('#storybook-root [data-echarts-root] svg').waitFor({ state: 'visible' });

  await page.locator('#storybook-root [data-chart-type-btn="pie"]').click();

  // React state flips...
  await expect(page.locator('#storybook-root [data-chart-type]')).toHaveAttribute(
    'data-chart-type',
    'pie',
  );
  // ...AND the new option reached ECharts (non-vacuous — a stale chart would still say 'bar').
  await expect(page.locator('#storybook-root [data-echarts-root]')).toHaveAttribute(
    'data-rendered-type',
    'pie',
  );
});

test('Export produces a non-empty SVG data URL', async ({ page }: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--default`));
  await page.locator('#storybook-root [data-echarts-root] svg').waitFor({ state: 'visible' });

  await page.locator('#storybook-root [data-chart-export]').click();

  const root = page.locator('#storybook-root [data-chart-type]');
  await expect(root).toHaveAttribute('data-export-result-len', /\d+/);
  const len = Number(await root.getAttribute('data-export-result-len'));
  expect(len, 'SVG data URL is substantial, not an empty stub').toBeGreaterThan(100);
});

// 증분3 — catalog expansion live gate: the trickier types must actually mount in ECharts (proves
// the chart/coordinate/visualMap modules are registered, not just that the option object is shaped).
for (const [story, renderedType] of [
  ['radar', 'radar'],
  ['heatmap', 'heatmap'],
  ['candlestick', 'candlestick'],
] as const) {
  test(`catalog: ${story} mounts live and ECharts renders "${renderedType}"`, async ({
    page,
  }: { page: Page }) => {
    await page.goto(FRAME(`${BASE}--${story}`));
    await expect(page.locator('#storybook-root [data-echarts-root] svg')).toBeVisible();
    await expect(page.locator('#storybook-root [data-echarts-root]')).toHaveAttribute(
      'data-rendered-type',
      renderedType,
    );
  });
}

test('toolbarTypes surfaces non-default catalog types; clicking radar renders radar', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(`${BASE}--custom-toolbar`));
  await page.locator('#storybook-root [data-echarts-root] svg').waitFor({ state: 'visible' });

  // toolbar offers exactly the configured types (radar/heatmap are NOT in the default 6).
  await expect(page.locator('#storybook-root [data-chart-type-btn]')).toHaveCount(3);
  await expect(page.locator('#storybook-root [data-chart-type-btn="radar"]')).toBeVisible();

  // clicking the radar button (only reachable because toolbarTypes included it) renders radar.
  await page.locator('#storybook-root [data-chart-type-btn="radar"]').click();
  await expect(page.locator('#storybook-root [data-echarts-root]')).toHaveAttribute(
    'data-rendered-type',
    'radar',
  );
});

test('Pro license gate: unlicensed → watermark, licensed → none (PAT-003)', async ({
  page,
}: { page: Page }) => {
  const root = page.locator('#storybook-root');

  await page.goto(FRAME(`${BASE}--unlicensed`));
  await root.locator('[data-echarts-root]').waitFor({ state: 'visible' });
  await expect(root.getByText('Unlicensed @topgrid/grid')).toBeVisible();

  // ★ licensed (Default story) → NO watermark (a paying consumer sees a clean panel).
  await page.goto(FRAME(`${BASE}--default`));
  await root.locator('[data-echarts-root] svg').waitFor({ state: 'visible' });
  await expect(root.getByText('Unlicensed @topgrid/grid')).toHaveCount(0);
});
