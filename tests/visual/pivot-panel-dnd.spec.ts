import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-64 G-2 — PivotPanel drag-and-drop tool panel. HTML5 native DnD isn't simulated by
// Playwright's mouse dragTo, but the handlers key off a React ref (dragField), so dispatching the
// DnD events directly drives them (same proven pattern as grid-row-reorder, MOD-33).
//
// ★ end-to-end behavior assertion (advisor): dragging the `region` field into the Rows zone makes
// the wired PivotGrid actually RE-PIVOT — East/West row-dimension cells appear that were absent
// when there was no row dimension. NOT merely "a chip moved between zones".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('dragging `region` into Rows re-pivots the grid (East/West rows appear)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-pivot-pivotpanel--wired-to-grid'));
  const root = page.locator('#storybook-root');
  await root.locator('[data-zone="available"]').waitFor({ state: 'visible' });

  // Initial state: rows:[] → the PivotGrid has NO region row dimension → no East/West body cells.
  const grid = root.locator('table').first();
  await grid.waitFor({ state: 'visible' });
  await expect(grid.getByText('East', { exact: true }), 'no East row before drag').toHaveCount(0);
  await expect(grid.getByText('West', { exact: true }), 'no West row before drag').toHaveCount(0);

  // `region` chip lives in the Available zone (not yet assigned to any dimension).
  const regionChip = root.locator('[data-zone="available"] [data-field="region"]');
  await expect(regionChip, 'region starts in Available').toHaveCount(1);
  const rowsZone = root.locator('[data-zone="rows"]');

  // Drag region → Rows zone (ref-keyed handlers; dispatchEvent drives them).
  await regionChip.dispatchEvent('dragstart');
  await rowsZone.dispatchEvent('dragover');
  await rowsZone.dispatchEvent('drop');

  // ★ the grid re-pivoted: region is now a row dimension → East/West appear as row headers.
  await expect(grid.getByText('East', { exact: true }), 'East row appeared after drag').toHaveCount(1);
  await expect(grid.getByText('West', { exact: true }), 'West row appeared after drag').toHaveCount(1);
  // and the chip is now in the Rows zone, gone from Available.
  await expect(root.locator('[data-zone="rows"] [data-field="region"]')).toHaveCount(1);
  await expect(root.locator('[data-zone="available"] [data-field="region"]')).toHaveCount(0);
});
