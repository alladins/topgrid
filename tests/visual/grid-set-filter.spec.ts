import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-30 G-2 — set/faceted filter OOTB. The grid uses grid-core <Grid enableFilter> and
// supplies NO faceted models; the SelectFilter's distinct values + counts can therefore only come
// from buildTableOptions' faceted wiring. Asserting the COUNTS (not just "list non-empty") is the
// gap-analysis claim: SelectFilter was shipped-but-inert (empty list) without consumer wiring.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('SelectFilter populates distinct values + counts out of the box (grid-core faceted wiring)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('filter-ui-setfilterootb--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  // open the city SelectFilter popover.
  await root.locator('button[aria-label="city 필터"]').click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });

  // exactly 3 distinct cities, each with its facet count — populated only via grid-core wiring.
  await expect(dialog.locator('li')).toHaveCount(3);
  await expect(dialog.locator('li').filter({ hasText: '서울' })).toContainText('(3)');
  await expect(dialog.locator('li').filter({ hasText: '부산' })).toContainText('(2)');
  await expect(dialog.locator('li').filter({ hasText: '대구' })).toContainText('(1)');
});

test('selecting a faceted value filters the grid', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('filter-ui-setfilterootb--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  await root.locator('button[aria-label="city 필터"]').click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.locator('li').filter({ hasText: '대구' }).locator('input[type="checkbox"]').check();

  // 대구 → only 최지우.
  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(1);
  await expect(root.locator('tbody')).toContainText('최지우');
});
