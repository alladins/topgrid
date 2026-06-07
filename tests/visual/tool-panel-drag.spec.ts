import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-65 G-2 — ToolPanel drag-to-reorder. ToolPanel is STATELESS (renders `columns` from props,
// emits onColumnDrop); it cannot reorder its own rows without the consumer feeding back new props.
// So asserting the rendered row order changes is non-vacuous (advisor) — it proves the full chain:
// drag → onColumnDrop(source,target) → reorderColumnOrder (insert-before) → consumer setState → re-render.
// Ref-keyed handlers (LESS-009) → dispatchEvent drives them.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('dragging a tool-panel row onto another reorders the rows (consumer re-renders)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-panel-panels--tool-panel-drag-story'));
  const root = page.locator('#storybook-root');
  await root.locator('[data-colrow]').first().waitFor({ state: 'visible' });
  const rows = root.locator('[data-colrow]');

  // initial order: Region, Sales, Units.
  await expect(rows.nth(0)).toHaveAttribute('data-colrow', 'region');
  await expect(rows.nth(1)).toHaveAttribute('data-colrow', 'sales');
  await expect(rows.nth(2)).toHaveAttribute('data-colrow', 'units');
  expect(await rows.nth(0).getAttribute('draggable')).toBe('true');

  // drag Region onto Units → Region removed, re-inserted before Units → [Sales, Region, Units].
  const region = root.locator('[data-colrow="region"]');
  const units = root.locator('[data-colrow="units"]');
  await region.dispatchEvent('dragstart');
  await units.dispatchEvent('dragover');
  await units.dispatchEvent('drop');

  await expect(rows.nth(0), 'row0 now Sales').toHaveAttribute('data-colrow', 'sales');
  await expect(rows.nth(1), 'row1 now Region (moved)').toHaveAttribute('data-colrow', 'region');
  await expect(rows.nth(2), 'row2 still Units').toHaveAttribute('data-colrow', 'units');

  // drag it back: Region onto Sales → [Region, Sales, Units].
  await root.locator('[data-colrow="region"]').dispatchEvent('dragstart');
  await root.locator('[data-colrow="sales"]').dispatchEvent('dragover');
  await root.locator('[data-colrow="sales"]').dispatchEvent('drop');
  await expect(rows.nth(0), 'row0 back to Region').toHaveAttribute('data-colrow', 'region');
});
