import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-38 — column header menu (sort G-1 / pin G-2 / hide G-3). ★behavior-gated, NOT "menu
// opened": each action produces the real DOM effect — sort reorders rows, pin moves the column into
// the pinned region, hide removes the column. Menu interactions are scoped per column (both headers
// carry a menu).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

const names = (page: Page) => page.locator('#storybook-root tbody tr td:first-child');

test('G-1: opening the menu does not sort; "오름차순" actually sorts the rows', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-column-menu--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const nameMenu = root.locator('[data-column-menu="name"]');

  // initial unsorted order: C, A, B.
  await expect(names(page)).toHaveText(['C', 'A', 'B']);

  // open the menu — ★ must NOT trigger the header's sort (stopPropagation).
  await nameMenu.locator('summary').click();
  await expect(nameMenu.locator('[data-column-menu-list]')).toBeVisible();
  await expect(names(page), 'opening the menu did not sort').toHaveText(['C', 'A', 'B']);

  // "오름차순 정렬" → rows actually sort ascending A, B, C.
  await nameMenu.locator('[data-menu-action="sort-asc"]').click();
  await expect(names(page), 'sort asc applied').toHaveText(['A', 'B', 'C']);
  await expect(root.locator('thead th', { hasText: '이름' })).toHaveAttribute('aria-sort', 'ascending');

  // reopen → "내림차순 정렬" → C, B, A.
  await nameMenu.locator('summary').click();
  await nameMenu.locator('[data-menu-action="sort-desc"]').click();
  await expect(names(page)).toHaveText(['C', 'B', 'A']);
});

test('G-2: "왼쪽 고정" moves the column into the pinned-left region (front)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-column-menu--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const headers = root.locator('thead th');
  const scoreMenu = root.locator('[data-column-menu="score"]');

  // initial column order: 이름, 점수.
  await expect(headers.nth(0)).toContainText('이름');
  await expect(headers.nth(1)).toContainText('점수');

  // 점수 menu → "왼쪽 고정" → 점수 becomes the FIRST column (pinned-left renders first).
  await scoreMenu.locator('summary').click();
  await scoreMenu.locator('[data-menu-action="pin-left"]').click();
  await expect(headers.nth(0), '★점수 moved to pinned-left front').toContainText('점수');
  await expect(headers.nth(1)).toContainText('이름');

  // unpin → center order restored (이름, 점수).
  await scoreMenu.locator('summary').click();
  await scoreMenu.locator('[data-menu-action="pin-clear"]').click();
  await expect(headers.nth(0)).toContainText('이름');
  await expect(headers.nth(1)).toContainText('점수');
});

test('G-3: "숨기기" actually removes the column from the grid', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-column-menu--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const headers = root.locator('thead th');

  // both columns present.
  await expect(headers).toHaveCount(2);

  // 점수 menu → "숨기기" → 점수 column is removed (header + its cells gone).
  await root.locator('[data-column-menu="score"] summary').click();
  await root.locator('[data-column-menu="score"] [data-menu-action="hide"]').click();
  await expect(headers, '★점수 column removed').toHaveCount(1);
  await expect(headers.nth(0)).toContainText('이름');
  // body rows now render a single cell each (the 점수 column's cells are gone).
  await expect(root.locator('tbody tr').first().locator('td')).toHaveCount(1);
});
