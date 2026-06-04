import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-30 G-3 — multi-condition (AND/OR) filter (Pro). Browser verifies the builder composes the
// compound value and the grid filters accordingly; plus the PAT-003 license gate's REAL behavior
// (watermark when unlicensed), not just "checkLicense is called".
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test('OR text: two conditions union the matches', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('pro-multifilter--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  await root.locator('button[aria-label="name 복합 필터"]').click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  // name contains 김 OR contains 이 → 김철수 + 이영희.
  await dialog.locator('input[aria-label="조건1 값"]').fill('김');
  await dialog.locator('input[aria-label="조건2 값"]').fill('이');
  await dialog.locator('input[aria-label="OR"]').check();

  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(2);
  await expect(root.locator('tbody')).toContainText('김철수');
  await expect(root.locator('tbody')).toContainText('이영희');
});

test('AND number: a range (>=80 AND <=90) intersects', async ({ page }: { page: Page }) => {
  await page.goto(FRAME('pro-multifilter--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  await root.locator('button[aria-label="score 복합 필터"]').click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  // score >= 80 AND <= 90 → 90, 88, 81 (김철수·박민준·강수진); excludes 78, 95, 62.
  await dialog.locator('select[aria-label="조건1 연산자"]').selectOption('>=');
  await dialog.locator('input[aria-label="조건1 값"]').fill('80');
  await dialog.locator('select[aria-label="조건2 연산자"]').selectOption('<=');
  await dialog.locator('input[aria-label="조건2 값"]').fill('90');
  // AND is the default; assert it stays checked.
  await expect(dialog.locator('input[aria-label="AND"]')).toBeChecked();

  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(3);
  await expect(root.locator('tbody')).not.toContainText('최지우'); // 95 excluded
  await expect(root.locator('tbody')).not.toContainText('정해인'); // 62 excluded
});

test('★ OR with one empty condition does NOT collapse to all rows (spine in the real UI)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('pro-multifilter--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });

  await root.locator('button[aria-label="name 복합 필터"]').click();
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  // only the first condition filled (이), OR selected, second left empty → must be 이영희 only,
  // NOT all 6 rows (the empty-condition trap the pure core guards against).
  await dialog.locator('input[aria-label="조건1 값"]').fill('이');
  await dialog.locator('input[aria-label="OR"]').check();

  await expect(root.locator('tbody tr[role="row"]')).toHaveCount(1);
  await expect(root.locator('tbody')).toContainText('이영희');
});

test('PAT-003: unlicensed → watermark; licensed → NO watermark (gate is bound to license state)', async ({
  page,
}: { page: Page }) => {
  // unlicensed → the Pro builder shows the watermark.
  await page.goto(FRAME('pro-multifilter--unlicensed'));
  let root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });
  await root.locator('button[aria-label="name 복합 필터"]').click();
  let dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await expect(dialog.getByText(/Unlicensed/i)).toBeVisible();

  // ★ licensed → the SAME builder has NO watermark. Without this, a useLicenseStatus that always
  // returned watermarkRequired (watermark for paying customers too) would still pass (the watermark
  // is pointer-events-none, so it never blocks the OR/AND tests). This pins the gate to the state.
  await page.goto(FRAME('pro-multifilter--default'));
  root = page.locator('#storybook-root');
  await root.locator('table thead').first().waitFor({ state: 'visible' });
  await root.locator('button[aria-label="name 복합 필터"]').click();
  dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  await expect(dialog.getByText(/Unlicensed/i)).toHaveCount(0);
});
