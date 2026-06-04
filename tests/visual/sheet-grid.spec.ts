import { test, expect, type Locator, type Page } from '@playwright/test';

// MOD-GRID-26 G-3 — spreadsheet PoC chromium gate (the real gate per LESS-006: node proves the
// formula engine + recalc graph; the browser proves the stored-formula-vs-rendered-value duality
// and the edit→recompute round-trip through the actual grid + grid-pro-range editing reuse).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'grid-pro-sheet-sheetgrid--basic';

async function typeCell(page: Page, root: Locator, ref: string, text: string): Promise<void> {
  await root.locator(`td[data-cell="${ref}"]`).dblclick();
  const input = root.locator(`[data-testid="edit-${ref}"]`);
  await input.fill(text);
  await input.press('Enter');
}

test('a cell stores a formula but displays its value; editing upstream recomputes it', async ({
  page,
}) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const cell = (ref: string) => root.locator(`td[data-cell="${ref}"]`);

  // literals
  await typeCell(page, root, 'A1', '10');
  await expect(cell('A1')).toHaveText('10');
  await typeCell(page, root, 'A2', '20');
  await expect(cell('A2')).toHaveText('20');
  await typeCell(page, root, 'A3', '30');

  // a formula cell: stores "=A1+A2", DISPLAYS the value 30 (stored ≠ rendered).
  await typeCell(page, root, 'B1', '=A1+A2');
  await expect(cell('B1'), 'formula displays its value').toHaveText('30');

  // a SUM over a range.
  await typeCell(page, root, 'B2', '=SUM(A1:A3)');
  await expect(cell('B2'), 'SUM(A1:A3) = 60').toHaveText('60');

  // edit an upstream cell → the dependent formula cells recompute.
  await typeCell(page, root, 'A1', '100');
  await expect(cell('B1'), 'B1 recomputed on A1 edit (=A1+A2 → 120)').toHaveText('120');
  await expect(cell('B2'), 'B2 recomputed on A1 edit (SUM → 150)').toHaveText('150');

  // error surfaces as a code, not NaN/blank.
  await typeCell(page, root, 'C1', '=1/0');
  await expect(cell('C1'), 'division by zero shows #DIV/0!').toHaveText('#DIV/0!');

  // editing reveals the RAW formula (not the value) — the duality, the other direction.
  await cell('B1').dblclick();
  await expect(root.locator('[data-testid="edit-B1"]'), 'edit reveals the formula text').toHaveValue('=A1+A2');
});

test('MOD-32 G-1: comparison + IF + logical fns in the grid, recalc through IF', async ({
  page,
}) => {
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const cell = (ref: string) => root.locator(`td[data-cell="${ref}"]`);

  await typeCell(page, root, 'A1', '3');
  // IF over a comparison — displays the taken branch's value.
  await typeCell(page, root, 'B1', '=IF(A1>5,"big","small")');
  await expect(cell('B1'), 'IF(3>5,…) → small').toHaveText('small');
  // AND of two comparisons → TRUE/FALSE.
  await typeCell(page, root, 'C1', '=AND(A1>1,A1<10)');
  await expect(cell('C1'), 'AND(3>1,3<10) → TRUE').toHaveText('TRUE');
  // a bare comparison.
  await typeCell(page, root, 'D1', '=A1=3');
  await expect(cell('D1'), 'A1=3 → TRUE').toHaveText('TRUE');

  // ★ edit A1 → cells recompute THROUGH the IF (lazy eval, but the condition ref is dep-tracked).
  await typeCell(page, root, 'A1', '10');
  await expect(cell('B1'), 'IF recomputes to big (10>5)').toHaveText('big');
  await expect(cell('C1'), 'AND recomputes to FALSE (10<10 false)').toHaveText('FALSE');
  await expect(cell('D1'), 'A1=3 recomputes to FALSE').toHaveText('FALSE');

  // IF lazy: the untaken branch's error is not surfaced.
  await typeCell(page, root, 'A2', '0');
  await typeCell(page, root, 'E1', '=IF(A2=0,"safe",1/A2)');
  await expect(cell('E1'), 'IF lazy: 1/0 untaken → safe (not #DIV/0!)').toHaveText('safe');
});

test('grid-pro-range reuse: selection + clipboard copy = VALUE (not formula)', async ({
  page,
  context,
}) => {
  // Verifies the wired-but-otherwise-unverified reuse glue: useCellRange selection (required to
  // copy) + useClipboard with getCellValue=getDisplay → copy emits the displayed VALUE, and
  // onPaste=setCell writes it. Non-vacuous: if copy grabbed the raw "=A1+A2", pasting into D5 would
  // evaluate D1+D2 = 0; seeing 30 proves copy=value AND the paste→setCell coordinate glue.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(FRAME(ID));
  const root = page.locator('#storybook-root');
  await root.locator('table').first().waitFor({ state: 'visible' });
  const cell = (ref: string) => root.locator(`td[data-cell="${ref}"]`);
  const container = root.locator('div:has(> table)').first();

  await typeCell(page, root, 'A1', '10');
  await typeCell(page, root, 'A2', '20');
  await typeCell(page, root, 'B1', '=A1+A2');
  await expect(cell('B1')).toHaveText('30');

  // select B1 (useCellRange) and copy (useClipboard, copy = displayed value).
  await cell('B1').click();
  await container.focus();
  await page.keyboard.press('Control+c');

  // select an empty cell and paste → it must show the COPIED VALUE 30, not the formula.
  await cell('D5').click();
  await container.focus();
  await page.keyboard.press('Control+v');
  await expect(cell('D5'), 'paste shows copied value 30 (copy=value, paste→setCell glue)').toHaveText('30');
});
