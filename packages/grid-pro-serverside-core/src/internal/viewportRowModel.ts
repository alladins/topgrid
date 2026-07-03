/**
 * @topgrid/grid-pro-serverside — viewport row model (MOD-GRID-68).
 *
 * AG's Viewport Row Model: a **push-based**, real-time model. Unlike SSRM (pull: the grid asks
 * `getRows`), here the grid tells the datasource its visible range (`setViewportRange`) and the
 * datasource **pushes** rows back through callbacks (`setRowData`) — and can push **in-place
 * updates** to already-visible rows at any time (streaming / live data).
 *
 * React-free + the pure `materializeViewport` map, so both are node-verifiable. Reuses the SSRM
 * {@link RowPlaceholder} shape (consumers detect via `isRowPlaceholder`). The SSRM block cache /
 * controller are untouched — this is an independent model.
 */

import type { RowPlaceholder } from '../types.js';

/** Callbacks the controller hands the datasource so it can push counts/rows. */
export interface ViewportDatasourceParams<TData> {
  /** Set the total row count (sizes the virtualizer). */
  setRowCount: (count: number) => void;
  /** Push rows by absolute index (in-place — re-pushing an index updates that row live). */
  setRowData: (rows: Record<number, TData>) => void;
}

/** Consumer-supplied viewport datasource (AG IViewportDatasource shape). */
export interface ViewportDatasource<TData> {
  /** Called once with the push callbacks. Typically pushes the initial row count here. */
  init(params: ViewportDatasourceParams<TData>): void;
  /** The grid's visible range changed — the datasource should push rows for `[firstRow, lastRow]`. */
  setViewportRange(firstRow: number, lastRow: number): void;
  /** Optional teardown (unsubscribe from the live feed). */
  destroy?(): void;
}

export interface ViewportRowModelOptions {
  /** Initial total row count (refined by the datasource's `setRowCount`). */
  rowCount: number;
}

export interface ViewportRowModel<TData> {
  /** Forward a visible range to the datasource (drives the push). */
  setRange(firstRow: number, lastRow: number): void;
  /** Current materialized array (real rows + placeholders), length = known total. */
  getData(): Array<TData | RowPlaceholder>;
  /** Current known total row count. */
  getRowCount(): number;
  /** Tear down the datasource subscription. */
  destroy(): void;
}

/**
 * Pure: build a placeholder-filled array of length `rowCount` from a sparse `index → row` map.
 * Not-yet-pushed indices carry a {@link RowPlaceholder} (same shape as the SSRM materialize).
 */
export function materializeViewport<TData>(
  rows: Map<number, TData>,
  rowCount: number,
): Array<TData | RowPlaceholder> {
  const out: Array<TData | RowPlaceholder> = new Array(Math.max(0, rowCount));
  for (let i = 0; i < out.length; i++) {
    const row = rows.get(i);
    out[i] = row !== undefined ? row : { __ssrmPlaceholder: true, rowIndex: i };
  }
  return out;
}

/**
 * Create a viewport row-model controller. Calls `datasource.init` once with push callbacks, forwards
 * visible ranges via `setRange`, and re-emits a materialized array whenever the datasource pushes a
 * count or rows (including live in-place updates).
 */
export function createViewportRowModel<TData>(
  datasource: ViewportDatasource<TData>,
  options: ViewportRowModelOptions,
  onChange: (data: Array<TData | RowPlaceholder>, rowCount: number) => void,
): ViewportRowModel<TData> {
  let rowCount = options.rowCount;
  const rows = new Map<number, TData>();

  const emit = (): void => onChange(materializeViewport(rows, rowCount), rowCount);

  datasource.init({
    setRowCount: (count) => {
      rowCount = count;
      emit();
    },
    setRowData: (pushed) => {
      // In-place: re-pushing an index overwrites that row → live update of a visible row.
      for (const key of Object.keys(pushed)) {
        const index = Number(key);
        if (index < rowCount) rows.set(index, pushed[index]!);
      }
      emit();
    },
  });

  return {
    setRange: (firstRow, lastRow) => datasource.setViewportRange(firstRow, lastRow),
    getData: () => materializeViewport(rows, rowCount),
    getRowCount: () => rowCount,
    destroy: () => datasource.destroy?.(),
  };
}
