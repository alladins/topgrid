/**
 * MOD-GRID-60 — `useViewStatePersistence`: persist any serializable view state (row grouping,
 * pivot config, …) to Web Storage across reloads, behind a versioned envelope.
 *
 * Generic, value-typed twin of `useExpandedPersistence` (grid-pro-master): same independent-hook
 * pattern (does NOT touch `useGridState`), same storage internals, plus a version (schema-change
 * safety — stale stored state is discarded, see `deserializeViewState`). Consumers wire the
 * returned `[value, setValue]` into a component's controlled state + onChange:
 *   - row grouping: `<AggregationGrid grouping={value} onGroupingChange={setValue} />`
 *   - pivot config: `<PivotGrid config={value} enableConfigControls onConfigChange={setValue} />`
 */
import { useCallback, useRef, useState } from 'react';
import { getStorage, readRaw, writeRaw, type StorageType } from './internal/storage';
import { serializeViewState, deserializeViewState } from './internal/viewStateEnvelope';

/** Options for {@link useViewStatePersistence}. */
export interface UseViewStatePersistenceOptions<T> {
  /** Web Storage key (unique per persisted view). */
  storageKey: string;
  /** Initial value used when no (valid) stored value is found. */
  initial: T;
  /** Schema version — a mismatch discards stored state. @default 1 */
  version?: number;
  /** Web Storage type. @default 'localStorage' */
  storageType?: StorageType;
}

/** Setter accepting a value or an updater (like React's setState). */
type ViewStateSetter<T> = (next: T | ((prev: T) => T)) => void;

/**
 * Persist a single serializable view-state value to Web Storage (versioned envelope).
 * @returns `[value, setValue]` — `setValue` writes through to storage.
 */
export function useViewStatePersistence<T>(
  options: UseViewStatePersistenceOptions<T>,
): [T, ViewStateSetter<T>] {
  const { storageKey, initial, version = 1, storageType = 'localStorage' } = options;

  const storageRef = useRef<Storage | null>(null);
  if (storageRef.current === null) {
    storageRef.current = getStorage(storageType);
  }

  const [value, setValueInternal] = useState<T>(() => {
    const raw = readRaw(storageRef.current, storageKey);
    const restored = deserializeViewState<T>(raw, version);
    return restored !== null ? restored : initial;
  });

  const setValue = useCallback<ViewStateSetter<T>>(
    (next) => {
      setValueInternal((prev) => {
        const n = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeRaw(
          storageRef.current,
          storageKey,
          serializeViewState(n, version),
          'useViewStatePersistence',
        );
        return n;
      });
    },
    [storageKey, version],
  );

  return [value, setValue];
}
