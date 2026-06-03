/**
 * `ServerSideTreeController` — lazy-group SSRM data-flow logic (MOD-GRID-22 G-3), extracted from
 * React so it is node-verifiable without a DOM. Wraps the pure {@link ./treeCache}: plans/fetches
 * child blocks for the visible display range, handles expand/collapse, and emits the flattened
 * display list via `onChange`.
 *
 * Loop discipline (as in G-2): `emit` fires only on (a) a block resolving or (b) an expand/collapse
 * toggle — never synchronously inside the virtualizer `onChange` path (`ensureRange` only
 * plans+fetches). `ensureVisibleNodes` cannot change the flatten output (a missing node and an
 * empty node both flatten to one loading placeholder), so it is safe to skip emit there.
 */

import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { blockBounds } from './blockCache.js';
import {
  createTreeCache,
  ensureVisibleNodes,
  planTreeBlocks,
  markTreeLoading,
  acceptTreeBlock,
  clearTreeBlock,
  invalidateTree,
  toggleGroup,
  flattenTree,
} from './treeCache.js';
import type {
  ServerSideDatasource,
  SortModelItem,
  FilterModel,
  TreeCacheState,
  TreeDisplayRow,
} from '../types.js';

export interface ServerSideTreeControllerOptions {
  blockSize: number;
  /** Grouping columns, outermost first. */
  rowGroupCols: string[];
}

export interface ServerSideTreeController<TData> {
  /** Plan + fetch missing child blocks for a visible display range. */
  ensureRange(visibleStart: number, visibleEnd: number): void;
  /** Expand or collapse the group at `groupKeys` (collapse purges its subtree). */
  toggleGroup(groupKeys: string[]): void;
  /** Replace the sort, invalidate the whole tree (epoch++), re-fetch the visible range. */
  setSorting(sorting: SortingState): void;
  /** Replace the filter, invalidate the whole tree (epoch++), re-fetch the visible range. */
  setColumnFilters(filters: ColumnFiltersState): void;
  /** Invalidate the whole tree (epoch++) and re-fetch — drops in-flight responses. */
  refresh(): void;
  /** Current flattened display list (group rows + children/placeholders). */
  getData(): TreeDisplayRow<TData>[];
}

function toSortModel(sorting: SortingState): SortModelItem[] {
  return sorting.map((s) => ({ colId: s.id, sort: s.desc ? 'desc' : 'asc' }));
}
function toFilterModel(filters: ColumnFiltersState): FilterModel {
  const model: FilterModel = {};
  for (const f of filters) model[f.id] = f.value;
  return model;
}

export function createServerSideTreeController<TData>(
  datasource: ServerSideDatasource<TData>,
  options: ServerSideTreeControllerOptions,
  onChange: (data: TreeDisplayRow<TData>[]) => void,
): ServerSideTreeController<TData> {
  const { blockSize, rowGroupCols } = options;
  let tree: TreeCacheState<TData> = createTreeCache<TData>(blockSize, rowGroupCols);
  let sortModel: SortModelItem[] = [];
  let filterModel: FilterModel = {};
  let range = { start: 0, end: 0 };

  const emit = (): void => onChange(flattenTree(tree));

  const ensureRange = (visibleStart: number, visibleEnd: number): void => {
    range = { start: visibleStart, end: visibleEnd };
    // Ensure visible nodes exist so their blocks can be planned. This never changes the flatten
    // output (empty node ≡ missing node ≡ one loading placeholder) → no emit needed here.
    tree = ensureVisibleNodes(tree, visibleStart, visibleEnd);
    for (const { pathKey, groupKeys, blockIndex } of planTreeBlocks(tree, visibleStart, visibleEnd)) {
      const epoch = tree.epoch; // captured at send time
      tree = markTreeLoading(tree, pathKey, blockIndex);
      const { startRow, endRow } = blockBounds(blockIndex, blockSize);
      datasource
        .getRows({ startRow, endRow, sortModel, filterModel, groupKeys, rowGroupCols })
        .then((res) => {
          tree = acceptTreeBlock(tree, pathKey, blockIndex, res.rows, epoch, res.lastRow);
          emit();
        })
        .catch(() => {
          tree = clearTreeBlock(tree, pathKey, blockIndex, epoch);
        });
    }
  };

  const refresh = (): void => {
    tree = invalidateTree(tree);
    emit(); // back to placeholders for the new query
    ensureRange(range.start, range.end);
  };

  return {
    ensureRange,
    toggleGroup: (groupKeys) => {
      tree = toggleGroup(tree, groupKeys);
      emit(); // discrete user action — display list length changes (allowed)
      ensureRange(range.start, range.end); // fetch newly-revealed children
    },
    setSorting: (sorting) => {
      sortModel = toSortModel(sorting);
      refresh();
    },
    setColumnFilters: (filters) => {
      filterModel = toFilterModel(filters);
      refresh();
    },
    refresh,
    getData: () => flattenTree(tree),
  };
}
