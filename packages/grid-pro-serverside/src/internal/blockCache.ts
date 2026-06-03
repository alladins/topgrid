/**
 * Pure block-cache core (MOD-GRID-22 G-1) — the load-bearing, node-verified piece of SSRM.
 *
 * ★ Invariant — **stale-response rejection via query epoch**: when sort/filter/group changes,
 * {@link invalidate} bumps `epoch`; an in-flight response carrying an old epoch is discarded by
 * {@link acceptBlock} and can never corrupt the new query's cache. This is the SSRM analog of
 * MOD-27's pin-always-render invariant — the dangerous async race (fast sort-toggle reordering
 * rows) pinned deterministically in node, so the browser's only job is "blocks load once".
 *
 * All transitions are **pure**: they take a state and return a new one (the `blocks` Map is
 * copied, never mutated in place). React/network live in the G-2 hook, not here.
 */

import type { BlockCacheState, RowPlaceholder } from '../types.js';

/** Create an empty cache at epoch 0. */
export function createBlockCache<TData>(blockSize: number): BlockCacheState<TData> {
  if (!Number.isInteger(blockSize) || blockSize <= 0) {
    throw new Error(`[grid-pro-serverside] blockSize must be a positive integer, got ${blockSize}`);
  }
  return { blockSize, epoch: 0, blocks: new Map(), rowCount: null };
}

/** Block index containing an absolute row index. */
export function blockIndexOf(rowIndex: number, blockSize: number): number {
  return Math.floor(rowIndex / blockSize);
}

/** Half-open absolute row range `[startRow, endRow)` of a block. */
export function blockBounds(
  blockIndex: number,
  blockSize: number,
): { startRow: number; endRow: number } {
  const startRow = blockIndex * blockSize;
  return { startRow, endRow: startRow + blockSize };
}

/**
 * Block indices a visible row range needs that are **not already loaded or in-flight**
 * (AC① — one request per block). `visibleStartRow`/`visibleEndRow` are inclusive row indices.
 * Returns ascending, de-duplicated, missing-only block indices.
 */
export function planBlocks<TData>(
  cache: BlockCacheState<TData>,
  visibleStartRow: number,
  visibleEndRow: number,
): number[] {
  const start = Math.max(0, Math.min(visibleStartRow, visibleEndRow));
  const end = Math.max(visibleStartRow, visibleEndRow);
  if (end < 0) return [];
  const firstBlock = blockIndexOf(start, cache.blockSize);
  const lastBlock = blockIndexOf(end, cache.blockSize);
  const out: number[] = [];
  for (let b = firstBlock; b <= lastBlock; b++) {
    if (!cache.blocks.has(b)) out.push(b); // missing → loading/loaded are both present in the map
  }
  return out;
}

/** Mark a block in-flight at the **current** epoch (the request's captured epoch is `cache.epoch`). */
export function markLoading<TData>(
  cache: BlockCacheState<TData>,
  blockIndex: number,
): BlockCacheState<TData> {
  const blocks = new Map(cache.blocks);
  blocks.set(blockIndex, { status: 'loading' });
  return { ...cache, blocks };
}

/**
 * Accept a block response. **Rejected (state unchanged) if `responseEpoch !== cache.epoch`** —
 * the request was issued for a query that has since been invalidated. On accept, the block is
 * stored as `loaded`; `lastRow` (when provided) sets the known total row count.
 */
export function acceptBlock<TData>(
  cache: BlockCacheState<TData>,
  blockIndex: number,
  rows: TData[],
  responseEpoch: number,
  lastRow?: number,
): BlockCacheState<TData> {
  if (responseEpoch !== cache.epoch) return cache; // stale — discard
  const blocks = new Map(cache.blocks);
  blocks.set(blockIndex, { status: 'loaded', rows });
  const rowCount = typeof lastRow === 'number' ? lastRow : cache.rowCount;
  return { ...cache, blocks, rowCount };
}

/**
 * Invalidate the whole cache (AC④) — clears all blocks and **bumps the epoch** so any in-flight
 * response (old epoch) is later rejected by {@link acceptBlock}. Called on sort/filter/group
 * change or explicit `refresh()`. `rowCount` is cleared (the new query may have a different total).
 */
export function invalidate<TData>(cache: BlockCacheState<TData>): BlockCacheState<TData> {
  return { ...cache, epoch: cache.epoch + 1, blocks: new Map(), rowCount: null };
}

/**
 * Drop an in-flight block so it can be re-requested — call on a **failed** `getRows` (the
 * datasource contract says a rejected fetch leaves the block unloaded, re-requestable). No-op if
 * the epoch has since changed (invalidate already cleared it) or the block is no longer loading,
 * so a late failure can't disturb a fresh query.
 */
export function clearBlock<TData>(
  cache: BlockCacheState<TData>,
  blockIndex: number,
  epoch: number,
): BlockCacheState<TData> {
  if (epoch !== cache.epoch) return cache;
  const block = cache.blocks.get(blockIndex);
  if (!block || block.status !== 'loading') return cache;
  const blocks = new Map(cache.blocks);
  blocks.delete(blockIndex);
  return { ...cache, blocks };
}

/** Type guard for placeholder rows from {@link materialize}. */
export function isRowPlaceholder(row: unknown): row is RowPlaceholder {
  return (
    typeof row === 'object' &&
    row !== null &&
    (row as RowPlaceholder).__ssrmPlaceholder === true
  );
}

/**
 * Materialize a `totalCount`-length array (AC④ memory note): loaded indices carry their real
 * row, not-yet-loaded indices carry a {@link RowPlaceholder}. Pure — feeds the existing
 * `<Grid enableVirtualization data>` (LESS-005 shape: minimal primitive on host public surface).
 */
export function materialize<TData>(
  cache: BlockCacheState<TData>,
  totalCount: number,
): Array<TData | RowPlaceholder>{
  const out: Array<TData | RowPlaceholder> = new Array(Math.max(0, totalCount));
  for (let i = 0; i < out.length; i++) {
    const block = cache.blocks.get(blockIndexOf(i, cache.blockSize));
    if (block?.status === 'loaded' && block.rows) {
      const offset = i - blockIndexOf(i, cache.blockSize) * cache.blockSize;
      const row = block.rows[offset];
      out[i] = row !== undefined ? row : { __ssrmPlaceholder: true, rowIndex: i };
    } else {
      out[i] = { __ssrmPlaceholder: true, rowIndex: i };
    }
  }
  return out;
}
