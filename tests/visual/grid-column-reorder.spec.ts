import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-65 G-1 — header column drag reorder. GUARD for the reorderColumnOrder extraction/refactor
// of useColumnDrag.onDrop (no chromium coverage existed before). useColumnDrag is ref-keyed
// (dragSourceId.current + dataTransfer optional), so dispatchEvent drives it (LESS-009 / MOD-33 pattern).
// ★behavior: dragging the First header onto Third reorders columns insert-before → Second, First, Third.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('dragging a header onto another reorders columns (insert-before)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-column-reorder--default'));
  const root = page.locator('#storybook-root');
  await root.locator('thead').first().waitFor({ state: 'visible' });
  const headers = root.locator('thead th');

  // initial column order.
  await expect(headers.nth(0)).toContainText('First');
  await expect(headers.nth(1)).toContainText('Second');
  await expect(headers.nth(2)).toContainText('Third');

  // drag First onto Third → First removed, re-inserted before Third → [Second, First, Third].
  const first = root.locator('thead th', { hasText: 'First' });
  const third = root.locator('thead th', { hasText: 'Third' });
  await first.dispatchEvent('dragstart');
  await third.dispatchEvent('dragover');
  await third.dispatchEvent('drop');

  await expect(headers.nth(0), 'col0 now Second').toContainText('Second');
  await expect(headers.nth(1), 'col1 now First (moved)').toContainText('First');
  await expect(headers.nth(2), 'col2 still Third').toContainText('Third');
});
