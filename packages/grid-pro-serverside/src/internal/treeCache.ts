/**
 * Pure hierarchical (lazy-group) cache core (MOD-GRID-22 G-3).
 *
 * Structure: a **flat** `Map<pathKey, BlockCacheState>` keyed by `JSON.stringify(groupKeys)` —
 * each node owns a G-1 {@link BlockCacheState} for *its children*. n-level by construction (a
 * deeper level is just a longer path key); G-1 is reused per node, not parameterized.
 *
 * ★ G-3 invariant — **a child response is accepted only if (a) the global epoch still matches AND
 * (b) the target node still exists in the map.** (a) handles sort/filter/grouping change
 * (`invalidateTree` bumps the global epoch); (b) handles expand→fetch→**collapse**-before-resolve
 * (collapse purges the node, so a late response hits "node no longer exists" → discarded). This is
 * the SSRM-tree analog of MOD-27's pin invariant / G-2's epoch — the browser-only-surfacing race
 * pinned deterministically in node.
 *
 * All transitions are pure (return a new state; maps copied, never mutated in place).
 */

import {
  createBlockCache,
  planBlocks,
  markLoading,
  acceptBlock,
  clearBlock,
  materialize,
  isRowPlaceholder,
} from './blockCache.js';
import type {
  BlockCacheState,
  RowPlaceholder,
  TreeCacheState,
  TreeDisplayRow,
  SsrmRowMeta,
} from '../types.js';

/** Stable key for a group path. Root = `pathKeyOf([])` === `"[]"`. */
export function pathKeyOf(groupKeys: readonly string[]): string {
  return JSON.stringify(groupKeys);
}

export function createTreeCache<TData>(
  blockSize: number,
  rowGroupCols: string[],
): TreeCacheState<TData> {
  if (!Number.isInteger(blockSize) || blockSize <= 0) {
    throw new Error(`[grid-pro-serverside] blockSize must be a positive integer, got ${blockSize}`);
  }
  return {
    blockSize,
    epoch: 0,
    nodes: new Map(),
    expanded: new Set(),
    rowGroupCols,
  };
}

/** A node's child count for flatten/plan: known total, else 1 (a single "loading" placeholder). */
function nodeCount<TData>(node: BlockCacheState<TData> | undefined): number {
  if (!node || node.rowCount === null) return 1;
  return node.rowCount;
}

/** Create the node for `pathKey` if missing, stamped with the current global epoch. */
export function ensureNode<TData>(
  tree: TreeCacheState<TData>,
  pathKey: string,
): TreeCacheState<TData> {
  if (tree.nodes.has(pathKey)) return tree;
  const nodes = new Map(tree.nodes);
  nodes.set(pathKey, { ...createBlockCache<TData>(tree.blockSize), epoch: tree.epoch });
  return { ...tree, nodes };
}

export function isExpanded<TData>(tree: TreeCacheState<TData>, groupKeys: readonly string[]): boolean {
  return tree.expanded.has(pathKeyOf(groupKeys));
}

function isDescendantPath(childKey: string, parentKey: string): boolean {
  const child = JSON.parse(childKey) as string[];
  const parent = JSON.parse(parentKey) as string[];
  return child.length > parent.length && parent.every((v, i) => child[i] === v);
}

/**
 * Expand or collapse a group. **Expand** adds the path to `expanded` and ensures its node exists.
 * **Collapse** removes it from `expanded` and **purges** its node + all descendant nodes (so any
 * in-flight child response for them is later rejected by `acceptTreeBlock`'s node-existence check).
 */
export function toggleGroup<TData>(
  tree: TreeCacheState<TData>,
  groupKeys: readonly string[],
): TreeCacheState<TData> {
  const pk = pathKeyOf(groupKeys);
  if (tree.expanded.has(pk)) {
    // collapse — purge this node + descendants + descendant expansions.
    const expanded = new Set(tree.expanded);
    const nodes = new Map(tree.nodes);
    expanded.delete(pk);
    nodes.delete(pk);
    for (const key of tree.nodes.keys()) {
      if (isDescendantPath(key, pk)) nodes.delete(key);
    }
    for (const key of tree.expanded) {
      if (isDescendantPath(key, pk)) expanded.delete(key);
    }
    return { ...tree, expanded, nodes };
  }
  // expand.
  const expanded = new Set(tree.expanded);
  expanded.add(pk);
  return ensureNode({ ...tree, expanded }, pk);
}

/**
 * Invalidate the whole tree (sort/filter/grouping change) — bump the global epoch and drop every
 * node's blocks; `expanded` is kept (re-fetched). Any in-flight response (old epoch) is rejected.
 */
export function invalidateTree<TData>(tree: TreeCacheState<TData>): TreeCacheState<TData> {
  return { ...tree, epoch: tree.epoch + 1, nodes: new Map() };
}

/** Mark a node's block in-flight at the current global epoch (node must exist). */
export function markTreeLoading<TData>(
  tree: TreeCacheState<TData>,
  pathKey: string,
  blockIndex: number,
): TreeCacheState<TData> {
  const node = tree.nodes.get(pathKey);
  if (!node) return tree;
  const nodes = new Map(tree.nodes);
  nodes.set(pathKey, markLoading(node, blockIndex));
  return { ...tree, nodes };
}

/**
 * Accept a child block — **discarded unless (a) `epoch === tree.epoch` AND (b) the node still
 * exists** (the G-3 invariant). On accept, stores into that node's G-1 cache.
 */
export function acceptTreeBlock<TData>(
  tree: TreeCacheState<TData>,
  pathKey: string,
  blockIndex: number,
  rows: TData[],
  epoch: number,
  lastRow?: number,
): TreeCacheState<TData> {
  if (epoch !== tree.epoch) return tree; // (a) stale query
  const node = tree.nodes.get(pathKey);
  if (!node) return tree; // (b) node purged (collapsed)
  const newNode = acceptBlock(node, blockIndex, rows, epoch, lastRow);
  if (newNode === node) return tree;
  const nodes = new Map(tree.nodes);
  nodes.set(pathKey, newNode);
  return { ...tree, nodes };
}

/** Drop a failed in-flight child block so it can be re-requested (epoch + node-existence guarded). */
export function clearTreeBlock<TData>(
  tree: TreeCacheState<TData>,
  pathKey: string,
  blockIndex: number,
  epoch: number,
): TreeCacheState<TData> {
  if (epoch !== tree.epoch) return tree;
  const node = tree.nodes.get(pathKey);
  if (!node) return tree;
  const newNode = clearBlock(node, blockIndex, epoch);
  if (newNode === node) return tree;
  const nodes = new Map(tree.nodes);
  nodes.set(pathKey, newNode);
  return { ...tree, nodes };
}

interface WalkRow<TData> {
  row: TreeDisplayRow<TData>;
  pathKey: string;
  localIndex: number;
}

// Depth-first walk of the visible tree (root + expanded paths). Produces the display list and,
// per display row, its source (pathKey, localIndex) for block planning.
function walkTree<TData>(tree: TreeCacheState<TData>): WalkRow<TData>[] {
  const out: WalkRow<TData>[] = [];
  const cols = tree.rowGroupCols;

  const walk = (groupKeys: string[], level: number): void => {
    const pk = pathKeyOf(groupKeys);
    const node = tree.nodes.get(pk);
    const count = nodeCount(node);
    const isGroupLevel = level < cols.length;
    const mat: Array<TData | RowPlaceholder> = node
      ? materialize(node, count)
      : Array.from({ length: count }, (_, i) => ({ __ssrmPlaceholder: true as const, rowIndex: i }));

    for (let i = 0; i < count; i++) {
      const raw = mat[i]!;
      const placeholder = isRowPlaceholder(raw);
      let ownKeys = groupKeys;
      let expanded: boolean | undefined;
      if (isGroupLevel && !placeholder) {
        const groupValue = String((raw as Record<string, unknown>)[cols[level]!]);
        ownKeys = [...groupKeys, groupValue];
        expanded = tree.expanded.has(pathKeyOf(ownKeys));
      }
      const meta: SsrmRowMeta = {
        group: isGroupLevel,
        level,
        groupKeys: ownKeys,
        ...(expanded !== undefined ? { expanded } : {}),
      };
      const display = Object.assign({}, raw, { __ssrm: meta }) as TreeDisplayRow<TData>;
      out.push({ row: display, pathKey: pk, localIndex: i });

      if (isGroupLevel && !placeholder && expanded) {
        walk(ownKeys, level + 1);
      }
    }
  };

  walk([], 0);
  return out;
}

/** The full display list (group rows + children/placeholders), in render order. Feed to `<Grid data>`. */
export function flattenTree<TData>(tree: TreeCacheState<TData>): TreeDisplayRow<TData>[] {
  return walkTree(tree).map((w) => w.row);
}

/** Ensure every node referenced by the current display range exists (so its blocks can be planned). */
export function ensureVisibleNodes<TData>(
  tree: TreeCacheState<TData>,
  displayStart: number,
  displayEnd: number,
): TreeCacheState<TData> {
  const walk = walkTree(tree);
  const lo = Math.max(0, Math.min(displayStart, displayEnd));
  const hi = Math.min(walk.length - 1, Math.max(displayStart, displayEnd));
  let next = tree;
  for (let i = lo; i <= hi; i++) {
    next = ensureNode(next, walk[i]!.pathKey);
  }
  return next;
}

/** A block to fetch: which node (`groupKeys`/`pathKey`) and which block index within it. */
export interface TreeBlockRequest {
  groupKeys: string[];
  pathKey: string;
  blockIndex: number;
}

/**
 * Plan the missing blocks for a visible display range (one request per node-block). Maps the
 * display range to per-node local ranges, then reuses G-1 `planBlocks` per node (dedup of
 * loaded/in-flight). Nodes must be ensured first ({@link ensureVisibleNodes}).
 */
export function planTreeBlocks<TData>(
  tree: TreeCacheState<TData>,
  displayStart: number,
  displayEnd: number,
): TreeBlockRequest[] {
  const walk = walkTree(tree);
  const lo = Math.max(0, Math.min(displayStart, displayEnd));
  const hi = Math.min(walk.length - 1, Math.max(displayStart, displayEnd));
  if (hi < 0) return [];

  const perNode = new Map<string, { min: number; max: number }>();
  for (let i = lo; i <= hi; i++) {
    const { pathKey, localIndex } = walk[i]!;
    const cur = perNode.get(pathKey);
    if (cur) {
      cur.min = Math.min(cur.min, localIndex);
      cur.max = Math.max(cur.max, localIndex);
    } else {
      perNode.set(pathKey, { min: localIndex, max: localIndex });
    }
  }

  const out: TreeBlockRequest[] = [];
  for (const [pathKey, { min, max }] of perNode) {
    const node = tree.nodes.get(pathKey) ?? createBlockCache<TData>(tree.blockSize);
    for (const blockIndex of planBlocks(node, min, max)) {
      out.push({ pathKey, groupKeys: JSON.parse(pathKey) as string[], blockIndex });
    }
  }
  return out;
}
