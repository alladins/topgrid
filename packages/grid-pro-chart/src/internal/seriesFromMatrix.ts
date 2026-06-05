/**
 * Matrix → chart series bridge — pure, zero-dependency, node-testable (MOD-GRID-34 G-3).
 *
 * ★ This is the single transform behind BOTH "chart from a selected cell range" and "chart a pivot
 * result": each reduces to a 2-D matrix of numbers with row + column labels. Keeping ONE pure
 * function (no grid/pivot import) means the orientation logic is proven once in node, and the live
 * wiring (which cells are selected / which pivot rows) stays a thin caller concern.
 *
 * No chart library, no React, no grid coupling (C-001/AP-001).
 */

import type { ChartSeries } from './chartScale.js';

export interface MatrixInput {
  /** Row labels — the x-axis categories when orientation is `'columns'`. */
  categories: string[];
  /** Column labels — the series names when orientation is `'columns'`. */
  columns: string[];
  /** `matrix[rowIndex][colIndex]` numeric value. Non-finite entries are kept (the chart gaps them). */
  matrix: number[][];
  /**
   * Which axis becomes a series:
   * - `'columns'` (default): each COLUMN is a series (values read down the rows); x = row labels.
   * - `'rows'`: each ROW is a series (values read across the columns); x = column labels.
   */
  orientation?: 'columns' | 'rows';
  /** Optional colour per produced series (by series index). */
  colors?: string[];
}

export interface MatrixChartData {
  /** x-axis category labels for the chosen orientation. */
  categories: string[];
  /** Series ready to hand to {@link RangeChart}. */
  series: ChartSeries[];
}

/**
 * Turn a labelled 2-D matrix into chart series + x categories.
 *
 * Orientation decides the pivot of the data: charting a 3-region × 2-quarter matrix `'columns'`
 * gives one series per quarter across regions; `'rows'` gives one series per region across quarters.
 * Same numbers, transposed grouping — the bug this guards is silently charting the wrong axis.
 */
export function seriesFromMatrix(input: MatrixInput): MatrixChartData {
  const { categories, columns, matrix, orientation = 'columns', colors } = input;
  const colorAt = (i: number) => (colors && colors[i] !== undefined ? { color: colors[i] } : {});

  if (orientation === 'rows') {
    const series: ChartSeries[] = matrix.map((rowValues, r) => ({
      name: categories[r] ?? `row ${r}`,
      values: rowValues.slice(),
      ...colorAt(r),
    }));
    return { categories: columns.slice(), series };
  }

  // 'columns' (default): each column index → a series of that column down every row.
  const colCount = columns.length;
  const series: ChartSeries[] = [];
  for (let c = 0; c < colCount; c++) {
    series.push({
      name: columns[c] ?? `col ${c}`,
      values: matrix.map((row) => row[c]),
      ...colorAt(c),
    });
  }
  return { categories: categories.slice(), series };
}

/** Composite-key separator used by the pivot model (`<colComboLeafKey>__<valueIndex>`). */
const PIVOT_VALUE_SEP = '__';

/**
 * Minimal structural shape of a pivot result needed to chart it — declared locally so grid-pro-chart
 * stays DECOUPLED from grid-pro-pivot (no package dependency / no cycle). Any object matching this
 * shape (e.g. a real `PivotModel`) can be charted.
 */
export interface PivotLike {
  config: { rows: string[]; columns: string[]; values: unknown[] };
  columnLeafKeys: string[];
  columnTree?: Array<{ key: string; value: string; children?: unknown[] }>;
  rows: Array<{ __kind: string; [key: string]: number | string | null }>;
}

/** Walk the column tree's LEAVES → { leafKey: friendly column value } for nicer series names. */
function leafLabels(tree?: PivotLike['columnTree']): Record<string, string> {
  const out: Record<string, string> = {};
  const visit = (nodes?: Array<{ key: string; value: string; children?: unknown[] }>) => {
    for (const n of nodes ?? []) {
      if (n.children && n.children.length) visit(n.children as typeof nodes);
      else out[n.key] = n.value;
    }
  };
  visit(tree);
  return out;
}

/**
 * Reduce a pivot result into chart series (MOD-GRID-34 G-3) — pure, node-testable.
 *
 * ★ This is the REAL pivot→chart adapter (not a hand-fed matrix): it keeps only `__kind==='data'`
 * rows (dropping subtotal/grandTotal), labels each by its row-dimension values, and reads each leaf
 * column's value cell `<leafKey>__<valueIndex>` into the matrix — then defers to
 * {@link seriesFromMatrix}. One measure at a time (`valueIndex`, default 0); multi-measure charting
 * is a caller choice (call once per index).
 */
export function seriesFromPivot(
  model: PivotLike,
  opts: { valueIndex?: number; colors?: string[] } = {},
): MatrixChartData {
  const valueIndex = opts.valueIndex ?? 0;
  const dataRows = model.rows.filter((r) => r.__kind === 'data');
  const categories = dataRows.map((r) =>
    model.config.rows
      .map((f) => (r[f] == null ? '' : String(r[f])))
      .filter(Boolean)
      .join(' / '),
  );
  const labels = leafLabels(model.columnTree);
  const columns = model.columnLeafKeys.map((k) => labels[k] ?? k);
  const matrix = dataRows.map((r) =>
    model.columnLeafKeys.map((k) => {
      const v = r[`${k}${PIVOT_VALUE_SEP}${valueIndex}`];
      return typeof v === 'number' ? v : NaN;
    }),
  );
  return seriesFromMatrix({
    categories,
    columns,
    matrix,
    orientation: 'columns',
    ...(opts.colors ? { colors: opts.colors } : {}),
  });
}
