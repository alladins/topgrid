import { test, expect, type Page } from '@playwright/test';

// Real-browser (chromium) verification of the Vue chart — the gap happy-dom can't cover. Real layout
// (width:'100%' → real clientWidth), real ResizeObserver, real ECharts SVG painting, real click events.
// ★non-vacuous: type-switch must reach the ECharts instance (data-rendered-type read back from
// getOption), export must yield a substantial SVG, and a real datum click must fire cross-filter.

test('Vue panel renders ECharts SVG in a real browser with real layout', async ({
  page,
}: { page: Page }) => {
  await page.goto('/index.html');
  const root = page.locator('[data-chart-type]');
  await expect(root).toHaveAttribute('data-chart-type', 'bar');

  const svg = page.locator('[data-echarts-root] svg');
  await expect(svg).toBeVisible();
  // real layout: the chart took real width (width:'100%' inside a 640px host → > 600, not the 600 fallback).
  const box = await page.locator('[data-echarts-root]').boundingBox();
  expect(box!.width).toBeGreaterThan(600);
  await expect(page.locator('[data-echarts-root]')).toHaveAttribute('data-rendered-type', 'bar');
});

test('toolbar type-switch (bar → radar) reaches ECharts in the browser', async ({
  page,
}: { page: Page }) => {
  await page.goto('/index.html');
  await page.locator('[data-echarts-root] svg').waitFor({ state: 'visible' });
  await page.locator('[data-chart-type-btn="radar"]').click();
  await expect(page.locator('[data-echarts-root]')).toHaveAttribute('data-rendered-type', 'radar');
});

test('export yields a substantial SVG data URL in the browser', async ({ page }: { page: Page }) => {
  await page.goto('/index.html');
  await page.locator('[data-echarts-root] svg').waitFor({ state: 'visible' });
  await page.locator('[data-chart-export]').click();
  const len = Number(await page.locator('[data-chart-type]').getAttribute('data-export-result-len'));
  expect(len).toBeGreaterThan(100);
});

test('clicking a real bar fires cross-filter (real DOM event path)', async ({
  page,
}: { page: Page }) => {
  await page.goto('/index.html');
  await page.locator('[data-echarts-root] svg').waitFor({ state: 'visible' });
  // ECharts maps a real pixel click on a bar to a datum → our onCrossFilter sets data-last-filter.
  // (happy-dom can't exercise this — no hit-testing.) Click pixel coordinates over the category bands,
  // sweeping a few heights since bar tops vary with value.
  const box = (await page.locator('[data-echarts-root]').boundingBox())!;
  for (const fy of [0.78, 0.6, 0.88]) {
    for (const fx of [0.22, 0.42, 0.62, 0.82]) {
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      const val = await page.locator('[data-last-filter]').getAttribute('data-last-filter');
      if (val && val.length > 0) {
        expect(val.length).toBeGreaterThan(0);
        return;
      }
    }
  }
  throw new Error('cross-filter did not fire on any bar click');
});
