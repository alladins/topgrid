import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-29 G-1 — i18n localeText resolver in the REAL DOM. The invariant the node test
// can't see: a partial localeText must MERGE, not replace. An overridden key shows the new
// string; a NON-overridden key still renders the Korean default. LESS-006 — a resolver that
// silently dropped fallback keys would pass unit math but blank the UI here.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('partial override: EN rowsPerPage shows, KO totalCount falls back', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-i18n--partial-override'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // OVERRIDDEN key — English label rendered.
  await expect(root.getByText('Rows per page:')).toBeVisible();
  // NON-overridden key — Korean default survives the merge (7 rows total).
  await expect(root.getByText('전체', { exact: false })).toContainText('전체');
  await expect(root.getByText('건', { exact: false })).toContainText('건');
  // No stale Korean rowsPerPage label.
  await expect(root.getByText('페이지당 행 수:')).toHaveCount(0);

  // OVERRIDDEN nav aria-label (screen-reader heard) — EN; non-overridden buttons stay KO.
  await expect(root.getByRole('button', { name: 'Next page' })).toBeVisible();
  await expect(root.getByRole('button', { name: '이전 페이지' })).toBeVisible();
  await expect(root.getByRole('button', { name: '다음 페이지' })).toHaveCount(0);

  // OVERRIDDEN icon — ascending sort glyph 'UP'. Click the STRING column (이름): numeric
  // columns sortDescFirst → first click is desc (▼, the non-overridden default).
  const sortable = root.locator('th[role="columnheader"]').filter({ hasText: '이름' });
  await sortable.click();
  await expect(root.getByText('UP', { exact: false })).toBeVisible();
});

test('totalCount formatter override replaces the bold KO string', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-i18n--total-count-formatter'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  await expect(root.getByText('Total: 7')).toBeVisible();
  // Korean default rowsPerPage still falls back (not overridden here).
  await expect(root.getByText('페이지당 행 수:')).toBeVisible();
});

test('emptyText override renders the custom string on the empty path', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-i18n--empty-text-override'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  await expect(root.getByText('No records found.')).toBeVisible();
  await expect(root.getByText('데이터가 없습니다.')).toHaveCount(0);
});
