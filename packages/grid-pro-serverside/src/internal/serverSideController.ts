/**
 * `ServerSideController` — the SSRM data-flow logic (MOD-GRID-22 G-2), extracted from React so
 * it is **node-verifiable without a DOM**. Holds the block cache + active sort/filter, plans and
 * fetches blocks for a visible range, and emits a re-materialized array via `onChange`.
 *
 * The `useServerSideData` hook is a thin wrapper: it owns the React state and feeds this
 * controller the virtualizer's visible range + sort/filter changes.
 *
 * Epoch invariant lives in the pure cache ({@link ./blockCache}): each request captures the
 * epoch at send time; a response for a since-invalidated query is discarded by `acceptBlock`.
 */

import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  createBlockCache,
  planBlocks,
  markLoading,
  acceptBlock,
  clearBlock,
  invalidate,
  materialize,
  blockBounds,
} from './blockCache.js';
import type {
  ServerSideDatasource,
  SortModelItem,
  FilterModel,
  RowPlaceholder,
  BlockCacheState,
  GetRowsRequest,
} from '../types.js';

export interface ServerSideControllerOptions {
  blockSize: number;
  rowCount: number;
  /** Server-side pivot (MOD-GRID-67) — optional. Absent = flat/group request unchanged. */
  pivot?: { pivotCols: string[]; valueCols: string[] };
}

export interface ServerSideController<TData> {
  /** Plan + fetch the missing blocks for a visible row range (one request per block). */
  ensureRange(visibleStart: number, visibleEnd: number): void;
  /** Replace the sort, invalidate (epoch++), and re-fetch the last range. */
  setSorting(sorting: SortingState): void;
  /** Replace the filter, invalidate (epoch++), and re-fetch the last range. */
  setColumnFilters(filters: ColumnFiltersState): void;
  /** Invalidate (epoch++) and re-fetch the last range — drops in-flight responses. */
  refresh(): void;
  /** Current materialized array (real rows + placeholders), length = known total. */
  getData(): Array<TData | RowPlaceholder>;
  /** Current known total row count. */
  getTotalCount(): number;
}

function toSortModel(sorting: SortingState): SortModelItem[] {
  return sorting.map((s) => ({ colId: s.id, sort: s.desc ? 'desc' : 'asc' }));
}

function toFilterModel(filters: ColumnFiltersState): FilterModel {
  const model: FilterModel = {};
  for (const f of filters) model[f.id] = f.value;
  return model;
}

/**
 * @param onChange - called whenever the materialized data changes (a block resolved / invalidated).
 *   The hook wires this to `setState`. NOT called synchronously from `ensureRange` for an
 *   unchanged cache — so a scroll→render→onChange loop cannot form (materialize is
 *   range-independent; placeholders exist from construction).
 */
export function createServerSideController<TData>(
  datasource: ServerSideDatasource<TData>,
  options: ServerSideControllerOptions,
  onChange: (
    data: Array<TData | RowPlaceholder>,
    totalCount: number,
    pivotResultFields?: string[],
  ) => void,
): ServerSideController<TData> {
  const { blockSize } = options;
  let cache: BlockCacheState<TData> = createBlockCache<TData>(blockSize);
  let sortModel: SortModelItem[] = [];
  let filterModel: FilterModel = {};
  let range = { start: 0, end: 0 };
  // MOD-GRID-67: latest server pivot-result fields (undefined until a pivot response arrives).
  let pivotResultFields: string[] | undefined;

  const totalOf = (): number => cache.rowCount ?? options.rowCount;
  const getData = (): Array<TData | RowPlaceholder> => materialize(cache, totalOf());
  const emit = (): void => onChange(getData(), totalOf(), pivotResultFields);

  // MOD-GRID-67: pivot request fields — included ONLY when pivot is configured, so a non-pivot
  // request is byte-identical to before (groupKeys-style optional additive).
  const pivotRequest = (): Pick<GetRowsRequest, 'pivotMode' | 'pivotCols' | 'valueCols'> =>
    options.pivot !== undefined
      ? { pivotMode: true, pivotCols: options.pivot.pivotCols, valueCols: options.pivot.valueCols }
      : {};

  const ensureRange = (visibleStart: number, visibleEnd: number): void => {
    range = { start: visibleStart, end: visibleEnd };
    const toFetch = planBlocks(cache, visibleStart, visibleEnd);
    for (const blockIndex of toFetch) {
      const epoch = cache.epoch; // captured at send time
      cache = markLoading(cache, blockIndex);
      const { startRow, endRow } = blockBounds(blockIndex, blockSize);
      datasource
        .getRows({ startRow, endRow, sortModel, filterModel, ...pivotRequest() })
        .then((res) => {
          if (res.pivotResultFields !== undefined) pivotResultFields = res.pivotResultFields;
          cache = acceptBlock(cache, blockIndex, res.rows, epoch, res.lastRow);
          emit();
        })
        .catch(() => {
          cache = clearBlock(cache, blockIndex, epoch);
        });
    }
  };

  const refresh = (): void => {
    cache = invalidate(cache);
    emit(); // back to all-placeholders for the new query
    ensureRange(range.start, range.end);
  };

  return {
    ensureRange,
    setSorting: (sorting) => {
      sortModel = toSortModel(sorting);
      refresh();
    },
    setColumnFilters: (filters) => {
      filterModel = toFilterModel(filters);
      refresh();
    },
    refresh,
    getData,
    getTotalCount: totalOf,
  };
}
