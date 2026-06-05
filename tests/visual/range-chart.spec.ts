import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-34 G-1 — built-in RangeChart (zero-dep SVG). ★non-vacuous: the SCALE must be wired to the
// DOM. A "an <svg> rendered" test is vacuous (a chart that ignores its data still renders an svg).
// So we assert the geometry: a bigger value → a TALLER bar, axis ticks are ROUND numbers, and the
// line variant draws a polyline with one vertex per datum. An inverted/ignored scale fails here.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('bar heights track the data (value 95 bar taller than value 30 bar)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--bar'));
  const root = page.locator('#storybook-root');
  const svg = root.locator('svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });

  // values [30,80,45,95,60] → 5 bars. max(95) bar must be the tallest, min(30) the shortest.
  const rects = svg.locator('rect[data-value]');
  await expect(rects).toHaveCount(5);

  const heights: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    const r = rects.nth(i);
    const v = await r.getAttribute('data-value');
    heights[v!] = parseFloat((await r.getAttribute('height'))!);
  }
  // ★ the bar for 95 is strictly taller than the bar for 30 (scale → height, not a constant).
  expect(heights['95'], 'tallest bar = max value').toBeGreaterThan(heights['30']);
  expect(heights['80']).toBeGreaterThan(heights['45']);
  // monotonic: ordering of heights matches ordering of values.
  expect(heights['95']).toBeGreaterThan(heights['80']);
  expect(heights['60']).toBeGreaterThan(heights['45']);
});

test('y-axis shows round tick labels covering the domain', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--bar'));
  const svg = page.locator('#storybook-root svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });
  // niceTicks(0,95) → [0,20,40,60,80,100]. assert the round extremes are painted as <text>.
  // SVG <text> has no innerText (not HTML layout) — read textContent.
  const labels = await svg.locator('g[data-tick] text').allTextContents();
  expect(labels).toContain('0');
  expect(labels).toContain('100');
  // every tick label is a round number (no 95.0001 drift in the DOM).
  for (const l of labels) expect(Number.isInteger(Number(l)), `tick "${l}" round`).toBe(true);
});

test('line variant draws a polyline with one vertex per datum', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--line'));
  const svg = page.locator('#storybook-root svg[data-chart-type="line"]');
  await svg.waitFor({ state: 'visible' });
  const poly = svg.locator('polyline');
  await expect(poly).toHaveCount(1);
  const pts = (await poly.getAttribute('points'))!.trim().split(/\s+/);
  expect(pts.length, '5 data points → 5 vertices').toBe(5);
  // x strictly increases left→right (order preserved, not scrambled).
  const xs = pts.map((p) => parseFloat(p.split(',')[0]));
  for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
});

test('Pro license gate: unlicensed chart is watermarked, licensed is not (PAT-003)', async ({
  page,
}: { page: Page }) => {
  // unlicensed → watermark composited over the chart.
  await page.goto(FRAME('grid-pro-chart-rangechart--unlicensed'));
  const root = page.locator('#storybook-root');
  await root.locator('svg[data-chart-type]').waitFor({ state: 'visible' });
  await expect(root.getByText('Unlicensed @topgrid/grid')).toBeVisible();

  // valid license (the Bar story) → NO watermark (a paying consumer sees a clean chart).
  await page.goto(FRAME('grid-pro-chart-rangechart--bar'));
  await root.locator('svg[data-chart-type]').waitFor({ state: 'visible' });
  await expect(root.getByText('Unlicensed @topgrid/grid')).toHaveCount(0);
});

test('multi-series bar groups two series side by side per category', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--multi-series'));
  const svg = page.locator('#storybook-root svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });
  // 2 series × 4 categories = 8 bars, in two distinct <g data-series> groups.
  await expect(svg.locator('g[data-series]')).toHaveCount(2);
  await expect(svg.locator('rect[data-value]')).toHaveCount(8);
});
