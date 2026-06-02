/**
 * @topgrid/grid-pro-pivot — pure pivot transform (no React imports)
 * MOD-GRID-18 / G-1 + G-4 (totals/subtotals computed here, not in render)
 *
 * Transforms flat `TData[]` into a {@link PivotModel}: a column-combination tree,
 * a flattened row list (row groups + per-group subtotals + grand-total), and a
 * value cell per (rowGroup × columnCombo × valueDef).
 *
 * Pure + React-free so it tree-shakes independently of the component shell
 * (mirrors grid-pro-agg's `aggregationFns.ts` split) and so the heavy 2-axis
 * subtotal logic stays unit-testable.
 */

import { applyReducer } from './reducers';
import type {
  PivotColumnNode,
  PivotConfig,
  PivotModel,
  PivotRow,
  PivotValueDef,
} from './types';

/** Reserved key prefix for the row-grand-total column combination. */
export const GRAND_TOTAL_COLUMN_KEY = '__grandTotalCol__';

/** Separator between a column-combination key and a value-def index. */
const VALUE_KEY_SEP = '__';

/** Stringify a dimension value for use as a stable key segment. */
function asKey(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/** Compose the cell key for a (column-combo leaf, value-def index) pair. */
function cellKey(columnComboKey: string, valueIndex: number): string {
  return `${columnComboKey}${VALUE_KEY_SEP}${valueIndex}`;
}

/** Read a field off a source row as a number (non-numeric → NaN, filtered later). */
function readNumber(row: Record<string, unknown>, field: string): number {
  const raw = row[field];
  return typeof raw === 'number' ? raw : Number(raw);
}

/**
 * Build the nested column-combination tree from the rows present in the data.
 *
 * Only combinations that actually occur are emitted (sparse — matches AG/Wijmo
 * pivot behaviour). Returns the tree plus the ordered list of leaf keys.
 */
function buildColumnTree(
  data: Record<string, unknown>[],
  columnFields: string[],
): { tree: PivotColumnNode[]; leafKeys: string[] } {
  if (columnFields.length === 0) {
    // No column dimensions → a single implicit leaf holding every row.
    return { tree: [], leafKeys: [''] };
  }

  const leafKeys: string[] = [];

  function build(
    rows: Record<string, unknown>[],
    depth: number,
    parentKey: string,
  ): PivotColumnNode[] {
    const field = columnFields[depth];
    // Preserve first-seen order of distinct values.
    const order: string[] = [];
    const buckets = new Map<string, Record<string, unknown>[]>();
    for (const row of rows) {
      const v = asKey(row[field]);
      let bucket = buckets.get(v);
      if (bucket === undefined) {
        bucket = [];
        buckets.set(v, bucket);
        order.push(v);
      }
      bucket.push(row);
    }

    return order.map((value) => {
      const key = parentKey === '' ? value : `${parentKey}/${value}`;
      const node: PivotColumnNode = { field, value, key };
      if (depth + 1 < columnFields.length) {
        node.children = build(buckets.get(value)!, depth + 1, key);
      } else {
        leafKeys.push(key);
      }
      return node;
    });
  }

  const tree = build(data, 0, '');
  return { tree, leafKeys };
}

/**
 * Group rows by a row-dimension prefix (the first `depth + 1` row fields),
 * preserving first-seen order. Returns ordered group descriptors.
 */
function groupByRowPrefix(
  rows: Record<string, unknown>[],
  rowFields: string[],
  depth: number,
): { value: string; rows: Record<string, unknown>[] }[] {
  const field = rowFields[depth];
  const order: string[] = [];
  const buckets = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const v = asKey(row[field]);
    let bucket = buckets.get(v);
    if (bucket === undefined) {
      bucket = [];
      buckets.set(v, bucket);
      order.push(v);
    }
    bucket.push(row);
  }
  return order.map((value) => ({ value, rows: buckets.get(value)! }));
}

/**
 * Compute every value cell for a set of source rows, keyed by
 * `<colComboLeafKey>__<valueIndex>` plus the grand-total column.
 *
 * For each leaf column combination we partition the rows by that combination and
 * apply each value-def's reducer to the matching field values. The grand-total
 * column applies each reducer to ALL rows in the set (ignoring column dims).
 */
function computeCells(
  rows: Record<string, unknown>[],
  columnFields: string[],
  values: PivotValueDef[],
): Record<string, number | null> {
  const cells: Record<string, number | null> = {};

  // Partition rows by their full column-combination leaf key.
  const byCombo = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const comboKey =
      columnFields.length === 0
        ? ''
        : columnFields.map((f) => asKey(row[f])).join('/');
    let bucket = byCombo.get(comboKey);
    if (bucket === undefined) {
      bucket = [];
      byCombo.set(comboKey, bucket);
    }
    bucket.push(row);
  }

  values.forEach((valueDef, valueIndex) => {
    // Per-combination value cells.
    for (const [comboKey, comboRows] of byCombo) {
      const nums = comboRows.map((r) => readNumber(r, valueDef.field));
      cells[cellKey(comboKey, valueIndex)] = applyReducer(
        valueDef.aggregationFn,
        nums,
      );
    }
    // Row grand-total column: reducer over ALL rows (every column combo).
    const allNums = rows.map((r) => readNumber(r, valueDef.field));
    cells[cellKey(GRAND_TOTAL_COLUMN_KEY, valueIndex)] = applyReducer(
      valueDef.aggregationFn,
      allNums,
    );
  });

  return cells;
}

/**
 * The pure pivot transform — flat data → {@link PivotModel}.
 *
 * Emits, in render order:
 *   - leaf data rows (deepest row-dimension combination),
 *   - per-row-group subtotal rows (one when each non-leaf row group closes),
 *   - a final grand-total row (all rows aggregated).
 *
 * When `config.rows` is empty, a single grand-total row carries the column
 * aggregation. When `config.columns` is empty, every value collapses into the
 * grand-total column (still one cell per value-def).
 *
 * @typeParam TData - Source row shape (treated structurally as a string record).
 */
export function computePivot<TData extends Record<string, unknown>>(
  data: TData[],
  config: PivotConfig,
): PivotModel {
  const source = data as Record<string, unknown>[];
  const { rows: rowFields, columns: columnFields, values } = config;

  const { tree, leafKeys } = buildColumnTree(source, columnFields);

  const outRows: PivotRow[] = [];
  let idSeq = 0;
  const nextId = (): string => `pr-${idSeq++}`;

  /** Materialise a PivotRow from computed cells + row-dimension label values. */
  function makeRow(
    kind: PivotRow['__kind'],
    depth: number,
    rowDimValues: Record<string, string>,
    cells: Record<string, number | null>,
  ): PivotRow {
    const row: PivotRow = { __kind: kind, __depth: depth, __id: nextId() };
    for (const [field, value] of Object.entries(rowDimValues)) {
      row[field] = value;
    }
    for (const [key, value] of Object.entries(cells)) {
      row[key] = value;
    }
    return row;
  }

  /**
   * Recursively emit rows for a row-dimension subtree.
   *
   * At the deepest dimension each group is a `data` row. Above that, after
   * emitting a group's descendants we append a `subtotal` row for the group
   * (2-axis subtotal: the same reducers over the group's wider row set).
   */
  function emit(
    rows: Record<string, unknown>[],
    depth: number,
    ancestorDims: Record<string, string>,
  ): void {
    const groups = groupByRowPrefix(rows, rowFields, depth);
    const isLeafDim = depth === rowFields.length - 1;

    for (const group of groups) {
      const dims = { ...ancestorDims, [rowFields[depth]]: group.value };

      if (isLeafDim) {
        outRows.push(
          makeRow(
            'data',
            depth,
            dims,
            computeCells(group.rows, columnFields, values),
          ),
        );
      } else {
        // Descend first (children render above their subtotal).
        emit(group.rows, depth + 1, dims);
        // Then the per-group subtotal across this group's full row set.
        outRows.push(
          makeRow(
            'subtotal',
            depth,
            dims,
            computeCells(group.rows, columnFields, values),
          ),
        );
      }
    }
  }

  if (rowFields.length > 0) {
    emit(source, 0, {});
  }

  // Grand-total row (all rows; row-dimension columns are left blank).
  outRows.push(
    makeRow('grandTotal', -1, {}, computeCells(source, columnFields, values)),
  );

  return {
    config,
    columnTree: tree,
    columnLeafKeys: leafKeys,
    rows: outRows,
  };
}
