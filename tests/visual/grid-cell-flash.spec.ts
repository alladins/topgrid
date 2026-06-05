import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-36 G-2 — cell change-flash. ★non-vacuous divergence: editing ONE cell flashes exactly
// that cell (not the whole row/grid), and a pure REORDER flashes NOTHING (identity diff, not index).
// A flash keyed by index would light up every cell after a reorder — this is the bug getRowId+the
// changed-cell diff prevent.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('editing a cell flashes only that cell', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-cell-flash--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // edit B.price (20 → 25).
  await root.locator('[data-testid="edit-b"]').click();

  // exactly one cell flashes, and it is B's price cell (now showing 25).
  const flashed = root.locator('td[data-flash]');
  await expect(flashed).toHaveCount(1);
  await expect(flashed.first()).toHaveText('25');
});

test('a pure reorder flashes nothing (identity, not index)', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-cell-flash--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr[role="row"]');
  await expect(rows.nth(0)).toContainText('사과'); // A first

  // reorder: move last (C) to front → C, A, B. Same values, different positions.
  await root.locator('[data-testid="reorder"]').click();
  await expect(rows.nth(0)).toContainText('체리'); // reorder applied

  // ★ NOTHING flashed — a reorder is not a value change. (index-keyed flash would light up rows.)
  await expect(root.locator('td[data-flash]')).toHaveCount(0);
});
