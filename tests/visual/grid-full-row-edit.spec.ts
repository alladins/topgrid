import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-50 — full-row editing. ★behavior-gated, non-vacuous (advisor): "an input appeared" is
// vacuous (per-cell editing already does that). The real assertions:
//  1) entering row-edit makes ≥2 cells editors AT ONCE; a different row stays in view mode.
//  2) edit two → save → BOTH apply in one update.
//  3) edit two → cancel → BOTH revert (no partial commit).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-core-grid-full-row-edit--default';
const rows = (page: Page): Locator => page.locator('#storybook-root tbody tr');

test('G-2: row-edit turns ≥2 cells into editors at once; the other row stays in view mode', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });
  const row1 = rows(page).nth(0);
  const row2 = rows(page).nth(1);

  // both rows start in view mode — no inputs anywhere.
  await expect(page.locator('#storybook-root tbody input')).toHaveCount(0);

  await row1.locator('[data-action="edit"]').click();

  // ★ row 1: BOTH editable cells (name + score) become inputs simultaneously.
  await expect(row1.locator('input'), '★≥2 editors at once').toHaveCount(2);
  // row 2 stays in view mode (no inputs, still shows its 편집 button).
  await expect(row2.locator('input'), 'other row stays view').toHaveCount(0);
  await expect(row2.locator('[data-action="edit"]')).toBeVisible();
});

test('G-2: save commits BOTH edited cells in one update; the other row is untouched', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });
  const row1 = rows(page).nth(0);
  const row2 = rows(page).nth(1);

  await row1.locator('[data-action="edit"]').click();
  // fill name then score (filling score blurs name → its onCommit stores into the row draft).
  await row1.locator('input').nth(0).fill('Alice2');
  await row1.locator('input').nth(1).fill('15');
  // save (blurs score → its onCommit stores) → commitRow emits ONE merged row.
  await row1.locator('[data-action="save"]').click();

  // ★ both cells applied together.
  await expect(row1.locator('[data-view-cell="name"]')).toHaveText('Alice2');
  await expect(row1.locator('[data-view-cell="score"]')).toHaveText('15');
  // row 1 back in view mode (no inputs).
  await expect(row1.locator('input')).toHaveCount(0);
  // row 2 untouched.
  await expect(row2.locator('[data-view-cell="name"]')).toHaveText('Bob');
  await expect(row2.locator('[data-view-cell="score"]')).toHaveText('20');
});

test('G-2: cancel reverts BOTH edited cells (no partial commit)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });
  const row1 = rows(page).nth(0);

  await row1.locator('[data-action="edit"]').click();
  await row1.locator('input').nth(0).fill('ZZZ');
  await row1.locator('input').nth(1).fill('999');
  // cancel → discard the whole row draft, emit nothing.
  await row1.locator('[data-action="cancel"]').click();

  // ★ both revert to the original values — not one, not the other.
  await expect(row1.locator('[data-view-cell="name"]')).toHaveText('Alice');
  await expect(row1.locator('[data-view-cell="score"]')).toHaveText('10');
  await expect(row1.locator('input')).toHaveCount(0);
});
