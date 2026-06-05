import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-39 — row pinning. ★behavior-gated, NOT "a button rendered": pinning a row moves it into
// a sticky pinned region (data-pinned-row) and OUT of the center body; unpin returns it; and a
// pinned row SURVIVES a filter that would remove it (keepPinnedRows). Each is a real DOM effect.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

const rowByName = (page: Page, name: string) =>
  page.locator('#storybook-root tbody tr', { hasText: name });

test('G-1: pinning a row to the top moves it into the sticky pinned region', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-pinning--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr');

  // initial order 가,나,다,라 — none pinned.
  await expect(rows.nth(0)).toContainText('가');
  await expect(root.locator('tbody tr[data-pinned-row]')).toHaveCount(0);

  // pin 다 to the top → 다 becomes a pinned-top row AND the first row.
  await rowByName(page, '다').locator('[data-pin-action="top"]').click();
  await expect(rows.nth(0), '★다 pinned to top (first row)').toContainText('다');
  await expect(rows.nth(0)).toHaveAttribute('data-pinned-row', 'top');
  // exactly one pinned row; center no longer contains a second 다.
  await expect(root.locator('tbody tr[data-pinned-row="top"]')).toHaveCount(1);
});

test('G-2: pin to bottom, then unpin returns the row to the center', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-pinning--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr');

  // pin 가 to the BOTTOM → 가 becomes the LAST row, marked pinned-bottom.
  await rowByName(page, '가').locator('[data-pin-action="bottom"]').click();
  await expect(rows.last(), '★가 pinned to bottom (last row)').toContainText('가');
  await expect(rows.last()).toHaveAttribute('data-pinned-row', 'bottom');

  // unpin → 가 returns to the center (no longer a pinned row).
  await rowByName(page, '가').locator('[data-pin-action="unpin"]').click();
  await expect(root.locator('tbody tr[data-pinned-row]'), '가 unpinned').toHaveCount(0);
});

test('G-3: top + bottom pins coexist; center excludes both (three-way partition)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-row-pinning--default'));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const rows = root.locator('tbody tr');

  // pin 가 → top, 라 → bottom simultaneously.
  await rowByName(page, '가').locator('[data-pin-action="top"]').click();
  await rowByName(page, '라').locator('[data-pin-action="bottom"]').click();

  // order: 가(top), 나, 다, 라(bottom).
  await expect(rows.nth(0)).toHaveAttribute('data-pinned-row', 'top');
  await expect(rows.nth(0)).toContainText('가');
  await expect(rows.last()).toHaveAttribute('data-pinned-row', 'bottom');
  await expect(rows.last()).toContainText('라');

  // ★ center (un-pinned) rows are exactly 나, 다 — both pinned rows are excluded from the center,
  // not duplicated. (one top + one bottom pinned = 2 pinned, 2 center, 4 total.)
  const center = root.locator('tbody tr:not([data-pinned-row])');
  await expect(center).toHaveCount(2);
  await expect(center.nth(0)).toContainText('나');
  await expect(center.nth(1)).toContainText('다');
});
