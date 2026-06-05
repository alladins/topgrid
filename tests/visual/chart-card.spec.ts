import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-34 G-3 — type-switcher toolbar + range/pivot charting (seriesFromMatrix bridge).
// ★non-vacuous: clicking a toolbar button CHANGES THE CHART SHAPE (bar→line→area, data-chart-type +
// the marks themselves), and the matrix bridge yields the correct SERIES COUNT from a selected
// range / pivot result (orientation 'columns' → one series per column). A "toolbar rendered" or
// "chart rendered" test would pass even if the button did nothing — these assert the divergence.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('toolbar switches the chart shape bar → line → area', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-chartcard--type-switcher'));
  const root = page.locator('#storybook-root');
  const card = root.locator('[data-chart-card]');
  await card.waitFor({ state: 'visible' });

  // initial = bar.
  await expect(card.locator('svg')).toHaveAttribute('data-chart-type', 'bar');
  await expect(card.locator('svg rect[data-value]').first()).toBeVisible();
  await expect(card.locator('[data-type-btn="bar"]')).toHaveAttribute('aria-pressed', 'true');

  // click 선(line) → chart becomes a line (polyline appears, no value bars).
  await card.locator('[data-type-btn="line"]').click();
  await expect(card.locator('svg')).toHaveAttribute('data-chart-type', 'line');
  await expect(card.locator('svg polyline')).toHaveCount(1);
  await expect(card.locator('svg rect[data-value]')).toHaveCount(0);
  await expect(card.locator('[data-type-btn="line"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('[data-type-btn="bar"]')).toHaveAttribute('aria-pressed', 'false');

  // click 영역(area) → filled polygon appears.
  await card.locator('[data-type-btn="area"]').click();
  await expect(card.locator('svg')).toHaveAttribute('data-chart-type', 'area');
  await expect(card.locator('svg polygon[data-area]')).toHaveCount(1);
});

test('pivot-result chart produces one series per pivot column (2 series × 3 categories)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-chartcard--from-pivot-result'));
  const svg = page.locator('#storybook-root svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });
  // seriesFromMatrix(orientation 'columns') on a 3×2 matrix → 2 series (Widget/Gadget), 6 bars total.
  await expect(svg.locator('g[data-series]')).toHaveCount(2);
  await expect(svg.locator('rect[data-value]')).toHaveCount(6);
});

test('range-selection chart produces one series per selected column', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-chartcard--from-cell-range'));
  const card = page.locator('#storybook-root [data-chart-card]');
  await card.waitFor({ state: 'visible' });
  // 3 rows × 2 cols selected → 2 series (Q1/Q2), 6 bars.
  await expect(card.locator('svg g[data-series]')).toHaveCount(2);
  await expect(card.locator('svg rect[data-value]')).toHaveCount(6);
});
