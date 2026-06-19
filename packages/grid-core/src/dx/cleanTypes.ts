// W3-4 (ADR-006) — topgrid-owned "clean" context types that let consumers read cell / filter data
// WITHOUT importing or understanding TanStack's `Cell` / `Column`. Curated subsets, no TanStack methods.

/** Clean cell context — what a consumer actually needs in onCellClick/onCellKeyDown/getCellTooltip. */
export interface GridCellContext<TData> {
  /** Stable row id (from getRowId, or the array index fallback). */
  rowId: string;
  /** Column id. */
  columnId: string;
  /** The cell's value. */
  value: unknown;
  /** The original row object. */
  row: TData;
}

/** Clean filter column — normalises TanStack `getFilterValue`/`setFilterValue` to value/setValue. */
export interface GridFilterColumn {
  id: string;
  value: unknown;
  setValue: (next: unknown) => void;
}
