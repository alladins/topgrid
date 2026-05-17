// @tomis/grid-pro-tracking — buildChangeSet pure helper (MOD-GRID-10/G-003).
//
// Spec: artifacts/MOD-GRID-10/tracking/G-003-spec.md Sections 2.4, 6, 11.3 Step 4
// AC mapping: AC-001 (Mapping semantics) / AC-002 (Validator semantics)
//             AC-003 (ChangeSet shape) / AC-005 (pass-through identity)
//             AC-008 (tsc 0 error)
//
// Design (D8 C-32): Pure helper — React import 0.

import type { ChangeSet, Mapping, Validator, MappedRow } from './types';
import type { ChangeMapState } from './internal/changeMap';
import { applyMapping } from './internal/applyMapping';
import { runValidator } from './internal/runValidator';

export interface BuildChangeSetOptions<TData> {
  /** Screen-to-BE field mapping. When omitted, rows pass through as a shallow clone. */
  mapping?: Mapping<TData> | undefined;
  /** Row-level validator. When omitted, every row passes. */
  validator?: Validator<TData> | undefined;
}

/**
 * Build a server payload from a `ChangeMapState<TData>`.
 *
 * Algorithm (spec Section 1 L1 + Section 2.4):
 * 1. `removed` — every `state.statusMap[key] === 'deleted'` row → applyMapping
 *    (no validator call — deletes need only the PK, D5).
 * 2. `added` — every `'added'` row → runValidator (type:'added'). Failing rows
 *    are excluded from `added[]` and recorded in `errors[]`.
 * 3. `updated` — every `'edited'` row → runValidator (type:'updated'). Same
 *    exclusion/error policy as `added`.
 * 4. Return `{ added, updated, removed, errors }`.
 *
 * Mapping function throws (EC-02 + D4):
 * - `applyMapping` propagates throws (0 try/catch internally).
 * - `buildChangeSet` wraps added/updated mapping in per-row try/catch.
 *   On throw: push `{ index, message: '(mapping threw: <error>)', type }` to errors[].
 * - Deleted mapping throw: fallback raw row (spec silent on deleted throw → conservative).
 *
 * Index numbering in `errors[]` is per-group 0-based (pre-exclusion sequence).
 *
 * Pure — no React import, no `console.warn`, no IO.
 *
 * @see useChangeTracking — the React shell that wires this via `getChangeSet()` (D7).
 * @template TData Row data type (must extend `Record<string, unknown>`).
 */
export function buildChangeSet<TData extends Record<string, unknown>>(
  state: ChangeMapState<TData>,
  options?: BuildChangeSetOptions<TData>,
): ChangeSet {
  const { mapping, validator } = options ?? {};
  const errors: ChangeSet['errors'] = [];

  // Collect rows by status from statusMap + currentMap.
  const addedKeys: string[] = [];
  const editedKeys: string[] = [];
  const deletedKeys: string[] = [];

  for (const [key, status] of state.statusMap.entries()) {
    if (status === 'added') addedKeys.push(key);
    else if (status === 'edited') editedKeys.push(key);
    else if (status === 'deleted') deletedKeys.push(key);
  }

  const addedRows = addedKeys
    .map((k) => state.currentMap.get(k))
    .filter((r): r is TData => r !== undefined);

  const editedRows = editedKeys
    .map((k) => state.currentMap.get(k))
    .filter((r): r is TData => r !== undefined);

  const deletedRows = deletedKeys
    .map((k) => state.currentMap.get(k))
    .filter((r): r is TData => r !== undefined);

  // --- Validator pass (added + updated; removed skips validator — D5) ---
  const addedErrors = runValidator(addedRows, validator, 'added');
  const editedErrors = runValidator(editedRows, validator, 'updated');
  errors.push(...addedErrors, ...editedErrors);

  // Build sets of indices that failed validation → excluded from mapping.
  const addedFailedIdx = new Set(addedErrors.map((e) => e.index));
  const editedFailedIdx = new Set(editedErrors.map((e) => e.index));

  // --- Mapping pass (valid rows only for added/updated; all deleted rows) ---

  // added: valid rows only + mapping function throw → errors[] (EC-02 + D4)
  const added: MappedRow[] = [];
  addedRows.forEach((row, i) => {
    if (addedFailedIdx.has(i)) return; // validator rejected — skip
    try {
      added.push(applyMapping(row, mapping));
    } catch (err) {
      errors.push({
        index: i,
        message: `(mapping threw: ${err instanceof Error ? err.message : String(err)})`,
        type: 'added',
      });
    }
  });

  // updated: valid rows only + mapping function throw → errors[] (EC-02 + D4)
  const updated: MappedRow[] = [];
  editedRows.forEach((row, i) => {
    if (editedFailedIdx.has(i)) return; // validator rejected — skip
    try {
      updated.push(applyMapping(row, mapping));
    } catch (err) {
      errors.push({
        index: i,
        message: `(mapping threw: ${err instanceof Error ? err.message : String(err)})`,
        type: 'updated',
      });
    }
  });

  // removed: validator skip (D5), mapping applied (EC-05).
  // Mapping throw → fallback raw row (spec EC-05 silent on throw → conservative).
  const removed: MappedRow[] = deletedRows.map((row) => {
    try {
      return applyMapping(row, mapping);
    } catch {
      return { ...row };
    }
  });

  return { added, updated, removed, errors };
}
