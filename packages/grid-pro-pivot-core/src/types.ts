/**
 * @topgrid/grid-pro-pivot — type definitions
 * MOD-GRID-18 / G-1 (PivotConfig + PivotValueDef + PivotModel)
 *
 * Pivot has its OWN value-aggregation contract: `(values: number[]) => number`.
 * It is intentionally separate from grid-pro-agg's Row-based registry (ADR-001) —
 * pivot reuses only the *key vocabulary* (`AggregationFnKey`), not the resolvers.
 */

import type { AggregationFnKey } from '@topgrid/grid-pro-agg';

/**
 * A custom pivot value reducer.
 *
 * Pivot-specific contract: receives the matching leaf rows' numeric values for a
 * single field and returns one number. (Distinct from grid-pro-agg's multi-column
 * Row-based `AggregationFn` — see ADR-001.)
 */
export type PivotValueReducer = (values: number[]) => number;

/**
 * One value (measure) definition in a pivot configuration.
 *
 * @example
 * { field: 'sales', aggregationFn: 'sum' }
 * { field: 'sales', aggregationFn: (v) => v.reduce((a, b) => a + b, 0) / v.length, label: 'Mean' }
 */
export interface PivotValueDef {
  /** Source field whose numeric values are aggregated into each cell. */
  field: string;
  /**
   * Built-in aggregation key (`AggregationFnKey`) OR a custom reducer over
   * `number[]` (pivot's own contract).
   */
  aggregationFn: AggregationFnKey | PivotValueReducer;
  /** Optional display label for the measure (defaults to `field`). */
  label?: string;
}

/**
 * Declarative pivot configuration.
 *
 * @typeParam — keys reference fields on the source `TData` rows.
 */
export interface PivotConfig {
  /** Row-dimension field names (order = nesting order; one leading column each). */
  rows: string[];
  /** Column-dimension field names (order = header nesting order). */
  columns: string[];
  /** Value/measure definitions (each multiplies the column count). */
  values: PivotValueDef[];
}

/**
 * A node in the column-combination tree (nested by column-dimension order).
 *
 * Leaf nodes (no `children`) carry a stable `key` used to index value cells.
 */
export interface PivotColumnNode {
  /** Column-dimension field this level represents. */
  field: string;
  /** The dimension value at this node (stringified). */
  value: string;
  /** Stable path key for the column combination up to this node. */
  key: string;
  /** Child nodes for the next column dimension (absent on leaves). */
  children?: PivotColumnNode[];
}

/**
 * Discriminator marking the semantic kind of a flattened pivot row.
 *
 * - `'data'`     — a leaf row-group (the deepest row-dimension combination).
 * - `'subtotal'` — a per-row-group subtotal (a row dimension closing).
 * - `'grandTotal'` — the bottom grand-total row (all rows aggregated).
 */
export type PivotRowKind = 'data' | 'subtotal' | 'grandTotal';

/**
 * One flattened pivot output row, ready to feed `<Grid data>`.
 *
 * Row-dimension values live under their field names; each value cell lives under
 * a composite key (`<colComboKey>__<valueDefIndex>`). The grand-total *column*
 * cells use the reserved `GRAND_TOTAL_COLUMN_KEY` prefix.
 */
export interface PivotRow {
  /** Semantic kind (drives styling + label rendering). */
  __kind: PivotRowKind;
  /** Nesting depth (row-dimension index this row belongs to; grandTotal = -1). */
  __depth: number;
  /** Stable row id (unique within the model). */
  __id: string;
  /** Cell values keyed by `<colComboKey>__<valueIndex>` (and grand-total keys). */
  [key: string]: number | string | null;
}

/**
 * The complete headless pivot result returned by the pure transform / `usePivot`.
 *
 * @typeParam — see {@link PivotConfig} for the dimension contract.
 */
export interface PivotModel {
  /** The config the model was built from (echoed for the renderer). */
  config: PivotConfig;
  /** Column-combination tree (nested by `config.columns` order). */
  columnTree: PivotColumnNode[];
  /** Leaf column-combination keys in left-to-right order. */
  columnLeafKeys: string[];
  /** Flattened rows (data + subtotals + grand-total), in render order. */
  rows: PivotRow[];
}
