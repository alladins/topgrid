import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-34 G-2 — legend / tooltip / area / sparkline min-max markers. Each assertion is a
// DIVERGENCE, not "it rendered" (advisor): tooltip shows the hovered value (two hovers → two
// different right values), legend swatch colour EQUALS its series' mark colour (no palette desync),
// area fills to the baseline, and sparkline markers sit at the ACTUAL extreme points (not endpoints).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('tooltip shows the hovered bar\'s value — two hovers, two distinct values', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--bar'));
  const svg = page.locator('#storybook-root svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });

  // hover the 95 bar → tooltip reads 95.
  await svg.locator('rect[data-value="95"]').hover();
  await expect(svg.locator('[data-tooltip] text')).toHaveText(/95$/);

  // hover the 30 bar → tooltip now reads 30 (NOT stuck on the first point / not the index).
  await svg.locator('rect[data-value="30"]').hover();
  await expect(svg.locator('[data-tooltip] text')).toHaveText(/30$/);
});

test('legend swatch colour equals its series mark colour (no desync)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--multi-series'));
  const svg = page.locator('#storybook-root svg[data-chart-type="bar"]');
  await svg.waitFor({ state: 'visible' });

  // two legend entries with the real series names.
  await expect(svg.locator('g[data-legend]')).toHaveCount(2);
  await expect(svg.locator('g[data-legend="제품 A"] text')).toHaveText('제품 A');

  // ★ swatch fill === the fill used by that series' bars (single colorOf source).
  const swatchA = await svg.locator('g[data-legend="제품 A"] rect').getAttribute('fill');
  const barA = await svg.locator('g[data-series="제품 A"] rect[data-value]').first().getAttribute('fill');
  expect(swatchA).toBe(barA);

  const swatchB = await svg.locator('g[data-legend="제품 B"] rect').getAttribute('fill');
  const barB = await svg.locator('g[data-series="제품 B"] rect[data-value]').first().getAttribute('fill');
  expect(swatchB).toBe(barB);
  // the two series differ in colour (palette advanced, not reused).
  expect(swatchA).not.toBe(swatchB);
});

test('area variant fills a polygon down to the baseline (distinct from a bare line)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-rangechart--area'));
  const svg = page.locator('#storybook-root svg[data-chart-type="area"]');
  await svg.waitFor({ state: 'visible' });
  // area draws BOTH a filled polygon and the polyline on top — the polygon is the G-2 addition.
  await expect(svg.locator('polygon[data-area]')).toHaveCount(1);
  await expect(svg.locator('polyline')).toHaveCount(1);
});

test('sparkline min/max markers land on the real extreme points, not the endpoints', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-sparkline--min-max-markers'));
  const svg = page.locator('#storybook-root svg[role="img"]').first();
  await svg.waitFor({ state: 'visible' });

  // wave=[40,60,90,70,30,5,25] @ width160 pad2 → xAt(i)=2+26i. max@idx2 (x54), min@idx5 (x132).
  const maxX = parseFloat((await svg.locator('circle[data-marker="max"]').getAttribute('cx'))!);
  const minX = parseFloat((await svg.locator('circle[data-marker="min"]').getAttribute('cx'))!);
  expect(maxX).toBeCloseTo(54, 0);
  expect(minX).toBeCloseTo(132, 0);
  // ★ neither marker is at an endpoint (x≈2 or x≈158) — "min==first point" bug fails here.
  for (const x of [maxX, minX]) {
    expect(x).toBeGreaterThan(2.5);
    expect(x).toBeLessThan(157.5);
  }
  // max marker is higher on screen (smaller cy) than the min marker.
  const maxY = parseFloat((await svg.locator('circle[data-marker="max"]').getAttribute('cy'))!);
  const minY = parseFloat((await svg.locator('circle[data-marker="min"]').getAttribute('cy'))!);
  expect(maxY).toBeLessThan(minY);
});
