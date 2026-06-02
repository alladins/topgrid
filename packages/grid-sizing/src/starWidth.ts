// @topgrid/grid-sizing — G-1: width spec parsing + star (flex) distribution.
//
// Pure math, zero DOM. Produces a `Record<columnId, px>` width map that flows
// into grid-core's `columnSizing` (TanStack `ColumnSizingState`) declaratively.

/** Parsed result of a column width spec: a proportional star or a fixed px. */
export type ColumnWidthSpec =
  | { kind: 'star'; factor: number }
  | { kind: 'fixed'; px: number };

/** A single column's input to {@link distributeStarWidths}. */
export interface StarColumnInput {
  id: string;
  /** Width spec: `'*'`, `'2*'`, `120`, or `'120px'`. */
  spec: string | number;
  /** Optional lower bound (px) for a star column's resolved width. */
  min?: number;
}

/** Options for {@link distributeStarWidths}. */
export interface DistributeStarWidthsOptions {
  columns: StarColumnInput[];
  /** Total available width (px) to distribute across all columns. */
  totalWidth: number;
}

/**
 * Parse a column width spec.
 *
 * - `'*'` → `{ kind: 'star', factor: 1 }`
 * - `'2*'` / `'3*'` → `{ kind: 'star', factor: 2|3 }`
 * - `120` / `'120px'` / `'120'` → `{ kind: 'fixed', px: 120 }`
 */
export function parseColumnWidth(spec: string | number): ColumnWidthSpec {
  if (typeof spec === 'number') {
    return { kind: 'fixed', px: spec };
  }
  const trimmed = spec.trim();
  if (trimmed.endsWith('*')) {
    const factorPart = trimmed.slice(0, -1).trim();
    const factor = factorPart === '' ? 1 : Number(factorPart);
    return { kind: 'star', factor };
  }
  // Fixed: strip an optional trailing 'px'.
  const pxPart = trimmed.toLowerCase().endsWith('px')
    ? trimmed.slice(0, -2).trim()
    : trimmed;
  return { kind: 'fixed', px: Number(pxPart) };
}

/**
 * Distribute `totalWidth` across columns. Fixed columns take their px first;
 * the remaining width is split among star columns proportional to their factor.
 *
 * Min-clamp re-distribution is ITERATIVE: when a star column's proportional
 * share falls below its `min`, that column is clamped to `min`, removed from the
 * star pool, its px subtracted from the remaining width, and the remaining star
 * columns are re-distributed. The loop repeats until no remaining star column
 * violates its `min` (clamping one column shrinks the pool and can push another
 * below its min — a single pass is insufficient).
 *
 * Returns float px (no rounding) so ratios are exact (e.g. 133.33 / 266.67).
 */
export function distributeStarWidths(
  options: DistributeStarWidthsOptions,
): Record<string, number> {
  const { columns, totalWidth } = options;
  const result: Record<string, number> = {};

  interface StarEntry {
    id: string;
    factor: number;
    min: number;
  }

  const stars: StarEntry[] = [];
  let remaining = totalWidth;

  for (const col of columns) {
    const parsed = parseColumnWidth(col.spec);
    if (parsed.kind === 'fixed') {
      result[col.id] = parsed.px;
      remaining -= parsed.px;
    } else {
      stars.push({ id: col.id, factor: parsed.factor, min: col.min ?? 0 });
    }
  }

  // Iteratively resolve star columns, clamping min-violators out of the pool.
  let pool = stars;
  let poolWidth = remaining;
  while (pool.length > 0) {
    const totalFactor = pool.reduce((sum, s) => sum + s.factor, 0);
    // Degenerate: no positive factor → give each its min, share nothing.
    if (totalFactor <= 0) {
      for (const s of pool) result[s.id] = s.min;
      break;
    }

    const violators: StarEntry[] = [];
    const survivors: StarEntry[] = [];
    for (const s of pool) {
      const share = (poolWidth * s.factor) / totalFactor;
      if (share < s.min) {
        violators.push(s);
      } else {
        survivors.push(s);
      }
    }

    if (violators.length === 0) {
      // No violations: assign proportional shares to the whole pool.
      for (const s of pool) {
        result[s.id] = (poolWidth * s.factor) / totalFactor;
      }
      break;
    }

    // Clamp violators to their min, remove from pool, re-distribute remainder.
    for (const v of violators) {
      result[v.id] = v.min;
      poolWidth -= v.min;
    }
    pool = survivors;
  }

  return result;
}
