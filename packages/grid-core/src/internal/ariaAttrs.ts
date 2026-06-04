/**
 * WAI-ARIA grid attribute core (MOD-GRID-28 G-1) — pure, node-verified.
 *
 * ★ Invariant (spine): under row/column virtualization the DOM holds only a *windowed* subset, so
 * the browser's implicit positional counting is wrong. `aria-rowindex`/`aria-colindex` are 1-based
 * and **absolute** (row index spans the full data set with header rows occupying 1..headerRowCount;
 * col index spans the full *visual* column order — pinnedLeft → center → pinnedRight). These
 * functions take the absolute index, never the DOM position, so a windowed row at DOM position 0
 * still reports its true `aria-rowindex`.
 *
 * ★ role-completeness: once `<table>` is `role="grid"` the native table semantics are suppressed,
 * so every row needs `role="row"` and every cell `role="gridcell"`/`columnheader`. These builders
 * produce the complete set; partial application is worse than none.
 */

export type AriaSortValue = 'ascending' | 'descending' | 'none';

/** aria-rowcount = header rows + data rows (1-based count, includes headers). */
export function ariaRowCount(headerRowCount: number, dataRowCount: number): number {
  return headerRowCount + dataRowCount;
}

/** 1-based aria-rowindex for a data row at absolute data index (headers occupy 1..headerRowCount). */
export function dataRowAriaIndex(headerRowCount: number, absDataIndex: number): number {
  return headerRowCount + absDataIndex + 1;
}

/** Full visual column order `[pinnedLeft, center, pinnedRight]` — ALL columns (not windowed). */
export function visualColumnOrder(
  pinnedLeftIds: readonly string[],
  centerIds: readonly string[],
  pinnedRightIds: readonly string[],
): string[] {
  return [...pinnedLeftIds, ...centerIds, ...pinnedRightIds];
}

/** 1-based aria-colindex lookup over the visual order (0 = not found). O(1). */
export function buildAriaColIndex(visualOrder: readonly string[]): (colId: string) => number {
  const map = new Map<string, number>();
  visualOrder.forEach((id, i) => map.set(id, i + 1));
  return (colId) => map.get(colId) ?? 0;
}

/** TanStack `getIsSorted()` (`'asc' | 'desc' | false`) → aria-sort value. */
export function toAriaSort(sorted: 'asc' | 'desc' | false): AriaSortValue {
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';
}

export interface GridContainerAria {
  role: 'grid';
  'aria-rowcount': number;
  'aria-colcount': number;
  'aria-multiselectable'?: true;
}
/** `<table>` container attrs. `multiselectable` → `aria-multiselectable` for multi-row selection. */
export function gridContainerAttrs(
  headerRowCount: number,
  dataRowCount: number,
  leafColCount: number,
  multiselectable: boolean,
): GridContainerAria {
  const attrs: GridContainerAria = {
    role: 'grid',
    'aria-rowcount': ariaRowCount(headerRowCount, dataRowCount),
    'aria-colcount': leafColCount,
  };
  if (multiselectable) attrs['aria-multiselectable'] = true;
  return attrs;
}

/** Header `<tr>` attrs (header rows occupy the first aria rows). */
export function headerRowAttrs(ariaRowIndex: number): { role: 'row'; 'aria-rowindex': number } {
  return { role: 'row', 'aria-rowindex': ariaRowIndex };
}

export interface ColumnHeaderAria {
  role: 'columnheader';
  'aria-colindex'?: number;
  'aria-sort'?: AriaSortValue;
}
/**
 * `<th>` attrs. `aria-colindex` is **omitted for non-leaf (group/spanning) headers** — those map
 * to no single visual column, so `buildAriaColIndex` returns `0` (which is an invalid aria-colindex,
 * must be ≥1). `0 ⟺ non-leaf` since `visualOrder` is exactly the visible leaves. `aria-sort` only
 * when sortable.
 */
export function columnHeaderAttrs(
  ariaColIndex: number,
  canSort: boolean,
  sorted: 'asc' | 'desc' | false,
): ColumnHeaderAria {
  const attrs: ColumnHeaderAria = { role: 'columnheader' };
  if (ariaColIndex > 0) attrs['aria-colindex'] = ariaColIndex;
  if (canSort) attrs['aria-sort'] = toAriaSort(sorted);
  return attrs;
}

export interface DataRowAria {
  role: 'row';
  'aria-rowindex': number;
  'aria-selected'?: boolean;
}
/** Data `<tr>` attrs. `aria-selected` (true/false) only when row selection is enabled. */
export function dataRowAttrs(
  ariaRowIndex: number,
  selectable: boolean,
  selected: boolean,
): DataRowAria {
  const attrs: DataRowAria = { role: 'row', 'aria-rowindex': ariaRowIndex };
  if (selectable) attrs['aria-selected'] = selected;
  return attrs;
}

/** `<td>` data-cell attrs. */
export function gridCellAttrs(ariaColIndex: number): { role: 'gridcell'; 'aria-colindex': number } {
  return { role: 'gridcell', 'aria-colindex': ariaColIndex };
}
