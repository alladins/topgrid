import type { Mapping, MappedRow } from '../types';

/**
 * Apply a `Mapping<TData>` to a single row, producing a flat `MappedRow` keyed
 * by BE field names.
 *
 * Semantics (ADR-MOD-GRID-10-006):
 * - `mapping` undefined or empty object → return a shallow clone of `row` as a
 *   `Record<string, unknown>` (AC-005 — pass-through identity).
 * - For each `[beField, source]` in `mapping`:
 *   - `typeof source === 'string'` → forward `row[source]` to `result[beField]`.
 *   - `typeof source === 'function'` → call `source(row)`; the return value
 *     becomes `result[beField]`.
 *
 * The helper is pure — no `console.warn`, no side effects, no IO. Mapping
 * function exceptions propagate to the caller (`buildChangeSet`) which
 * surfaces them via `errors[]`.
 *
 * @template TData Row data type.
 */
export function applyMapping<TData extends Record<string, unknown>>(
  row: TData,
  mapping?: Mapping<TData>,
): MappedRow {
  if (!mapping || Object.keys(mapping).length === 0) {
    return { ...row };
  }
  const result: Record<string, unknown> = {};
  for (const [beField, source] of Object.entries(mapping)) {
    if (typeof source === 'function') {
      // D4: throws propagate to caller (buildChangeSet wraps in errors[])
      result[beField] = source(row);
    } else {
      result[beField] = (row as Record<string, unknown>)[source];
    }
  }
  return result;
}
