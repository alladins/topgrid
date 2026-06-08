import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-72 — chart panel/composition: dock + settings(type) toolbar. ★non-vacuous: with dock="left"
// the type/settings toolbar is laid out to the LEFT of the chart (computed bbox: toolbar.x < chart.x),
// AND the settings still work — clicking a type button re-renders the chart shape (data-chart-type +
// a <polyline> appears for 'line'). NOT "the card rendered".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('docked chart panel places the settings toolbar to the side and the type switch works', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-chart-chartcard--docked'));
  const root = page.locator('#storybook-root');
  const card = root.locator('[data-chart-card]');
  await card.waitFor({ state: 'visible' });
  await expect(card).toHaveAttribute('data-chart-dock', 'left');

  // ★ dock composition: the toolbar sits to the LEFT of the chart svg (computed positions).
  const toolbarBox = (await root.locator('[data-chart-toolbar]').boundingBox())!;
  const chartBox = (await root.locator('svg[data-chart-type]').boundingBox())!;
  expect(toolbarBox.x + toolbarBox.width, 'toolbar is left of the chart').toBeLessThanOrEqual(chartBox.x + 2);

  // settings start at bar (no polyline).
  await expect(root.locator('svg[data-chart-type]')).toHaveAttribute('data-chart-type', 'bar');
  await expect(root.locator('svg[data-chart-type] polyline')).toHaveCount(0);

  // ★ the settings/type switch still works while docked: click 선(line) → chart re-renders as line.
  await root.locator('[data-type-btn="line"]').click();
  await expect(root.locator('svg[data-chart-type]'), 'chart switched to line').toHaveAttribute('data-chart-type', 'line');
  await expect(root.locator('svg[data-chart-type] polyline'), 'line polyline appeared').not.toHaveCount(0);
});
