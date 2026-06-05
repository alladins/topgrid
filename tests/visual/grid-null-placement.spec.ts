import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-37 G-2 — direction-independent null placement. ★the whole feature in one assertion: the
// blank row stays at the BOTTOM whether sorting ascending OR descending — it does NOT flip to the
// top when direction flips, while the non-null rows reverse around it. An ascending-only test would
// pass under plain null-coercion and prove nothing.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('blank rows stay at the bottom for both asc and desc (non-nulls flip around them)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-null-placement--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const names = root.locator('tbody tr td:first-child');
  const scoreHeader = root.locator('thead th', { hasText: '점수' });

  // scores: A=30, B=null, C=10, D=20. numeric columns sort DESC first (TanStack sortDescFirst).
  // first click → descending: A(30), D(20), C(10), then B(null) LAST.
  await scoreHeader.click();
  await expect(names).toHaveText(['A', 'D', 'C', 'B']);

  // second click → ascending: non-nulls reverse (C, D, A) but B(null) is STILL LAST (not flipped up).
  await scoreHeader.click();
  await expect(names).toHaveText(['C', 'D', 'A', 'B']);

  // ★ the discriminator: B (null) occupies the last row in BOTH orderings.
  await expect(names.last()).toHaveText('B');
});
