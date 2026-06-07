import { test, expect, type Page } from '@playwright/test';

// MOD-GRID-51 — custom cell editor slot. ★behavior-gated, non-vacuous (advisor): "a custom
// element rendered" is vacuous (a raw `cell` renderer already renders anything). The real
// claim is the SLOT delivers the edit lifecycle with ZERO wiring from the consumer:
//   1) view→click→entry AUTOFOCUS (bare <input> doesn't self-focus → proves ctx.focusRef);
//      the editor is structurally distinct from the built-in (no border-blue-400 class).
//   2) Enter (while focused) → commit (NOT blur).
//   3) Esc → cancel (revert, no commit).
const FRAME = (id: string) => `/iframe.html?id=${id}&viewMode=story`;
const ID = 'cells-editablecell-custom-editor-slot--default';
const cell = (page: Page) => page.getByTestId('cell');
const customEditor = (page: Page) => page.getByTestId('custom-editor');

test('G-1: view→click enters edit; the custom editor auto-focuses and is NOT the built-in input', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await cell(page).waitFor({ state: 'visible' });

  // starts in VIEW mode — original value shown, no editor anywhere.
  await expect(cell(page)).toHaveText('initial');
  await expect(customEditor(page)).toHaveCount(0);

  // click the view text to enter edit mode.
  await page.getByText('initial').click();

  // ★ the consumer's editor appears, is structurally distinct (no built-in class),
  //   and is AUTOFOCUSED — the story wires no focus call, so this proves ctx.focusRef.
  const editor = customEditor(page);
  await expect(editor).toBeVisible();
  await expect(editor, 'slot editor, not built-in').not.toHaveClass(/border-blue-400/);
  await expect(editor, '★entry autofocus from the slot').toBeFocused();
});

test('G-1: Enter (while focused) commits via the slot — not blur', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await cell(page).waitFor({ state: 'visible' });

  await page.getByText('initial').click();
  const editor = customEditor(page);
  await editor.fill('edited!');
  // press Enter WHILE the editor is still focused (no click-away) → keydown bubbles to the
  // slot wrapper's onKeyDown → onCommit. The story never wired onKeyDown.
  await editor.press('Enter');

  // ★ committed and back in view mode.
  await expect(cell(page)).toHaveText('edited!');
  await expect(customEditor(page)).toHaveCount(0);
});

test('G-1: Esc cancels via the slot — value reverts, nothing committed', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await cell(page).waitFor({ state: 'visible' });

  await page.getByText('initial').click();
  const editor = customEditor(page);
  await editor.fill('discard me');
  // Esc → keydown bubbles to the slot wrapper → onCancel. Again, story wired none of this.
  await editor.press('Escape');

  // ★ reverted to the original — no partial/accidental commit.
  await expect(cell(page)).toHaveText('initial');
  await expect(customEditor(page)).toHaveCount(0);
});

// ctx.commit / ctx.cancel are the explicit-call path — the primary one for editors that don't
// commit on Enter (date-picker / dropdown with OK/Cancel buttons). Verify both ctx members
// directly, not via keydown, so the full CustomEditorContext surface is chromium-verified.
test('G-1: ctx.commit() (Save button) commits the draft', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await cell(page).waitFor({ state: 'visible' });

  await page.getByText('initial').click();
  await customEditor(page).fill('via-commit');
  await page.getByTestId('slot-save').click();

  // ★ ctx.commit() applied the draft and closed the editor.
  await expect(cell(page)).toHaveText('via-commit');
  await expect(customEditor(page)).toHaveCount(0);
});

test('G-1: ctx.cancel() (Cancel button) discards the draft', async ({
  page,
}: { page: Page }) => {
  await page.goto(FRAME(ID));
  await cell(page).waitFor({ state: 'visible' });

  await page.getByText('initial').click();
  await customEditor(page).fill('via-cancel');
  await page.getByTestId('slot-cancel').click();

  // ★ ctx.cancel() reverted — nothing committed.
  await expect(cell(page)).toHaveText('initial');
  await expect(customEditor(page)).toHaveCount(0);
});
