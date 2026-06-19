// W3-4 (ADR-006) — pure adapters: TanStack Cell/Column → topgrid clean context. Non-breaking bridge
// (existing callbacks keep TanStack types until grid-core 1.0; consumers opt in via these helpers).
// Inputs are MINIMAL structural shapes that TanStack's Cell/Column satisfy → no @tanstack import here,
// so this stays node-testable (React/TanStack-free).
import type { GridCellContext, GridFilterColumn } from './cleanTypes.js';

/** Minimal structural view of a TanStack `Cell` (it satisfies this — we read only these). */
export interface CellLike<TData> {
  row: { id: string; original: TData };
  column: { id: string };
  getValue: () => unknown;
}

/** Minimal structural view of a TanStack `Column` (filter side). */
export interface FilterColumnLike {
  id: string;
  getFilterValue: () => unknown;
  setFilterValue: (next: unknown) => void;
}

/**
 * TanStack `Cell` → {@link GridCellContext}. Use inside onCellClick / onCellKeyDown / getCellTooltip
 * to read cell data without TanStack knowledge — e.g. `const c = toGridCell(cell)` then read
 * `c.value` / `c.rowId` / `c.row`.
 */
export function toGridCell<TData>(cell: CellLike<TData>): GridCellContext<TData> {
  return {
    rowId: cell.row.id,
    columnId: cell.column.id,
    value: cell.getValue(),
    row: cell.row.original,
  };
}

/** TanStack filter `Column` → {@link GridFilterColumn} (value + setValue, no method spelunking). */
export function toGridFilterColumn(column: FilterColumnLike): GridFilterColumn {
  return {
    id: column.id,
    value: column.getFilterValue(),
    setValue: column.setFilterValue,
  };
}
