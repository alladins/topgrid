import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-53 — collapsible pivot column groups. ★behavior-gated, non-vacuous (advisor): "a header
// appeared" is vacuous. The correctness-critical number (collapsed group AVG = true source mean,
// NOT avg-of-avgs) is proven in node (computePivot.test.mjs). Here we gate RENDER divergence:
//  1) before collapse: the 2024 group's child quarter columns (Q1, Q2) are in the DOM.
//  2) after collapsing 2024: those child columns are ABSENT, and the 2024 column shows the group
//     aggregate (17.50 = source avg of 10,20,20,20 — the node-proven value).
//  3) the sibling 2023 group is untouched (Q4 still present) → only the toggled group collapses.
//  4) re-expand restores the children.
//  5) OFF (enableColumnCollapse omitted) → no chevron toggle, all children rendered (byte-identical).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const th = (page: Page, text: string): Locator =>
  page.locator('#storybook-root thead th', { hasText: text });

test('G-2: collapsing a column group hides its child columns and shows the source-aggregated value', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--column-collapse'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // before collapse: 2024's children Q1, Q2 are present; the group aggregate is NOT shown as a cell.
  await expect(th(page, 'Q1'), 'Q1 child present before').toHaveCount(1);
  await expect(th(page, 'Q2'), 'Q2 child present before').toHaveCount(1);
  await expect(page.locator('#storybook-root tbody'), 'group aggregate not shown before').not.toContainText('17.50');

  // collapse the 2024 column group (chevron toggle on the group header).
  await page.getByRole('button', { name: '2024 컬럼 토글' }).click();

  // ★ child columns gone from the DOM; the 2024 column now shows the group avg (17.50 = true source mean).
  await expect(th(page, 'Q1'), '★Q1 child absent after collapse').toHaveCount(0);
  await expect(th(page, 'Q2'), '★Q2 child absent after collapse').toHaveCount(0);
  await expect(page.locator('#storybook-root tbody'), '★group aggregate shown after').toContainText('17.50');

  // ★ sibling 2023 group untouched — only the toggled group collapsed.
  await expect(th(page, 'Q4'), 'sibling group child still present').toHaveCount(1);

  // re-expand restores the children.
  await page.getByRole('button', { name: '2024 컬럼 토글' }).click();
  await expect(th(page, 'Q1'), 'Q1 restored on re-expand').toHaveCount(1);
  await expect(th(page, 'Q2'), 'Q2 restored on re-expand').toHaveCount(1);
});

test('G-2 (OFF): enableColumnCollapse omitted → no chevron, all child columns rendered', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-interaction--column-collapse-off'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.getByRole('button', { name: '2024 컬럼 토글' }), 'no collapse toggle when OFF').toHaveCount(0);
  await expect(th(page, 'Q1'), 'all children rendered when OFF').toHaveCount(1);
  await expect(th(page, 'Q2'), 'all children rendered when OFF').toHaveCount(1);
  await expect(th(page, 'Q4'), 'all children rendered when OFF').toHaveCount(1);
});
