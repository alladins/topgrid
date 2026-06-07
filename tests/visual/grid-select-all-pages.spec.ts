import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-55 — select-all across ALL pages. ★behavior-gated, non-vacuous: the divergence is the
// selection COUNT under pagination — selectAllPages selects every page's rows (12), the default
// page-scoped header selects only the current page (5). Plus: after select-all-pages, rows on a
// later page are already checked (page-scoped select would leave them unchecked).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const headerCheckbox = (page: Page, label: string) =>
  page.locator(`#storybook-root thead input[aria-label="${label}"]`);

test('G-1: selectAllPages header selects every page (count = total, later page pre-checked)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-select-all-pages--all-pages'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  await expect(page.getByTestId('sel-count')).toHaveText('0');
  await headerCheckbox(page, 'select all rows across all pages').check();

  // ★ all 12 rows selected (not just the 5 on the current page).
  await expect(page.getByTestId('sel-count'), '★count = all 12 rows').toHaveText('12');

  // ★ navigating to the next page shows its rows already checked (proves all-pages, not page-scope).
  await page.getByRole('button', { name: '다음 페이지' }).click();
  const pageRowChecks = page.locator('#storybook-root tbody input[type="checkbox"]');
  await expect(pageRowChecks.first(), '★next page rows pre-checked').toBeChecked();
});

test('G-1 (default): page-scoped header selects only the current page (count = page size)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-select-all-pages--page-only'));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // default header is page-scoped (byte-identical to existing behavior).
  await headerCheckbox(page, 'select all rows').check();
  await expect(page.getByTestId('sel-count'), 'count = current page only (5)').toHaveText('5');
});
