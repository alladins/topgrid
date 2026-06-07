import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-49 — pagination completeness. ★behavior-gated, non-vacuous (LESS-006):
//  G-1 formatter changes the visible label but NOT the aria-label (raw integer preserved).
//  G-2 go-to-page jumps to a far page the sliding window can't reach in one click.
//  G-3 a taller viewport renders MORE rows (height → row-count divergence, not "is visible").
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const root = (page: Page) => page.locator('#storybook-root');

test('G-1: pageNumberFormat formats the button label but keeps aria-label raw', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-pagination-complete--page-number-format'));
  await root(page).locator('table').first().waitFor({ state: 'visible' });

  // page-1 button: aria-label stays the raw "페이지 1로 이동" (accessibility), text is formatted "P1".
  const page1 = root(page).locator('button[aria-label="페이지 1로 이동"]');
  await expect(page1, '★label formatted').toHaveText('P1');
  // divergence: the raw integer "1" is NOT the rendered text — formatter actually applied.
  await expect(page1).not.toHaveText('1');

  // a non-current page button is also formatted.
  await expect(root(page).locator('button[aria-label="페이지 2로 이동"]')).toHaveText('P2');
});

test('G-2: go-to-page input jumps to a far page (unreachable by sliding buttons)', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-pagination-complete--go-to-page'));
  await root(page).locator('table').first().waitFor({ state: 'visible' });

  const firstIdCell = () => root(page).locator('tbody tr').first().locator('td').first();

  // page 1 (rows 0..9): first id cell = "0".
  await expect(firstIdCell()).toHaveText('0');
  // the sliding window at page 1 shows pages 1..5 only — page 7 has no button.
  await expect(root(page).locator('button[aria-label="페이지 7로 이동"]')).toHaveCount(0);

  // type "7" → Enter. page 7 (0-based index 6) → rows 60..69 → first id cell = "60".
  const input = root(page).locator('[data-go-to-page] input');
  await input.fill('7');
  await input.press('Enter');
  await expect(firstIdCell(), '★jumped to page 7').toHaveText('60');
});

test('G-3: autoPageSize renders more rows when the viewport grows', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME('grid-core-grid-pagination-complete--auto-page-size'));
  await root(page).locator('table').first().waitFor({ state: 'visible' });

  const bodyRows = root(page).locator('tbody tr');
  await expect(bodyRows.first()).toBeVisible();

  // ★wait for autoPageSize to SETTLE: the grid first paints at its default pageSize, then the
  // effect measures the 280px viewport and shrinks pageSize. Capture the settled small count
  // (poll absorbs both the default-pageSize transient and the RO async).
  await expect.poll(async () => bodyRows.count(), {
    message: 'settled to a height-bounded page',
  }).toBeLessThan(15);
  const before = await bodyRows.count();
  expect(before, 'small viewport → few rows, not the full dataset').toBeGreaterThan(2);

  // grow the viewport to 560px → ResizeObserver → computeAutoPageSize → larger pageSize.
  await page.locator('#ap-viewport').evaluate((el) => {
    (el as HTMLElement).style.height = '560px';
  });

  // divergence: more rows now fit. (poll retries → absorbs RO async.)
  await expect
    .poll(async () => bodyRows.count(), { message: '★taller viewport → more rows' })
    .toBeGreaterThan(before);
});
