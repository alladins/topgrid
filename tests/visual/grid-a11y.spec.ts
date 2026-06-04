import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// MOD-GRID-28 G-1 — base <Grid> WAI-ARIA grid semantics. axe-core is the gate (a hand-rolled
// "role=grid exists" grep is the vacuous version — LESS-006). Also asserts the SPINE: under row
// virtualization a windowed row at an arbitrary DOM position reports its ABSOLUTE aria-rowindex.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
// row + column virtualization story (flat header → headerRowCount = 1).
const ID = 'grid-core-grid-column-virtualization--column-and-row-virtualized';

const GRID_ARIA_RULES = [
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-allowed-attr',
  'aria-valid-attr-value',
  'aria-valid-attr',
];

async function axeGridViolations(page: Page) {
  const r = await new AxeBuilder({ page }).include('#storybook-root').withRules(GRID_ARIA_RULES).analyze();
  return r.violations;
}

test('grid exposes a complete, valid WAI-ARIA grid (axe-core: 0 violations of grid rules)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // container has role=grid + absolute counts.
  const table = root.locator('table[role="grid"]').first();
  await expect(table, 'table has role=grid').toBeVisible();
  expect(Number(await table.getAttribute('aria-rowcount')), 'aria-rowcount = 1 header + 100 rows').toBe(101);
  expect(Number(await table.getAttribute('aria-colcount')), 'aria-colcount = 22 cols').toBe(22);

  // axe — the grid-contract rules: role=grid must have role=row children, cells must have the
  // right roles/parents, all aria attrs valid. These are exactly what a partial grid fails.
  const results = await new AxeBuilder({ page })
    .include('#storybook-root')
    .withRules([
      'aria-required-children',
      'aria-required-parent',
      'aria-roles',
      'aria-allowed-attr',
      'aria-valid-attr-value',
      'aria-valid-attr',
    ])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([]);
});

test('SPINE: windowed rows/cells report ABSOLUTE aria-rowindex/colindex (not DOM position)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // scroll down so the rendered rows are a window far from the top.
  await root.locator('div:has(> table)').first().evaluate((el) => el.scrollTo(0, 1500));
  await page.waitForTimeout(200);

  // every visible data row: aria-rowindex === data-index + 2 (1 header row → +1, +1 for 1-based).
  const rows = root.locator('tbody tr[data-index]');
  const n = await rows.count();
  expect(n, 'some rows rendered').toBeGreaterThan(2);
  let checkedFar = false;
  for (let i = 0; i < n; i++) {
    const di = Number(await rows.nth(i).getAttribute('data-index'));
    const ari = Number(await rows.nth(i).getAttribute('aria-rowindex'));
    expect(ari, `row data-index ${di} → absolute aria-rowindex`).toBe(di + 2);
    if (di > 20) checkedFar = true; // non-vacuous: a windowed (not top) row, absolute index ≠ DOM pos
  }
  expect(checkedFar, 'verified a windowed row far from the top (absolute, not DOM position)').toBe(true);

  // header cells carry role=columnheader + absolute aria-colindex (1..22).
  const headerCells = root.locator('thead tr th[role="columnheader"]');
  expect(await headerCells.count(), 'columnheader cells present').toBeGreaterThan(2);
  const firstColIdx = Number(await headerCells.first().getAttribute('aria-colindex'));
  expect(firstColIdx, 'first columnheader aria-colindex = 1').toBe(1);
});

test('grouped/multi-row header: group cells omit aria-colindex; rows numbered past the header rows', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-a11y--grouped-header'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });

  // a group/spanning header maps to no single column → must NOT emit an (invalid) aria-colindex=0.
  expect(await root.locator('[aria-colindex="0"]').count(), 'no aria-colindex=0 anywhere').toBe(0);

  // 2 header rows → aria-rowindex 1 and 2; first data row = 3.
  const headerRows = root.locator('thead tr');
  expect(await headerRows.count(), '2 header rows').toBe(2);
  expect(await headerRows.nth(0).getAttribute('aria-rowindex')).toBe('1');
  expect(await headerRows.nth(1).getAttribute('aria-rowindex')).toBe('2');
  const firstData = root.locator('tbody tr[data-index]').first();
  expect(await firstData.getAttribute('aria-rowindex'), 'first data row after 2 header rows = 3').toBe('3');

  expect(await axeGridViolations(page), 'grouped grid axe-clean').toEqual([]);
});

test('plain (non-virtual) grid is axe-clean', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-a11y--plain'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  expect(await root.locator('table[role="grid"]').count()).toBe(1);
  expect(await axeGridViolations(page), 'plain grid axe-clean').toEqual([]);
});

test('empty grid still satisfies the grid contract (axe-clean)', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-a11y--empty'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  expect(await axeGridViolations(page), 'empty grid axe-clean (role=row/gridcell on empty-state)').toEqual([]);
});
