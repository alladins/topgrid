import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-37 G-3 — suppress multi-sort key (alwaysMultiSort). ★non-vacuous: clicking the 2nd header
// WITHOUT shift ACCUMULATES (both columns end up sorted), instead of the default replace-behavior
// where the 2nd click would reset the 1st column's sort to none. Asserting both aria-sort values
// are active after two plain clicks is the divergence a replace-on-click implementation fails.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('plain clicks on two headers accumulate sorts (no shift needed)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-always-multi-sort--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const deptHeader = root.locator('thead th', { hasText: '부서' });
  const scoreHeader = root.locator('thead th', { hasText: '점수' });

  // plain-click 부서 → it sorts.
  await deptHeader.click();
  await expect(deptHeader).not.toHaveAttribute('aria-sort', 'none');

  // plain-click 점수 (NO shift) → 점수 sorts AND 부서 STAYS sorted (accumulated, not replaced).
  await scoreHeader.click();
  await expect(scoreHeader, '점수 sorted').not.toHaveAttribute('aria-sort', 'none');
  await expect(deptHeader, '★부서 still sorted — plain click accumulated, did not reset').not.toHaveAttribute(
    'aria-sort',
    'none',
  );
});
