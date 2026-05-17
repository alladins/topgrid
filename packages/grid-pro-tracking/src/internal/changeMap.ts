// @tomis/grid-pro-tracking — pure changeMap helpers (MOD-GRID-10/G-002).
//
// Spec: artifacts/MOD-GRID-10/tracking/G-002-spec.md Sections 2.1, 2.2, 6, 11.2
// AC mapping: AC-001 (Map + structuredClone) / AC-002 (added/edited/deleted)
//             AC-003 (net-zero + snapshot-once) / AC-004 (resetChanges)
//             AC-005 (TanStack-compatible rows shape) / AC-006 (no Wijmo)
//
// Design notes
// ------------
// * Pure functions (React-free, side-effect-free apart from `console.warn`)
//   so they are trivially testable + tree-shakeable.
// * Internal state shape `ChangeMapState<TData>` is NOT exported through the
//   package barrel; it lives behind `src/internal/` per spec Section 2.5.
// * `structuredClone` is used for `originalMap` snapshots (AC-001).
// * `applyAdd` / `applyUpdate` / `applyDelete` / `resetChangeMap` return new
//   state objects so React `useReducer` reference-equality detection fires.

import type { RowStatus } from '../types';

/**
 * Internal state shape held by `useChangeTracking`'s `useReducer`.
 *
 * - `statusMap`: rowKey → 'added' | 'edited' | 'deleted'. Missing keys are
 *   'unchanged'.
 * - `originalMap`: rowKey → first-edit `structuredClone` (only populated for
 *   `'edited'` status; preserves the pre-edit value across multiple updates).
 * - `currentMap`: rowKey → current value (covers `'added'` and `'edited'`).
 *   For `'deleted'` rows we keep the original snapshotMap value (the user
 *   only sees the row marked, the data is unchanged).
 * - `snapshotMap`: rowKey → mount-time / last-rebuild snapshot, used by
 *   `resetChangeMap` to restore the initial dataset (AC-004).
 * - `insertionOrder`: rowKey insertion order for `'added'` rows so
 *   `materialize` produces a deterministic `rows[]` array.
 */
export interface ChangeMapState<TData> {
  statusMap: Map<string, RowStatus>;
  originalMap: Map<string, TData>;
  currentMap: Map<string, TData>;
  snapshotMap: Map<string, TData>;
  insertionOrder: string[];
  /**
   * Cell-level edit tracking. key = `${rowKey}_${columnId}`. Populated by
   * `applyUpdate` when the caller passes `trackEditedCells: true`
   * (gated by `config.editedCells === true` at the hook level — G-005 D6).
   * Purged on `applyUndo` (added/edited/deleted branches),
   * `applyDelete` net-zero (status was 'added'), and `resetChangeMap`.
   */
  editedCellsMap: Map<string, boolean>;
}

/**
 * Normalize the `rowKey` config (string field name or function) into a
 * single `(row: TData) => string` extractor. Used by `useChangeTracking`
 * to derive keys consistently across all reducer actions.
 */
export function makeKeyExtractor<TData>(
  rowKey: keyof TData | ((row: TData) => string),
): (row: TData) => string {
  if (typeof rowKey === 'function') {
    return rowKey;
  }
  // keyof TData branch — coerce the field value to string.
  return (row: TData): string => {
    const raw = (row as Record<string, unknown>)[rowKey as string];
    return typeof raw === 'string' ? raw : String(raw);
  };
}

/**
 * Build initial state from the mount-time / rebuild data + a key extractor.
 *
 * - Both `currentMap` and `snapshotMap` are seeded from `data`.
 * - On collision (two rows sharing the same key), `console.warn`s and the
 *   last value wins (D5 / ADR-MOD-GRID-10-004 — `console.warn + last-wins`).
 * - `statusMap` / `originalMap` / `insertionOrder` start empty.
 */
export function createChangeMap<TData>(
  data: readonly TData[],
  extractKey: (row: TData) => string,
): ChangeMapState<TData> {
  const currentMap = new Map<string, TData>();
  const snapshotMap = new Map<string, TData>();

  for (const row of data) {
    const key = extractKey(row);
    if (currentMap.has(key)) {
      // D5 / ADR-MOD-GRID-10-004 — last-wins, never throw.
      console.warn(`[grid-pro-tracking] duplicate rowKey: ${key}`);
    }
    currentMap.set(key, row);
    snapshotMap.set(key, row);
  }

  return {
    statusMap: new Map<string, RowStatus>(),
    originalMap: new Map<string, TData>(),
    currentMap,
    snapshotMap,
    insertionOrder: [],
    editedCellsMap: new Map<string, boolean>(),
  };
}

/**
 * Add a row.
 *
 * The caller (the hook) is responsible for resolving `assignedKey` so it can
 * return it synchronously from `addRow(...)` (spec Section 11.2 pattern; the
 * 4-param signature shown in Section 2.2 with a `generateKey` callback was an
 * internal-spec inconsistency — see F-06 `specCodeDefects[]`).
 *
 * - If `assignedKey` is already in `statusMap` we still apply it (last-wins)
 *   but emit a warn for parity with `createChangeMap` collision handling.
 * - `statusMap[key] = 'added'`, `currentMap[key] = seed-as-TData`,
 *   `insertionOrder.push(key)`.
 */
export function applyAdd<TData>(
  state: ChangeMapState<TData>,
  seed: Partial<TData>,
  assignedKey: string,
): ChangeMapState<TData> {
  if (state.statusMap.has(assignedKey) || state.currentMap.has(assignedKey)) {
    console.warn(`[grid-pro-tracking] duplicate rowKey on addRow: ${assignedKey}`);
  }

  const nextStatus = new Map(state.statusMap);
  const nextCurrent = new Map(state.currentMap);
  const nextInsertionOrder = state.insertionOrder.slice();

  nextStatus.set(assignedKey, 'added');
  // seed is Partial<TData>; the runtime row carries whatever the caller
  // supplied. Consumers materialize this back as TData (spec L501).
  nextCurrent.set(assignedKey, seed as TData);
  if (!state.insertionOrder.includes(assignedKey)) {
    nextInsertionOrder.push(assignedKey);
  }

  return {
    statusMap: nextStatus,
    originalMap: state.originalMap,
    currentMap: nextCurrent,
    snapshotMap: state.snapshotMap,
    insertionOrder: nextInsertionOrder,
    editedCellsMap: state.editedCellsMap,
  };
}

/**
 * Update a row by key (patch merge).
 *
 * - If `key` is unknown (not in `currentMap`), `console.warn`s and returns
 *   state unchanged (no throw — D5 / ADR-MOD-GRID-10-004 parity).
 * - First update on an 'unchanged' row → status becomes 'edited' and
 *   `originalMap[key]` records `structuredClone(currentMap[key])` (EC-02
 *   snapshot-once invariant: subsequent updates do NOT overwrite the
 *   snapshot).
 * - First update on an 'added' row → status stays 'added' (net change is
 *   still an add); no original snapshot is taken.
 * - `currentMap[key]` becomes `{ ...currentMap[key], ...patch }`.
 */
export function applyUpdate<TData>(
  state: ChangeMapState<TData>,
  key: string,
  patch: Partial<TData>,
  trackEditedCells: boolean = false,
): ChangeMapState<TData> {
  const existing = state.currentMap.get(key);
  if (existing === undefined) {
    console.warn(`[grid-pro-tracking] updateRow: unknown key ${key}`);
    return state;
  }

  const prevStatus = state.statusMap.get(key);
  const nextStatus = new Map(state.statusMap);
  const nextOriginal = new Map(state.originalMap);
  const nextCurrent = new Map(state.currentMap);

  if (prevStatus === undefined) {
    // First edit on a previously-unchanged row → snapshot once (EC-02).
    nextStatus.set(key, 'edited');
    nextOriginal.set(key, structuredClone(existing));
  } else if (prevStatus === 'edited') {
    // Subsequent edit — keep originalMap snapshot intact (EC-02 invariant).
    // Status already 'edited'.
  } else if (prevStatus === 'added') {
    // Edits on an 'added' row stay net 'added'. No snapshot.
  } else if (prevStatus === 'deleted') {
    // Updating a deleted row is unusual; promote to 'edited' so the user
    // sees the row come back. Snapshot from currentMap (which still holds
    // the pre-delete value, as deletes mark-only).
    nextStatus.set(key, 'edited');
    if (!nextOriginal.has(key)) {
      nextOriginal.set(key, structuredClone(existing));
    }
  }

  nextCurrent.set(key, { ...existing, ...patch });

  // G-005 D6 — cell-level edit tracking. `trackEditedCells` mirrors
  // `config.editedCells === true` at the hook level (Action payload).
  // columnId assumption (EC-04): TanStack `ColumnDef.id ?? accessorKey`;
  // `Object.keys(patch)` are accessorKey names. `id` override is not tracked.
  let nextEditedCells = state.editedCellsMap;
  if (trackEditedCells) {
    nextEditedCells = new Map(state.editedCellsMap);
    for (const columnId of Object.keys(patch)) {
      nextEditedCells.set(`${key}_${columnId}`, true);
    }
  }

  return {
    statusMap: nextStatus,
    originalMap: nextOriginal,
    currentMap: nextCurrent,
    snapshotMap: state.snapshotMap,
    insertionOrder: state.insertionOrder,
    editedCellsMap: nextEditedCells,
  };
}

/**
 * Delete a row by key.
 *
 * - If `key` is unknown, `console.warn`s and returns state unchanged.
 * - If `key`'s current status is 'added' → net-zero cancellation
 *   (EC-01): remove from `statusMap`, `currentMap`, `insertionOrder`, and
 *   `originalMap` (defensive). Result: `hasChanges()` may become `false`.
 * - Otherwise → mark `statusMap[key] = 'deleted'`. `currentMap` is left
 *   intact (the row still has a value for the UI to display while marked).
 */
export function applyDelete<TData>(
  state: ChangeMapState<TData>,
  key: string,
): ChangeMapState<TData> {
  if (!state.currentMap.has(key) && !state.statusMap.has(key)) {
    console.warn(`[grid-pro-tracking] deleteRow: unknown key ${key}`);
    return state;
  }

  const prevStatus = state.statusMap.get(key);

  if (prevStatus === 'added') {
    // Net-zero: scrub the row entirely.
    const nextStatus = new Map(state.statusMap);
    const nextCurrent = new Map(state.currentMap);
    const nextOriginal = new Map(state.originalMap);
    nextStatus.delete(key);
    nextCurrent.delete(key);
    nextOriginal.delete(key);
    const nextInsertionOrder = state.insertionOrder.filter((k) => k !== key);
    // G-005 D6 — purge any cell-level entries for this row (net-zero).
    const nextEditedCells = purgeEditedCellsForKey(state.editedCellsMap, key);
    return {
      statusMap: nextStatus,
      originalMap: nextOriginal,
      currentMap: nextCurrent,
      snapshotMap: state.snapshotMap,
      insertionOrder: nextInsertionOrder,
      editedCellsMap: nextEditedCells,
    };
  }

  const nextStatus = new Map(state.statusMap);
  nextStatus.set(key, 'deleted');
  return {
    statusMap: nextStatus,
    originalMap: state.originalMap,
    currentMap: state.currentMap,
    snapshotMap: state.snapshotMap,
    insertionOrder: state.insertionOrder,
    editedCellsMap: state.editedCellsMap,
  };
}

/**
 * Remove every entry whose composite key starts with `${rowKey}_` from
 * `editedCellsMap`. Returns the same reference when no entries match
 * (avoids unnecessary state ref churn).
 */
function purgeEditedCellsForKey(
  editedCellsMap: Map<string, boolean>,
  rowKey: string,
): Map<string, boolean> {
  const prefix = `${rowKey}_`;
  let touched = false;
  let next: Map<string, boolean> | undefined;
  for (const k of editedCellsMap.keys()) {
    if (k.startsWith(prefix)) {
      if (!touched) {
        next = new Map(editedCellsMap);
        touched = true;
      }
      next!.delete(k);
    }
  }
  return touched && next !== undefined ? next : editedCellsMap;
}

/**
 * Restore initial snapshot — discard every tracked change.
 *
 * Returns a fresh state object whose `currentMap` is a copy of
 * `snapshotMap` and whose `statusMap` / `originalMap` / `insertionOrder`
 * are empty. AC-004 binding.
 */
export function resetChangeMap<TData>(
  state: ChangeMapState<TData>,
): ChangeMapState<TData> {
  return {
    statusMap: new Map<string, RowStatus>(),
    originalMap: new Map<string, TData>(),
    currentMap: new Map(state.snapshotMap),
    snapshotMap: state.snapshotMap,
    insertionOrder: [],
    editedCellsMap: new Map<string, boolean>(),
  };
}

/**
 * Project the change-map state into the four reactive arrays exposed by
 * `ChangeTrackingAPI`. AC-002 / AC-005 binding.
 *
 * - `rows`: starts from `snapshotMap` insertion order (initial rows), then
 *   appends `insertionOrder` (the 'added' rows). Each row carries an
 *   optional `__rowStatus` marker when it differs from 'unchanged'.
 * - `added`: `currentMap[key]` for each key with `statusMap[key] === 'added'`.
 * - `edited`: `{ ...currentMap[key], __original: originalMap[key] }` for each
 *   key with `statusMap[key] === 'edited'`.
 * - `deleted`: `currentMap[key]` (a.k.a. last-known value) for each key with
 *   `statusMap[key] === 'deleted'`.
 */
export function materialize<TData>(state: ChangeMapState<TData>): {
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  added: ReadonlyArray<TData>;
  edited: ReadonlyArray<TData & { __original: TData }>;
  deleted: ReadonlyArray<TData>;
} {
  type DisplayRow = TData & { __rowStatus?: RowStatus };
  const rows: DisplayRow[] = [];
  const added: TData[] = [];
  const edited: Array<TData & { __original: TData }> = [];
  const deleted: TData[] = [];

  // 1) Initial rows in snapshot insertion order.
  for (const [key, snapshot] of state.snapshotMap) {
    const status = state.statusMap.get(key);
    const current = state.currentMap.get(key) ?? snapshot;

    if (status === undefined) {
      // C-29: omit the optional marker (no `__rowStatus: undefined` literal).
      rows.push({ ...current } as DisplayRow);
    } else if (status === 'edited') {
      rows.push({ ...current, __rowStatus: status } as DisplayRow);
      const original = state.originalMap.get(key);
      if (original !== undefined) {
        edited.push({ ...current, __original: original });
      }
    } else if (status === 'deleted') {
      rows.push({ ...current, __rowStatus: status } as DisplayRow);
      deleted.push(current);
    }
    // 'added' won't appear here — added keys are never in snapshotMap.
  }

  // 2) Added rows in their insertion order.
  for (const key of state.insertionOrder) {
    if (state.statusMap.get(key) !== 'added') {
      continue;
    }
    const current = state.currentMap.get(key);
    if (current === undefined) {
      continue;
    }
    rows.push({ ...current, __rowStatus: 'added' } as DisplayRow);
    added.push(current);
  }

  return { rows, added, edited, deleted };
}

/**
 * Undo a single row's tracked change (MOD-GRID-10/G-004).
 *
 * Four branches — see spec Section 2.2 branch table (authority over EC-03 prose):
 *
 * | prevStatus  | action                                                              |
 * |-------------|---------------------------------------------------------------------|
 * | 'added'     | Net-zero scrub: delete from statusMap, currentMap, originalMap,     |
 * |             | insertionOrder. (Same as applyDelete 'added' branch.)               |
 * | 'edited'    | Restore currentMap[key] from snapshotMap[key]; delete from          |
 * |             | statusMap, originalMap.                                             |
 * | 'deleted'   | Un-mark: statusMap.delete(key) + originalMap.delete(key)            |
 * |             | (originalMap.delete is the D5/EC-06/Section 11.2 leak fix — EC-03   |
 * |             | prose omitted this; F-06 specCodeDefects).                          |
 * | undefined   | console.warn + return state unchanged (no throw — D5 parity).       |
 *
 * Pure function; no React imports.
 */
export function applyUndo<TData>(
  state: ChangeMapState<TData>,
  key: string,
): ChangeMapState<TData> {
  const prevStatus = state.statusMap.get(key);

  if (prevStatus === undefined) {
    console.warn(`[grid-pro-tracking] undoRow: no tracked change for key ${key}`);
    return state;
  }

  if (prevStatus === 'added') {
    // Net-zero: scrub the row entirely.
    const nextStatus = new Map(state.statusMap);
    const nextCurrent = new Map(state.currentMap);
    const nextOriginal = new Map(state.originalMap);
    nextStatus.delete(key);
    nextCurrent.delete(key);
    nextOriginal.delete(key);
    const nextInsertionOrder = state.insertionOrder.filter((k) => k !== key);
    const nextEditedCells = purgeEditedCellsForKey(state.editedCellsMap, key);
    return {
      statusMap: nextStatus,
      originalMap: nextOriginal,
      currentMap: nextCurrent,
      snapshotMap: state.snapshotMap,
      insertionOrder: nextInsertionOrder,
      editedCellsMap: nextEditedCells,
    };
  }

  if (prevStatus === 'edited') {
    // Restore current value from originalMap (pre-edit structuredClone snapshot).
    // originalMap[key] is the value captured at first updateRow — this is the
    // authoritative pre-edit value (spec Section 2.2 branch table + Section 11.2).
    const original = state.originalMap.get(key);
    const nextStatus = new Map(state.statusMap);
    const nextOriginal = new Map(state.originalMap);
    const nextCurrent = new Map(state.currentMap);
    nextStatus.delete(key);
    nextOriginal.delete(key);
    if (original !== undefined) {
      nextCurrent.set(key, original);
    }
    const nextEditedCells = purgeEditedCellsForKey(state.editedCellsMap, key);
    return {
      statusMap: nextStatus,
      originalMap: nextOriginal,
      currentMap: nextCurrent,
      snapshotMap: state.snapshotMap,
      insertionOrder: state.insertionOrder,
      editedCellsMap: nextEditedCells,
    };
  }

  // prevStatus === 'deleted': un-mark deletion.
  // D5/EC-06/Section 11.2: also delete from originalMap (leak fix; EC-03 prose omitted this).
  const nextStatus = new Map(state.statusMap);
  const nextOriginal = new Map(state.originalMap);
  nextStatus.delete(key);
  nextOriginal.delete(key);
  const nextEditedCells = purgeEditedCellsForKey(state.editedCellsMap, key);
  return {
    statusMap: nextStatus,
    originalMap: nextOriginal,
    currentMap: state.currentMap,
    snapshotMap: state.snapshotMap,
    insertionOrder: state.insertionOrder,
    editedCellsMap: nextEditedCells,
  };
}
