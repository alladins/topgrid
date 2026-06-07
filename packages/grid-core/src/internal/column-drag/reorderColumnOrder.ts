/**
 * @topgrid/grid-core — reorderColumnOrder (MOD-GRID-65 / G-1).
 *
 * Canonical column-order reorder math, extracted from `useColumnDrag.onDrop`
 * (which now calls this) so header-drag and any other reorder affordance
 * (e.g. the tool-panel drag, MOD-65) converge on ONE semantics.
 *
 * Semantics = **insert-before**: `sourceId` is removed, then re-inserted at the
 * index `targetId` currently occupies in the source-removed array — i.e. source
 * lands immediately before the target. This matches the prior inline onDrop math
 * (byte-identical) and the list-reorder convention.
 *
 * No-op cases return the SAME `baseOrder` reference (callers detect via `===`):
 * - `sourceId === targetId` (dropped onto itself),
 * - `targetId` absent from `baseOrder`.
 */
export function reorderColumnOrder(
  baseOrder: string[],
  sourceId: string,
  targetId: string,
): string[] {
  if (sourceId === targetId) return baseOrder;
  const without = baseOrder.filter((id) => id !== sourceId);
  const targetIndex = without.indexOf(targetId);
  if (targetIndex === -1) return baseOrder;
  without.splice(targetIndex, 0, sourceId);
  return without;
}
