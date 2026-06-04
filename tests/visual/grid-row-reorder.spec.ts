import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-33 G-3 — row drag reorder. HTML5 native DnD isn't simulated by Playwright's mouse-based
// dragTo, but the handlers key off React state (not dataTransfer), so dispatching the DnD events
// directly drives them. ★ behavior assertion: dragging row 0 onto row 2 actually REORDERS the
// displayed rows (moveRow applied), not just "a drop happened".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('dragging a row onto another reorders the displayed order', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-reorder--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const dataRows = root.locator('tbody tr[role="row"]');

  // initial order: 김철수, 이영희, 박민준. rows are draggable.
  await expect(dataRows.nth(0)).toContainText('김철수');
  expect(await dataRows.nth(0).getAttribute('draggable')).toBe('true');

  // drag row 0 (김철수) → drop on row 2 (박민준): moveRow(0,2) → [이영희, 박민준, 김철수].
  await dataRows.nth(0).dispatchEvent('dragstart');
  await dataRows.nth(2).dispatchEvent('dragover');
  await dataRows.nth(2).dispatchEvent('drop');

  await expect(dataRows.nth(0), 'row0 now 이영희').toContainText('이영희');
  await expect(dataRows.nth(1), 'row1 now 박민준').toContainText('박민준');
  await expect(dataRows.nth(2), 'row2 now 김철수 (moved down)').toContainText('김철수');

  // move it back up: drag the now-last 김철수 (idx 2) onto row 0.
  await dataRows.nth(2).dispatchEvent('dragstart');
  await dataRows.nth(0).dispatchEvent('dragover');
  await dataRows.nth(0).dispatchEvent('drop');
  await expect(dataRows.nth(0), 'row0 back to 김철수').toContainText('김철수');
});

test('★ pagination: reorder on page 2 uses the DATA index (moves the right rows)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-reorder--paginated'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const dataRows = root.locator('tbody tr[role="row"]');

  // page 1 shows 김철수, 이영희 (data idx 0,1). go to the next page.
  await expect(dataRows.nth(0)).toContainText('김철수');
  await root.locator('button[aria-label="다음 페이지"]').click();
  // page 2 shows 박민준, 최지우 (data idx 2,3; page-relative pos 0,1).
  await expect(dataRows.nth(0)).toContainText('박민준');
  await expect(dataRows.nth(1)).toContainText('최지우');

  // drag page-2 row0 (박민준, data idx 2) onto page-2 row1 (최지우, data idx 3) → moveRow(2,3).
  // if onRowReorder passed the page-relative index (0,1) it would move page-1 rows instead — wrong.
  await dataRows.nth(0).dispatchEvent('dragstart');
  await dataRows.nth(1).dispatchEvent('dragover');
  await dataRows.nth(1).dispatchEvent('drop');

  // setRows → new data → autoResetPageIndex returns the view to page 1. ★ page 1 must be UNCHANGED
  // (the fix moved data idx 2,3, not 0,1 — the bug would have swapped 김철수/이영희 here).
  await expect(dataRows.nth(0), 'page-1 row0 still 김철수 (fix did NOT touch page 1)').toContainText('김철수');
  await expect(dataRows.nth(1), 'page-1 row1 still 이영희').toContainText('이영희');
  // page 2 holds the swap (data idx 2,3 reordered).
  await root.locator('button[aria-label="다음 페이지"]').click();
  await expect(dataRows.nth(0), 'page-2 row0 now 최지우 (idx2)').toContainText('최지우');
  await expect(dataRows.nth(1), 'page-2 row1 now 박민준 (idx3)').toContainText('박민준');
});
