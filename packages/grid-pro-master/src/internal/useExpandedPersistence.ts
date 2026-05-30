/**
 * `useExpandedPersistence` — Pro-tier hook that persists TanStack `ExpandedState`
 * to Web Storage (localStorage / sessionStorage) across page refreshes.
 *
 * Option B — independent hook. Does NOT modify `useGridState` in `@topgrid/grid-core` (D17).
 * External composition pattern: wire `[expanded, setExpanded]` return value into
 * `masterDetail.expandedRowKeys` + `onExpandChange` on `<MasterDetailGrid>`.
 *
 * Internal SSR-guard + try/catch + JSON I/O boilerplate is now delegated to
 * `@topgrid/grid-core/internal/storage` (ADR-007 Wave 3). External API, in-memory
 * fallback semantics, and dev-mode warning behaviour unchanged.
 *
 * @see G-003-spec.md Section 2.1 + D3 (D17 in decisions.md)
 * @see MOD-GRID-16-decisions.md D17
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExpandedState } from '@tanstack/react-table';
import {
  getStorage,
  readJson,
  writeJson,
  type StorageType,
} from '@topgrid/grid-core/internal/storage';

// Minimal process declare for dev-mode guard (C-4). Mirrors MasterDetailGrid.tsx L44.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/** Returns true when running in a non-production environment. */
function isDev(): boolean {
  return (
    typeof process !== 'undefined' &&
    process?.env?.NODE_ENV !== 'production'
  );
}

/**
 * Options for `useExpandedPersistence`.
 *
 * @example
 * ```tsx
 * const [expanded, setExpanded] = useExpandedPersistence({
 *   storageKey: 'orders-grid-expanded',
 *   storageType: 'localStorage',
 * });
 * ```
 */
export interface UseExpandedPersistenceOptions {
  /**
   * Web Storage key. Use a unique key per grid instance to avoid collisions
   * when multiple grids are mounted on the same page.
   */
  storageKey: string;
  /**
   * Which Web Storage to use.
   * - `'localStorage'` (default): persists across browser sessions.
   * - `'sessionStorage'`: cleared when the tab is closed (EC-07).
   * @default 'localStorage'
   */
  storageType?: StorageType;
  /**
   * Initial `ExpandedState` used when no stored value is found or storage is unavailable.
   * @default {}
   */
  initialExpanded?: ExpandedState;
}

/** Setter signature matching TanStack table `onExpandedChange` updater contract. */
type ExpandedStateSetter = (
  updated: ExpandedState | ((prev: ExpandedState) => ExpandedState),
) => void;

/**
 * Pro-tier hook — persists TanStack `ExpandedState` to Web Storage.
 *
 * @remarks
 * Does NOT modify `useGridState` in `@topgrid/grid-core` (Option B, D17).
 * Wire the returned `[expanded, setExpanded]` into `<MasterDetailGrid>`:
 * ```tsx
 * masterDetail={{
 *   expandedRowKeys: Object.keys(expanded).filter(k => (expanded as Record<string,boolean>)[k]),
 *   onExpandChange: (keys) => {
 *     const next: Record<string, boolean> = {};
 *     keys.forEach(k => { next[k] = true; });
 *     setExpanded(next);
 *   },
 * }}
 * ```
 *
 * @param options - Persistence options (storageKey, storageType, initialExpanded).
 * @returns `[expanded, setExpanded]` tuple compatible with TanStack `ExpandedState`.
 *
 * @see G-003-spec.md Section 2.1
 */
export function useExpandedPersistence(
  options: UseExpandedPersistenceOptions,
): [ExpandedState, ExpandedStateSetter] {
  const { storageKey, storageType = 'localStorage', initialExpanded = {} } = options;

  // storageRef holds the active Storage object. Updated via useEffect when storageType changes
  // so that storageType transitions do not require a full remount (spec Section 2.1).
  const storageRef = useRef<Storage | null>(null);

  // One-time storage availability check + dev-mode warning (EC-01).
  const warnedUnavailable = useRef(false);

  // Initialise storageRef eagerly so the useState initialiser below can use it.
  // ADR-007: SSR + try/catch delegated to getStorage().
  if (storageRef.current === null) {
    storageRef.current = getStorage(storageType);
    if (storageRef.current === null && !warnedUnavailable.current) {
      warnedUnavailable.current = true;
      if (isDev()) {
        console.warn(
          '[topgrid/grid-pro-master] useExpandedPersistence: storage unavailable, falling back to in-memory.',
        );
      }
    }
  }

  const [expanded, setExpandedInternal] = useState<ExpandedState>(() => {
    // Attempt to load persisted state; fall back to initialExpanded on parse error (EC-02).
    // ADR-007: readJson handles try/catch + JSON.parse + null-on-failure.
    const stored = readJson<ExpandedState>(storageRef.current, storageKey);
    return stored !== null ? stored : initialExpanded;
  });

  // Keep storageRef in sync when storageType prop changes.
  useEffect(() => {
    const nextStorage = getStorage(storageType);
    if (nextStorage === null && !warnedUnavailable.current) {
      warnedUnavailable.current = true;
      if (isDev()) {
        console.warn(
          '[topgrid/grid-pro-master] useExpandedPersistence: storage unavailable, falling back to in-memory.',
        );
      }
    }
    storageRef.current = nextStorage;
  }, [storageType]);

  const setExpanded = useCallback<ExpandedStateSetter>(
    (updated) => {
      setExpandedInternal((prev) => {
        const next =
          typeof updated === 'function' ? updated(prev) : updated;
        // Persist; errors swallowed in writeJson (EC-03 + QuotaExceededError).
        // ADR-007: dev-mode QuotaExceededError warning preserved via quotaWarnLabel.
        writeJson(
          storageRef.current,
          storageKey,
          next,
          isDev() ? 'topgrid/grid-pro-master useExpandedPersistence' : undefined,
        );
        return next;
      });
    },
    // storageKey changes are intentionally NOT in deps — changing the key is an unusual
    // operation; consumers should remount to switch keys. This avoids stale-closure risk.
    [storageKey], // eslint-disable-line react-hooks/exhaustive-deps -- storageRef intentionally omitted (stable ref)
  );

  return [expanded, setExpanded];
}
