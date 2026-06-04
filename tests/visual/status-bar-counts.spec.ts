import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-33 G-1 — status-bar built-in counts. ★non-vacuous: with a filter AND a selection active,
// total / filtered / selected must all DIVERGE — a "filtered wired to total" (or wrong row model)
// bug renders three plausible-but-equal numbers and a "count is shown" test would still pass.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('total / filtered / selected diverge under filter + selection', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-pro-panel-statusbarcounts--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const bar = root.locator('[data-testid="statusbar"]');

  // baseline: total 5, filtered 5 (no filter), selected 0.
  await expect(bar).toContainText('전체');
  await expect(bar).toContainText('5');

  // filter to "Seoul" → 3 rows; select 2 of the visible rows.
  await root.locator('[data-testid="filter"]').fill('Seoul');
  await expect(root.locator('tbody tr')).toHaveCount(3); // filtered view
  await root.locator('tbody tr').nth(0).locator('input[type="checkbox"]').check();
  await root.locator('tbody tr').nth(1).locator('input[type="checkbox"]').check();

  // ★ the three counts now diverge: total=5, filtered=3, selected=2.
  const seg = (label: string) =>
    bar.locator('span.inline-flex', { hasText: label });
  await expect(seg('전체'), 'total = core row model (5, pre-filter)').toContainText('5');
  await expect(seg('필터됨'), 'filtered = filtered row model (3)').toContainText('3');
  await expect(seg('선택'), 'selected = selected row model (2)').toContainText('2');

  // explicit divergence: no two are equal (the wrong-model bug fails here).
  const total = (await seg('전체').innerText()).match(/\d+/)?.[0];
  const filtered = (await seg('필터됨').innerText()).match(/\d+/)?.[0];
  const selected = (await seg('선택').innerText()).match(/\d+/)?.[0];
  expect(new Set([total, filtered, selected]).size, 'all three counts distinct').toBe(3);
});
