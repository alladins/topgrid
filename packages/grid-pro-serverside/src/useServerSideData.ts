/**
 * `useServerSideData` — thin SSRM wiring (MOD-GRID-22 G-2).
 *
 * Connects the consumer's {@link ServerSideDatasource} to the existing `<Grid enableVirtualization>`
 * through the pure block cache (G-1). All data-flow logic lives in the node-verified
 * {@link ServerSideController}; this hook only owns React state and feeds the controller the row
 * virtualizer's visible range (via `virtualizerOptions.onChange`, a generic grid-core passthrough)
 * and sort/filter changes.
 *
 * The dangerous async race (a slow response for an old sort/filter clobbering the new query) is
 * handled by the **epoch invariant** in the pure core.
 *
 * @remarks
 * The `datasource` is captured **once** (the controller is created on first render). Define it
 * outside the component or memoize it (`useMemo`) — a new identity each render is ignored, not
 * re-bound. Same v1-limit class as the `rowCount`-length placeholder array (no LRU eviction).
 *
 * @see ./internal/serverSideController
 * @see ./internal/blockCache
 */

import { useCallback, useRef, useState } from 'react';
import type {
  OnChangeFn,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import {
  createServerSideController,
  type ServerSideController,
} from './internal/serverSideController.js';
import { materialize, createBlockCache } from './internal/blockCache.js';
import {
  buildServerPivotColumns,
  type ServerPivotColumn,
} from './internal/buildServerPivotColumns.js';
import type { ServerSideDatasource, RowPlaceholder } from './types.js';

/** {@link useServerSideData} options. */
export interface UseServerSideDataOptions {
  /** Rows per block (request granularity). */
  blockSize: number;
  /**
   * Initial total row count (v1: required — sizes the virtualizer up front). Refined by a
   * `getRows` response's `lastRow` once the end is reached. (v1 memory note: a `rowCount`-length
   * placeholder array is allocated; no LRU eviction.)
   */
  rowCount: number;
  /**
   * Server-side pivot (MOD-GRID-67) — optional. When set, requests carry `pivotMode`/`pivotCols`/
   * `valueCols`; the response's `pivotResultFields` are surfaced as {@link UseServerSideDataResult.pivotColumns}.
   * Absent = flat/group mode (byte-identical to before). Captured once like `datasource`.
   */
  pivot?: { pivotCols: string[]; valueCols: string[]; separator?: string };
}

/**
 * Props to spread onto `<Grid>`. The `data` may contain {@link RowPlaceholder} rows for
 * not-yet-loaded indices — detect them with `isRowPlaceholder` in a cell renderer to show a
 * skeleton (otherwise accessors read `undefined` → blank cells while loading).
 */
export interface ServerSideGridProps<TData> {
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

/** {@link useServerSideData} result. */
export interface UseServerSideDataResult<TData> {
  /** Spread onto `<Grid columns={...} {...gridProps} virtualScrollHeight={...} />`. */
  gridProps: ServerSideGridProps<TData>;
  /** Current known total row count (grows as `lastRow` is learned). */
  totalCount: number;
  /**
   * Server-side pivot (MOD-GRID-67) — the derived nested pivot-result column tree from the server's
   * `pivotResultFields` (empty until a pivot response arrives / when not pivoting). Spread into
   * `<Grid columns={[...fixedCols, ...pivotColumns]} />`.
   */
  pivotColumns: ServerPivotColumn[];
  /** Invalidate the cache (epoch++) and re-fetch the visible range — drops in-flight responses. */
  refresh: () => void;
}

function applyUpdater<T>(updater: T | ((prev: T) => T), prev: T): T {
  return typeof updater === 'function'
    ? (updater as (p: T) => T)(prev)
    : updater;
}

export function useServerSideData<TData>(
  datasource: ServerSideDatasource<TData>,
  options: UseServerSideDataOptions,
): UseServerSideDataResult<TData> {
  const [data, setData] = useState<Array<TData | RowPlaceholder>>(() =>
    materialize(createBlockCache<TData>(options.blockSize), options.rowCount),
  );
  const [totalCount, setTotalCount] = useState<number>(options.rowCount);
  // MOD-GRID-67: derived pivot-result columns (empty until a pivot response arrives).
  const [pivotColumns, setPivotColumns] = useState<ServerPivotColumn[]>([]);
  const pivotSeparator = options.pivot?.separator;

  // Controller created once. setData/setTotalCount are stable → controller never re-created.
  const controllerRef = useRef<ServerSideController<TData> | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createServerSideController<TData>(
      datasource,
      {
        blockSize: options.blockSize,
        rowCount: options.rowCount,
        ...(options.pivot !== undefined
          ? { pivot: { pivotCols: options.pivot.pivotCols, valueCols: options.pivot.valueCols } }
          : {}),
      },
      (nextData, nextTotal, pivotResultFields) => {
        setData(nextData);
        setTotalCount(nextTotal);
        if (pivotResultFields !== undefined) {
          setPivotColumns(buildServerPivotColumns(pivotResultFields, pivotSeparator));
        }
      },
    );
  }
  const controller = controllerRef.current;

  // Grid drives state uncontrolled; the hook mirrors sort/filter to derive server params. Both
  // start [] and apply the same updater sequence → stay in sync (v1: no external sorting prop).
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
    // RowPlaceholder rows are intentionally present in `data` (v1 cast — like MOD-25 Table<any>);
    // consumers detect them via isRowPlaceholder. Accessors on a placeholder read undefined.
    gridProps: {
      data: data as TData[],
      enableVirtualization: true,
      manualSorting: true,
      manualFiltering: true,
      onSortingChange,
      onColumnFiltersChange,
      virtualizerOptions: { onChange: onVirtualizerChange },
    },
    totalCount,
    pivotColumns,
    refresh: controller.refresh,
  };
}
