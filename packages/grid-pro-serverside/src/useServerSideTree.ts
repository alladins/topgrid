/**
 * `useServerSideTree` — thin lazy-group SSRM wiring (MOD-GRID-22 G-3). Separate from the flat
 * `useServerSideData` so neither return shape is overloaded. All logic lives in the node-verified
 * {@link ServerSideTreeController}; this hook owns React state and exposes `toggleGroup` for the
 * consumer's group cell renderer (depth-padding + a click → `toggleGroup(row.__ssrm.groupKeys)`).
 *
 * @see ./internal/serverSideTreeController
 * @see ./internal/treeCache
 */

import { useCallback, useRef, useState } from 'react';
import type {
  OnChangeFn,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import {
  createServerSideTreeController,
  type ServerSideTreeController,
} from './internal/serverSideTreeController.js';
import type { ServerSideDatasource, TreeDisplayRow } from './types.js';

/** {@link useServerSideTree} options. */
export interface UseServerSideTreeOptions {
  /** Rows per block (request granularity, per node). */
  blockSize: number;
  /** Grouping columns, outermost first (e.g. `['country', 'city']`). */
  rowGroupCols: string[];
}

/** Props to spread onto `<Grid>` for a lazy-group SSRM grid. */
export interface ServerSideTreeGridProps<TData> {
  data: TData[];
  enableVirtualization: true;
  manualSorting: true;
  manualFiltering: true;
  onSortingChange: OnChangeFn<SortingState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  virtualizerOptions: {
    onChange: (
      instance: Virtualizer<HTMLDivElement, HTMLTableRowElement>,
      sync: boolean,
    ) => void;
  };
}

/** {@link useServerSideTree} result. */
export interface UseServerSideTreeResult<TData> {
  /** Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. */
  gridProps: ServerSideTreeGridProps<TData>;
  /** Expand/collapse a group — call from a group cell renderer with `row.__ssrm.groupKeys`. */
  toggleGroup: (groupKeys: string[]) => void;
  /** Invalidate the whole tree and re-fetch the visible range. */
  refresh: () => void;
}

function applyUpdater<T>(updater: T | ((prev: T) => T), prev: T): T {
  return typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
}

export function useServerSideTree<TData>(
  datasource: ServerSideDatasource<TData>,
  options: UseServerSideTreeOptions,
): UseServerSideTreeResult<TData> {
  const [data, setData] = useState<TreeDisplayRow<TData>[]>(() => [
    // initial: one root loading placeholder until the first block resolves.
    { __ssrmPlaceholder: true, rowIndex: 0, __ssrm: { group: options.rowGroupCols.length > 0, level: 0, groupKeys: [] } } as unknown as TreeDisplayRow<TData>,
  ]);

  const controllerRef = useRef<ServerSideTreeController<TData> | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createServerSideTreeController<TData>(
      datasource,
      { blockSize: options.blockSize, rowGroupCols: options.rowGroupCols },
      (nextData) => setData(nextData),
    );
  }
  const controller = controllerRef.current;

  const sortingRef = useRef<SortingState>([]);
  const filtersRef = useRef<ColumnFiltersState>([]);

  const onVirtualizerChange = useCallback(
    (instance: Virtualizer<HTMLDivElement, HTMLTableRowElement>): void => {
      const items = instance.getVirtualItems();
      if (items.length === 0) return;
      controller.ensureRange(items[0]!.index, items[items.length - 1]!.index);
    },
    [controller],
  );

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = applyUpdater(updater, sortingRef.current);
      sortingRef.current = next;
      controller.setSorting(next);
    },
    [controller],
  );
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      const next = applyUpdater(updater, filtersRef.current);
      filtersRef.current = next;
      controller.setColumnFilters(next);
    },
    [controller],
  );

  return {
    gridProps: {
      data: data as TData[],
      enableVirtualization: true,
      manualSorting: true,
      manualFiltering: true,
      onSortingChange,
      onColumnFiltersChange,
      virtualizerOptions: { onChange: onVirtualizerChange },
    },
    toggleGroup: controller.toggleGroup,
    refresh: controller.refresh,
  };
}
