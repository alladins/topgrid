import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-38 G-1 — column header menu, sort actions. ★behavior-gated, NOT "menu opened": clicking
// "오름차순 정렬" actually reorders the rows; and merely OPENING the menu must NOT sort (the menu
// lives in the <th> whose own click sorts — stopPropagation must isolate it). Both are real bugs a
// "the menu is visible" test would miss.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

const names = (page: Page) =>
  page.locator('#storybook-root tbody tr td:first-child');

test('opening the menu does not sort; clicking "오름차순" actually sorts the rows', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-column-menu--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // initial unsorted order: C, A, B.
  await expect(names(page)).toHaveText(['C', 'A', 'B']);

  // open the menu — ★ this must NOT trigger the header's sort (stopPropagation).
  await root.locator('summary[aria-label="name 컬럼 메뉴"]').click();
  await expect(root.locator('[data-column-menu-list]')).toBeVisible();
  await expect(names(page), 'opening the menu did not sort').toHaveText(['C', 'A', 'B']);

  // click "오름차순 정렬" → rows actually sort ascending A, B, C.
  await root.locator('[data-menu-action="sort-asc"]').click();
  await expect(names(page), 'sort asc applied').toHaveText(['A', 'B', 'C']);
  await expect(root.locator('thead th', { hasText: '이름' })).toHaveAttribute('aria-sort', 'ascending');

  // reopen → "내림차순 정렬" → C, B, A.
  await root.locator('summary[aria-label="name 컬럼 메뉴"]').click();
  await root.locator('[data-menu-action="sort-desc"]').click();
  await expect(names(page)).toHaveText(['C', 'B', 'A']);
});
