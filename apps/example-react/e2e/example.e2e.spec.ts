import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke of @topgrid/grid (facade) in a real browser via the example app — proves a
// consumer-style install renders, sorts, and that the W3 DX surface (createColumns + getRowId +
// toGridCell) works against the published grid-core.

// First-column (이름) body cells, in row order.
const nameCells = (page: Page) => page.locator('#root tbody tr td:nth-child(1)');

test('grid renders the 3 rows (createColumns + facade)', async ({ page }: { page: Page }) => {
  await page.goto('/index.html');
  await page.getByRole('grid').waitFor({ state: 'visible' });
  expect(await nameCells(page).allTextContents()).toEqual(['김철수', '이영희', '박민수']); // input order
});

test('clicking the 나이 header sorts the rows live', async ({ page }: { page: Page }) => {
  await page.goto('/index.html');
  await page.getByRole('grid').waitFor({ state: 'visible' });
  const before = await nameCells(page).allTextContents();

  await page.getByRole('columnheader', { name: /나이/ }).click();
  const after = await nameCells(page).allTextContents();

  expect(after).not.toEqual(before); // ★ live re-sort, not a static render
  // ages 30/28/35 → sorted by age (asc or desc depending on the first-click heuristic).
  const asc = ['이영희', '김철수', '박민수']; // 28, 30, 35
  const desc = ['박민수', '김철수', '이영희']; // 35, 30, 28
  expect([JSON.stringify(asc), JSON.stringify(desc)]).toContain(JSON.stringify(after));
});

test('cell click reads value via toGridCell (no TanStack types)', async ({ page }: { page: Page }) => {
  await page.goto('/index.html');
  await page.getByRole('grid').waitFor({ state: 'visible' });
  await nameCells(page).first().click();
  // App's onCellClick does toGridCell(cell) → sets "name=<value>".
  await expect(page.locator('[data-clicked]')).toHaveText(/^name=/);
});
