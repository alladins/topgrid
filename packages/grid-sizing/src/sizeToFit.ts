// @topgrid/grid-sizing — G-2: sizeToFit (pure).
//
// Proportionally scales current column widths so their sum equals the container
// width exactly. Pure math, zero DOM.

/** A single column's input to {@link sizeToFit}. */
export interface SizeToFitColumnInput {
  id: string;
  /** Current width (px). */
  width: number;
}

/** Options for {@link sizeToFit}. */
export interface SizeToFitOptions {
  columns: SizeToFitColumnInput[];
  /** Target total width (px) the result must sum to. */
  containerWidth: number;
}

/**
 * Scale `columns` so the resulting integer px widths sum to `containerWidth`.
 *
 * Each column is scaled by `containerWidth / currentSum`, then rounded to an
 * integer. Rounding can leave a small leftover (the rounded sum may differ from
 * `containerWidth` by a few px); that leftover is assigned to the single widest
 * column so the final sum equals `containerWidth` exactly.
 *
 * Edge cases: empty `columns` → `{}`. A current sum of 0 (all widths 0) cannot
 * be scaled proportionally, so the `containerWidth` is split evenly instead,
 * with the leftover going to the last column.
 */
export function sizeToFit(options: SizeToFitOptions): Record<string, number> {
  const { columns, containerWidth } = options;
  const result: Record<string, number> = {};
  if (columns.length === 0) return result;

  const currentSum = columns.reduce((sum, c) => sum + c.width, 0);

  let widestId = columns[0]!.id;
  let widestWidth = -Infinity;

  if (currentSum <= 0) {
    // Degenerate: no proportions to preserve → split evenly.
    const even = Math.round(containerWidth / columns.length);
    for (const c of columns) {
      result[c.id] = even;
    }
    // Assign leftover to the last column.
    const lastId = columns[columns.length - 1]!.id;
    const evenSum = even * columns.length;
    result[lastId] += containerWidth - evenSum;
    return result;
  }

  const scale = containerWidth / currentSum;
  let roundedSum = 0;
  for (const c of columns) {
    const scaled = Math.round(c.width * scale);
    result[c.id] = scaled;
    roundedSum += scaled;
    if (c.width > widestWidth) {
      widestWidth = c.width;
      widestId = c.id;
    }
  }

  // Distribute the integer-rounding remainder to the widest column so the
  // final sum equals containerWidth exactly.
  const remainder = containerWidth - roundedSum;
  if (remainder !== 0) {
    result[widestId] += remainder;
  }

  return result;
}
