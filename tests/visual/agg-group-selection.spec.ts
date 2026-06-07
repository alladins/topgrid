import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-56 — group/hierarchy selection. ★behavior-gated, non-vacuous: the group checkbox toggles
// the whole subtree and leaf selection rolls up to the group's tri-state.
//  1) clicking 영업팀's group checkbox selects all 3 of its leaves (count = 3) and the box is checked.
//  2) unchecking one leaf makes the group indeterminate (aria-checked=mixed) and count = 2.
//  3) OFF (enableRowSelection omitted) → no checkboxes at all.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const salesGroupCheckbox = (page: Page): Locator =>
  page
    .locator('#storybook-root tbody tr')
    .filter({ has: page.locator('[data-group-select]') })
    .filter({ hasText: '영업팀' })
    .locator('[data-group-select]');

test('G-1: group checkbox selects the whole subtree; leaf uncheck → indeterminate', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--group-selection'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.getByTestId('sel-count')).toHaveText('0');

  // ★ select the 영업팀 group → all 3 leaves selected.
  await salesGroupCheckbox(page).check();
  await expect(page.getByTestId('sel-count'), '★subtree selected (3 leaves)').toHaveText('3');
  await expect(salesGroupCheckbox(page)).toHaveAttribute('aria-checked', 'true');

  // ★ uncheck one leaf → group rolls up to indeterminate, count drops to 2.
  await page.locator('#storybook-root tbody input[aria-label="select row"]').first().uncheck();
  await expect(page.getByTestId('sel-count'), '★rollup count = 2').toHaveText('2');
  await expect(salesGroupCheckbox(page), '★group indeterminate').toHaveAttribute('aria-checked', 'mixed');
});

test('G-1 (OFF): enableRowSelection omitted → no checkboxes', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-agg-aggregationgrid--group-selection-off'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.locator('#storybook-root [data-group-select]'), 'no group checkbox when OFF').toHaveCount(0);
  await expect(page.locator('#storybook-root input[type="checkbox"]'), 'no checkboxes when OFF').toHaveCount(0);
});
