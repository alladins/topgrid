// @tomis/grid-pro-tracking — useChangeTracking hook (MOD-GRID-10/G-002).
//
// Spec: artifacts/MOD-GRID-10/tracking/G-002-spec.md Sections 2.1, 6, 11.2, 11.3
// AC mapping: AC-001..AC-007 (Storybook AC-008 lives in __stories__/).
//
// Design (D7): `useReducer` driven by pure helpers in `./internal/changeMap`.
// The reducer is the single point that mutates state references; every action
// returns a fresh `ChangeMapState<TData>` so React's reference-equality
// detection rerenders only when changes actually occur.

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Reducer } from 'react';
import type {
  ChangeTrackingAPI,
  ChangeTrackingConfig,
  ChangeSet,
  CommitOptions,
} from './types';
import {
  applyAdd,
  applyDelete,
  applyUndo,
  applyUpdate,
  createChangeMap,
  makeKeyExtractor,
  materialize,
  resetChangeMap,
} from './internal/changeMap';
import type { ChangeMapState } from './internal/changeMap';
import { buildChangeSet } from './buildChangeSet';

/** Internal reducer actions (closed set — `useReducer` discriminated union). */
type Action<TData> =
  | { type: 'ADD'; seed: Partial<TData>; assignedKey: string }
  | { type: 'UPDATE'; key: string; patch: Partial<TData>; trackEditedCells: boolean }
  | { type: 'DELETE'; key: string }
  | { type: 'UNDO'; key: string }
  | { type: 'RESET' }
  | { type: 'REBUILD'; data: readonly TData[]; extractKey: (row: TData) => string };

function reducer<TData>(
  state: ChangeMapState<TData>,
  action: Action<TData>,
): ChangeMapState<TData> {
  switch (action.type) {
    case 'ADD':
      return applyAdd(state, action.seed, action.assignedKey);
    case 'UPDATE':
      return applyUpdate(state, action.key, action.patch, action.trackEditedCells);
    case 'DELETE':
      return applyDelete(state, action.key);
    case 'UNDO':
      return applyUndo(state, action.key);
    case 'RESET':
      return resetChangeMap(state);
    case 'REBUILD':
      // D6 / EC-04 — `data` prop reference changed: discard tracked changes,
      // rebuild the snapshot. `console.warn` happens here (not in
      // `createChangeMap`, which is also used at mount when discarding is
      // the wrong word — the warn is specific to in-flight changes).
      if (state.statusMap.size > 0) {
        console.warn(
          '[grid-pro-tracking] data prop changed — pending changes discarded',
        );
      }
      return createChangeMap(action.data, action.extractKey);
  }
}

/**
 * React hook for tracking row-level added/edited/deleted changes
 * (MOD-GRID-10/G-002 — AC-001..AC-007).
 *
 * - `rows` / `added` / `edited` / `deleted` are stable across renders that
 *   leave the underlying state unchanged (memoized via `useMemo`).
 * - `addRow` returns the assigned row key synchronously so callers can
 *   immediately reference it (e.g. focus the new row, schedule a follow-up
 *   `updateRow`).
 * - `undoRow` and `commitChanges` remain stubs — implemented in
 *   MOD-GRID-10/G-004 and G-005 respectively.
 *
 * @see ChangeTrackingConfig for the input shape.
 * @see ChangeTrackingAPI for the return shape.
 * @template TData Row data type.
 */
export function useChangeTracking<TData>(
  config: ChangeTrackingConfig<TData>,
): ChangeTrackingAPI<TData> {
  // Latch the rowKey extractor on first render. Changing `rowKey` mid-mount
  // is not supported (it would invalidate every tracked key); consumers that
  // need to switch key strategies should remount the hook.
  const extractKeyRef = useRef(makeKeyExtractor(config.rowKey));
  const extractKey = extractKeyRef.current;

  const [state, dispatch] = useReducer<Reducer<ChangeMapState<TData>, Action<TData>>, readonly TData[]>(
    reducer,
    config.data,
    (data) => createChangeMap(data, extractKey),
  );

  // Fire the spec's `onSnapshotInit` callback once on mount (AC source: the
  // existing `ChangeTrackingConfig.onSnapshotInit` field G-001 introduced).
  const snapshotInitFiredRef = useRef(false);
  useEffect(() => {
    if (snapshotInitFiredRef.current) {
      return;
    }
    snapshotInitFiredRef.current = true;
    config.onSnapshotInit?.(state.snapshotMap);
    // We intentionally fire only on the first mount; later REBUILDs do not
    // re-invoke `onSnapshotInit`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // D6 / EC-04 — react to `config.data` reference changes by discarding
  // tracked changes and rebuilding the snapshot. We skip the first run (the
  // initializer above already built state from `config.data`).
  const prevDataRef = useRef(config.data);
  useEffect(() => {
    if (prevDataRef.current === config.data) {
      return;
    }
    prevDataRef.current = config.data;
    dispatch({ type: 'REBUILD', data: config.data, extractKey });
  }, [config.data, extractKey]);

  const addRow = useCallback(
    (seed: Partial<TData>): string => {
      // D4 / EC-06 — auto-generate a key when the seed lacks one.
      // We resolve the assigned key caller-side so we can return it from
      // `addRow` synchronously (cleaner than the spec Section 2.2 callback
      // variant; see F-06 specCodeDefects[]).
      let assignedKey: string;
      if (typeof config.rowKey === 'function') {
        // The functional rowKey must be able to extract from a Partial<TData>;
        // if it throws or returns a non-string we fall back to a UUID.
        let extracted: unknown;
        try {
          extracted = (config.rowKey as (row: TData) => string)(seed as TData);
        } catch {
          extracted = undefined;
        }
        assignedKey =
          typeof extracted === 'string' && extracted.length > 0
            ? extracted
            : globalThis.crypto.randomUUID();
      } else {
        const fieldName = config.rowKey as string;
        const raw = (seed as Record<string, unknown>)[fieldName];
        assignedKey =
          typeof raw === 'string' && raw.length > 0
            ? raw
            : globalThis.crypto.randomUUID();
      }
      dispatch({ type: 'ADD', seed, assignedKey });
      return assignedKey;
    },
    [config.rowKey],
  );

  const updateRow = useCallback((key: string, patch: Partial<TData>): void => {
    dispatch({
      type: 'UPDATE',
      key,
      patch,
      // G-005 D6 — gate cell-level tracking on config.editedCells.
      trackEditedCells: config.editedCells === true,
    });
  }, [config.editedCells]);

  const deleteRow = useCallback((key: string): void => {
    dispatch({ type: 'DELETE', key });
  }, []);

  // G-004 — real undoRow dispatch (spec Section 2.4).
  const undoRow = useCallback((key: string): void => {
    dispatch({ type: 'UNDO', key });
  }, []);

  const resetChanges = useCallback((): void => {
    dispatch({ type: 'RESET' });
  }, []);

  const hasChanges = useCallback((): boolean => state.statusMap.size > 0, [
    state.statusMap,
  ]);

  // G-003 — mapping/validator applied via buildChangeSet (D7).
  // TData is unconstrained at this level; cast to satisfy buildChangeSet's
  // `Record<string, unknown>` bound (safe: TData is always an object at runtime).
  const getChangeSet = useCallback(
    (): ChangeSet => {
      type R = Record<string, unknown>;
      return buildChangeSet(state as ChangeMapState<R>, {
        mapping: config.mapping as import('./types').Mapping<R> | undefined,
        validator: config.validator as import('./types').Validator<R> | undefined,
      });
    },
    [state, config.mapping, config.validator],
  );

  // G-005 D4/D5 — real commitChanges. Three branches per spec Section 2.1
  // branch table (B1 success+autoReset, B2 failure+optimistic+rollback,
  // B3 failure+!optimistic+state intact). Re-throws on failure in both
  // optimistic and non-optimistic modes (caller decides toast/log).
  const commitChanges = useCallback(
    async (endpoint: string, options?: CommitOptions): Promise<unknown> => {
      const method = options?.method ?? 'POST';
      const fetcher =
        options?.fetcher ??
        (async (url, init) => {
          const res = await globalThis.fetch(url, init);
          if (!res.ok) {
            throw new Error(
              `commitChanges failed: ${res.status} ${res.statusText}`,
            );
          }
          return res.json();
        });
      const autoReset = options?.autoReset ?? true;
      const optimistic =
        options?.optimistic ?? config.optimistic ?? false;

      const changeSet = getChangeSet();

      try {
        const result = await fetcher(endpoint, {
          method,
          body: JSON.stringify(changeSet),
          headers: { 'Content-Type': 'application/json' },
        });
        if (autoReset) {
          dispatch({ type: 'RESET' });
        }
        return result;
      } catch (e) {
        if (optimistic) {
          dispatch({ type: 'RESET' });
        }
        throw e;
      }
    },
    [config.optimistic, getChangeSet],
  );

  // Memoize the projection so downstream consumers see stable array refs
  // across renders where `state` did not change.
  const projection = useMemo(() => materialize(state), [state]);

  // G-005 D6 — editedCellsMap mirrors reducer state.editedCellsMap.
  // Population/purge lives in `changeMap.ts` (applyAdd/applyUpdate/applyDelete/
  // applyUndo/resetChangeMap/createChangeMap). config.editedCells === true
  // gates population at dispatch sites (Action union UPDATE.trackEditedCells).
  const editedCellsMap = useMemo<ReadonlyMap<string, boolean>>(
    () => state.editedCellsMap,
    [state.editedCellsMap],
  );

  return {
    rows: projection.rows,
    added: projection.added,
    edited: projection.edited,
    deleted: projection.deleted,
    addRow,
    updateRow,
    deleteRow,
    undoRow,
    hasChanges,
    getChangeSet,
    resetChanges,
    commitChanges,
    editedCellsMap,
  };
}
