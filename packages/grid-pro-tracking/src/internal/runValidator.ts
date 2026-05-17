import type { Validator } from '../types';

/**
 * Run a `Validator<TData>` over a list of rows, returning per-row failure
 * descriptors suitable for `ChangeSet.errors[]`.
 *
 * Semantics (ADR-MOD-GRID-10-006):
 * - `validator` undefined → returns empty array (every row passes).
 * - For each `[index, row]`:
 *   - Call `validator(row)`. If the call throws, treat as a failure with
 *     `message = '(validator threw: <error.message>)'` (defensive — a
 *     validator should not crash buildChangeSet).
 *   - If `result.valid === true` → skip (no entry).
 *   - If `result.valid === false` → push `{ index, message, type }` where
 *     `message = result.errors?.[0] ?? '(unknown error)'`.
 *
 * `type` is the caller-supplied tag (`'added'` or `'updated'`); `removed`
 * rows do not go through this helper (D5).
 *
 * @template TData Row data type.
 */
export function runValidator<TData>(
  rows: readonly TData[],
  validator: Validator<TData> | undefined,
  type: 'added' | 'updated',
): Array<{ index: number; message: string; type: 'added' | 'updated' }> {
  if (!validator) {
    return [];
  }
  const errors: Array<{ index: number; message: string; type: 'added' | 'updated' }> = [];
  rows.forEach((row, index) => {
    let result: { valid: boolean; errors?: readonly string[] };
    try {
      result = validator(row);
    } catch (err) {
      errors.push({
        index,
        message: `(validator threw: ${err instanceof Error ? err.message : String(err)})`,
        type,
      });
      return;
    }
    if (!result.valid) {
      // D5: first message only + fallback '(unknown error)'
      const msg = result.errors?.[0] ?? '(unknown error)';
      errors.push({ index, message: msg, type });
    }
  });
  return errors;
}
