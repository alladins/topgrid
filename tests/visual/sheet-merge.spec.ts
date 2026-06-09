import { test, expect, type Page, type Locator } from '@playwright/test';

// MOD-GRID-74 — sheet merged cells. ★behavior-gated, non-vacuous (MOD-52 류): anchor 셀이 실제
// rowSpan/colSpan 속성을 N 으로 가지고, 피복(covered) 셀은 DOM 에 아예 없으며(HTML table 병합),
// 비병합 셀은 그대로 1×1 로 존재한다. "보임"이 아니라 colSpan 속성/DOM 부재로 단언.
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-sheet-sheetgrid--merged';
const cell = (page: Page, ref: string): Locator => page.locator(`#storybook-root [data-cell="${ref}"]`);

test('merged anchor spans N×M; covered cells absent from DOM; non-merged intact', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await page.locator('#storybook-root table').first().waitFor({ state: 'visible' });

  // ★ anchor A1 spans 3 cols × 2 rows (A1:C2).
  await expect(cell(page, 'A1')).toHaveAttribute('colspan', '3');
  await expect(cell(page, 'A1')).toHaveAttribute('rowspan', '2');

  // ★ covered cells (B1,C1,A2,B2,C2) are NOT rendered — absorbed by the anchor span.
  for (const ref of ['B1', 'C1', 'A2', 'B2', 'C2']) {
    await expect(cell(page, ref), `covered ${ref} absent`).toHaveCount(0);
  }

  // ★ second merge B4:B5 — vertical 2-row anchor; B5 covered.
  await expect(cell(page, 'B4')).toHaveAttribute('rowspan', '2');
  await expect(cell(page, 'B4')).toHaveAttribute('colspan', '1');
  await expect(cell(page, 'B5'), 'B5 covered absent').toHaveCount(0);

  // non-merged cell D1 still present, no span attrs.
  await expect(cell(page, 'D1')).toHaveCount(1);
  await expect(cell(page, 'D1')).not.toHaveAttribute('colspan', /.*/);
});
