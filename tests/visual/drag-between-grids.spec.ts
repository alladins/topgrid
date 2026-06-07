import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-66 — drag-between-grids. The dragged row id is lifted to consumer state above both grids
// (consumer-owns-payload, LESS-009) so the handlers never touch dataTransfer → bare dispatchEvent drives
// them (MOD-33/64/65 pattern). ★end-to-end: dragging Banana out of the left grid and dropping on the
// right grid actually MOVES the row (transferRow) — it leaves the left and appears in the right.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('dragging a row from one grid and dropping on another transfers it', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-drag-between-grids--default'));
  const root = page.locator('#storybook-root');
  const left = root.locator('[data-grid="left"]');
  const right = root.locator('[data-grid="right"]');
  await left.locator('table').first().waitFor({ state: 'visible' });

  // initial: Banana is in the LEFT grid, not the right.
  await expect(left.getByText('Banana', { exact: true })).toHaveCount(1);
  await expect(right.getByText('Banana', { exact: true })).toHaveCount(0);
  // the source rows are draggable (onRowDragStart wired).
  const bananaRow = left.locator('tbody tr', { hasText: 'Banana' });
  expect(await bananaRow.getAttribute('draggable')).toBe('true');

  // drag Banana out of the left grid → drop onto the right grid body.
  await bananaRow.dispatchEvent('dragstart');
  const rightTable = right.locator('table').first();
  await rightTable.dispatchEvent('dragover');
  await rightTable.dispatchEvent('drop');

  // ★ the row transferred: gone from left, present in right.
  await expect(left.getByText('Banana', { exact: true }), 'Banana left the left grid').toHaveCount(0);
  await expect(right.getByText('Banana', { exact: true }), 'Banana appeared in the right grid').toHaveCount(1);
  // the other left rows remain.
  await expect(left.getByText('Apple', { exact: true })).toHaveCount(1);
  await expect(left.getByText('Cherry', { exact: true })).toHaveCount(1);
});
