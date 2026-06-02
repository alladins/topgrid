// @topgrid/grid-sizing — G-3: content-fit auto-size (injected measurement).
//
// The width MATH here is pure: text width is supplied by an injected
// `MeasureText`. The browser canvas measurer lives in `createCanvasMeasureText`
// (SSR-guarded); this file never touches the DOM and never calls canvas.

/**
 * Measures the rendered pixel width of `text`, optionally in a CSS `font`
 * shorthand (e.g. `'14px Arial'`). Host-injected so the sizing math stays pure
 * and testable (mirrors grid-pro-chart's injected `renderChart`).
 */
export type MeasureText = (text: string, font?: string) => number;

/** Default horizontal padding (px) added to the measured content width. */
export const DEFAULT_AUTOSIZE_PADDING = 16;

/** Options for {@link autoSizeColumn}. */
export interface AutoSizeColumnOptions {
  columnId: string;
  /** Header text to measure. */
  header: string;
  /** Cell text values to measure. */
  cellValues: string[];
  /** Injected text-width measurer. */
  measureText: MeasureText;
  /** CSS `font` shorthand passed to `measureText` (optional). */
  font?: string;
  /** Padding (px) added to the widest measured text. Defaults to {@link DEFAULT_AUTOSIZE_PADDING}. */
  padding?: number;
  /** Lower bound (px) for the result. */
  min?: number;
  /** Upper bound (px) for the result. */
  max?: number;
}

/**
 * Compute the content-fit width (px) for one column:
 * `max(measure(header), ...measure(cellValues)) + padding`, clamped to
 * `[min, max]` when provided.
 */
export function autoSizeColumn(options: AutoSizeColumnOptions): number {
  const {
    header,
    cellValues,
    measureText,
    font,
    padding = DEFAULT_AUTOSIZE_PADDING,
    min,
    max,
  } = options;

  // header is always present, so Math.max never receives an empty spread.
  let widest = measureText(header, font);
  for (const value of cellValues) {
    const w = measureText(value, font);
    if (w > widest) widest = w;
  }

  let width = widest + padding;
  if (min !== undefined && width < min) width = min;
  if (max !== undefined && width > max) width = max;
  return width;
}

/** A single column's input to {@link autoSizeColumns}. */
export interface AutoSizeColumnInput {
  columnId: string;
  header: string;
  cellValues: string[];
  min?: number;
  max?: number;
}

/** Options for {@link autoSizeColumns}. */
export interface AutoSizeColumnsOptions {
  columns: AutoSizeColumnInput[];
  /** Injected text-width measurer (shared across all columns). */
  measureText: MeasureText;
  /** CSS `font` shorthand passed to `measureText` (optional). */
  font?: string;
  /** Padding (px) applied to every column. Defaults to {@link DEFAULT_AUTOSIZE_PADDING}. */
  padding?: number;
}

/**
 * Auto-size multiple columns at once, returning a `Record<columnId, px>` width
 * map (consistent with TanStack's `ColumnSizingState`).
 */
export function autoSizeColumns(
  options: AutoSizeColumnsOptions,
): Record<string, number> {
  const { columns, measureText, font, padding } = options;
  const result: Record<string, number> = {};
  for (const col of columns) {
    result[col.columnId] = autoSizeColumn({
      columnId: col.columnId,
      header: col.header,
      cellValues: col.cellValues,
      measureText,
      ...(font !== undefined ? { font } : {}),
      ...(padding !== undefined ? { padding } : {}),
      ...(col.min !== undefined ? { min: col.min } : {}),
      ...(col.max !== undefined ? { max: col.max } : {}),
    });
  }
  return result;
}
