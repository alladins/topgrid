/**
 * @topgrid/grid-core — transferRow (MOD-GRID-66 / G-1).
 *
 * Move one row (by id) from a source array to the end of a target array — the
 * pure spine of drag-between-grids. The dragged row's identity is owned by the
 * consumer (lifted above both grids); this helper just applies the move (no
 * dataTransfer, no React) so it is node-testable and the DnD wiring stays thin.
 *
 * No-op (rowId not found in `source`) returns the SAME `source`/`target`
 * references (callers may detect via `===`); originals are never mutated.
 */
export function transferRow<T>(
  source: readonly T[],
  target: readonly T[],
  rowId: string,
  getId: (row: T) => string,
): { source: T[]; target: T[] } {
  const index = source.findIndex((r) => getId(r) === rowId);
  if (index === -1) {
    return { source: source as T[], target: target as T[] };
  }
  const moved = source[index]!;
  return {
    source: source.filter((_, i) => i !== index),
    target: [...target, moved],
  };
}
