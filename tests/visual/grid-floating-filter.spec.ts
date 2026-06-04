import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// MOD-GRID-30 G-1 — floating filters. The real "done" (advisor) is not "an input filters rows" but
// that the floating row composes with the contracts a new <thead> row inherits: ARIA accounting +
// axe (MOD-28), column virtualization alignment (MOD-27), and shared-state with the popover filter.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const GRID_ARIA_RULES = [
  'aria-required-children', 'aria-required-parent', 'aria-roles',
  'aria-allowed-attr', 'aria-valid-attr-value', 'aria-valid-attr',
];

test('floating row = extra header row: ARIA accounting holds + axe clean + input filters rows', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('filter-ui-floatingfilters--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  // thead now has 2 rows: the real header row + the floating filter row.
  await expect(root.locator('thead tr')).toHaveCount(2);
  // floating row counts as a header row → aria-rowcount = 2 header + 6 data = 8.
  const table = root.locator('table[role="grid"]').first();
  expect(Number(await table.getAttribute('aria-rowcount'))).toBe(8);
  // floating row is the 2nd header row; first data row is pushed to absolute index 3.
  expect(Number(await root.locator('thead tr').nth(1).getAttribute('aria-rowindex'))).toBe(2);
  expect(Number(await root.locator('tbody tr[role="row"]').first().getAttribute('aria-rowindex'))).toBe(3);

  // axe — the grid contract must survive a header row full of <input>s.
  const results = await new AxeBuilder({ page })
    .include('#storybook-root')
    .withRules(GRID_ARIA_RULES)
    .analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([]);

  // a11y: each floating input has a DISTINCT, column-associated accessible name (not a shared
  // "필터" — the SR-ambiguity MOD-28 closed; the grid-contract axe subset doesn't catch this).
  const nameLabel = await root.locator('thead tr[aria-rowindex="2"] th:nth-child(1) input').getAttribute('aria-label');
  const cityLabel = await root.locator('thead tr[aria-rowindex="2"] th:nth-child(2) input').getAttribute('aria-label');
  expect(nameLabel).toBe('이름 필터');
  expect(cityLabel).toBe('도시 필터');
  expect(nameLabel).not.toBe(cityLabel);

  // the floating text input on 'name' filters the body (debounced).
  await root.locator('thead tr[aria-rowindex="2"] th:nth-child(1) input').fill('김');
  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(1);
  await expect(root.locator('tbody')).toContainText('김철수');
});

test('number floating filter (= operator) filters by exact value', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('filter-ui-floatingfilters--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });
  // score column is the 3rd; exact match 95 → only 최지우.
  await root.locator('thead tr[aria-rowindex="2"] th:nth-child(3) input').fill('95');
  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(1);
  await expect(root.locator('tbody')).toContainText('최지우');
});

test('shared-state: popover filter writes the column state, floating input reflects it', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('filter-ui-floatingfilters--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  // set the filter via the POPOVER on 'name'…
  await root.locator('thead tr[aria-rowindex="1"] th:nth-child(1) button[aria-label="필터"]').click();
  await page.locator('[role="dialog"] input[aria-label="필터 값"]').fill('이');
  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(1);

  // …the always-visible floating input on the SAME column reflects it — it reads/syncs
  // column.getFilterValue(). Proves one shared state, not two parallel filters.
  // (The reverse display direction is limited by the popover TextFilter's mount-once input state,
  // a pre-existing MOD-09 limitation; the shared underlying column state is what's asserted here.)
  await expect(root.locator('thead tr[aria-rowindex="2"] th:nth-child(1) input')).toHaveValue('이');
});

test('column virtualization: floating cells align with their header cells (same window)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('filter-ui-floatingfilters--column-virtualized'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  // floating row present under virtualization.
  await expect(root.locator('thead tr')).toHaveCount(2);
  const headerRow = root.locator('thead tr').nth(0);
  const floatingRow = root.locator('thead tr').nth(1);
  // same windowed segment → same cell count.
  const hCount = await headerRow.locator('th').count();
  const fCount = await floatingRow.locator('th').count();
  expect(fCount).toBe(hCount);

  // pinned-left (first) and pinned-right (last) cells must align in x with their header cells —
  // if the floating row rendered all columns while the header windowed, these would drift.
  const xOf = async (loc: ReturnType<Page['locator']>) => (await loc.boundingBox())!.x;
  expect(Math.round(await xOf(floatingRow.locator('th').first())))
    .toBe(Math.round(await xOf(headerRow.locator('th').first())));
  expect(Math.round(await xOf(floatingRow.locator('th').last())))
    .toBe(Math.round(await xOf(headerRow.locator('th').last())));
  // …and a CENTER (windowed) cell — the actual drift risk (edges are pinned, always aligned).
  const mid = Math.floor(hCount / 2);
  expect(Math.round(await xOf(floatingRow.locator('th').nth(mid))))
    .toBe(Math.round(await xOf(headerRow.locator('th').nth(mid))));
});
