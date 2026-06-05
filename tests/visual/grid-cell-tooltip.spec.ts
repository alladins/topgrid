import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-36 G-3 — cell tooltip via getCellTooltip → native <td title>. ★non-vacuous: the title
// reflects the cell's VALUE (so it differs row-to-row, not a constant), and is ABSENT on columns
// where the callback returns undefined. A "title exists" test that ignores value/column would pass
// on a hardcoded or all-cells title.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('title reflects the cell value on the targeted column, absent elsewhere', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-cell-tooltip--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr[role="row"]');

  // name column = 2nd cell. title reflects the value and differs per row.
  await expect(rows.nth(0).locator('td').nth(1)).toHaveAttribute('title', '상세: 사과');
  await expect(rows.nth(1).locator('td').nth(1)).toHaveAttribute('title', '상세: 바나나');

  // sku column (1st cell) → callback returned undefined → NO title attribute.
  await expect(rows.nth(0).locator('td').nth(0)).not.toHaveAttribute('title', /.*/);
});
