import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-75/76 — chart cross-filtering through the grid's ACTUAL filter model. ★behavior-gated,
// non-vacuous: clicking a region bar calls table.setGlobalFilter(selectionsToFilter(...)); the table
// filters INTERNALLY (getFilteredRowModel) and the rendered rows (getRowModel) drop to that region —
// NOT a parent-side data-prop pre-filter. + linked highlight (selected bar data-selected, others dim).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'pro-crossfilter--default';
const bar = (page: Page, i: number): Locator =>
  page.locator(`#storybook-root [data-category-index="${i}"]`).first();
// rows rendered from table.getRowModel().rows = the grid's filtered model output.
const gridRows = (page: Page): Locator =>
  page.locator('#storybook-root [data-testid="linked-grid"] tbody tr[data-row]');

test('chart bar click filters linked grid + highlights selection; re-click clears', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // initial: all 6 rows shown.
  await expect(gridRows(page)).toHaveCount(6);

  // ★ click North (index 0) → grid filters to North×3.
  await bar(page, 0).click();
  await expect(gridRows(page)).toHaveCount(3);

  // ★ linked highlight: selected bar carries data-selected; an unselected bar is dimmed (opacity 0.3).
  await expect(bar(page, 0)).toHaveAttribute('data-selected', '');
  await expect(bar(page, 1)).toHaveAttribute('opacity', '0.3');

  // ★ switch to South (index 1) → South×2.
  await bar(page, 1).click();
  await expect(gridRows(page)).toHaveCount(2);
  await expect(bar(page, 1)).toHaveAttribute('data-selected', '');

  // ★ re-click the active bar → clears the filter (back to 6).
  await bar(page, 1).click();
  await expect(gridRows(page)).toHaveCount(6);
});
