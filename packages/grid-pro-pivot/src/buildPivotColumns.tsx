/**
 * @topgrid/grid-pro-pivot — pivot → TanStack ColumnDef builder
 * MOD-GRID-18 / G-3 + G-4
 *
 * Maps a {@link PivotModel} to grid-core `<Grid>` columns:
 *   - row dimensions → leading columns (one per `config.rows` field),
 *   - column dimensions → nested `ColumnDef.columns` (multi-level headers,
 *     POL-TANSTACK declarative column groups),
 *   - value cells → leaf columns keyed by `<colComboKey>__<valueIndex>`,
 *   - a trailing grand-total column group (row grand-total).
 *
 * Spike result: full `<Grid>` delegation. Synthetic subtotal/grand-total rows are
 * ordinary `data` rows tagged via `__kind`; each `cell` renderer reads that tag to
 * render labels / blank cells. No own `<table>` is needed (verified against
 * grid-core/src/Grid.tsx: thead renders getHeaderGroups() with colSpan, tbody uses
 * flexRender(column.cell), rowClassName applies to every <tr>).
 */

import type { ColumnDef } from '@tanstack/react-table';
import { GRAND_TOTAL_COLUMN_KEY } from './computePivot';
import type { PivotSortState } from './sortPivotRows';
import type {
  PivotColumnNode,
  PivotConfig,
  PivotModel,
  PivotRow,
} from './types';

/**
 * 값 헤더 정렬 어포던스 옵션(MOD-GRID-31 G-1). 지정 시 값 leaf 헤더가 클릭→정렬 + 인디케이터(▲▼).
 * 미지정 시 헤더는 기존 plain string(MOD-18 동작 불변).
 */
export interface PivotSortOpts {
  active: PivotSortState | null;
  onSort: (leafKey: string) => void;
}

/** Render a numeric cell value; `null` → an em-dash placeholder. */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

/** Label shown in the first row-dimension column for synthetic rows. */
function rowKindLabel(row: PivotRow, firstRowField: string | undefined): string {
  if (row.__kind === 'grandTotal') return 'Grand Total';
  if (row.__kind === 'subtotal') {
    const dimValue = firstRowField !== undefined ? row[firstRowField] : undefined;
    return `${dimValue ?? ''} Total`;
  }
  // data row: show its own dimension value (handled per-column below).
  return '';
}

/** Clickable value header with a sort indicator (MOD-GRID-31 G-1). Inline style — Tailwind inert in storybook. */
function SortableValueHeader(
  label: string,
  leafKey: string,
  sort: PivotSortOpts,
): JSX.Element {
  const active = sort.active !== null && sort.active.leafKey === leafKey;
  const indicator = active ? (sort.active!.dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <button
      type="button"
      aria-label={`${label} 정렬`}
      onClick={() => sort.onSort(leafKey)}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        font: 'inherit',
        color: 'inherit',
        padding: 0,
      }}
    >
      {label}
      {indicator}
    </button>
  );
}

/**
 * Build a value-cell accessor leaf column for a given (column-combo, value-def).
 * With `sort`, the header is clickable (sort by this leaf key); without, a plain string (MOD-18).
 */
function valueLeafColumn(
  comboKey: string,
  valueIndex: number,
  header: string,
  sort?: PivotSortOpts,
): ColumnDef<PivotRow> {
  const accessorKey = `${comboKey}__${valueIndex}`;
  return {
    id: accessorKey,
    header: sort ? () => SortableValueHeader(header, accessorKey, sort) : header,
    accessorFn: (row) => row[accessorKey] ?? null,
    cell: (ctx) => formatCellValue(ctx.getValue()),
  };
}

/**
 * Recursively map a column-combination node to a TanStack column (group or, at
 * the leaf, one value column per value-def).
 */
function mapColumnNode(
  node: PivotColumnNode,
  valueDefs: PivotConfig['values'],
  sort?: PivotSortOpts,
): ColumnDef<PivotRow> {
  if (node.children && node.children.length > 0) {
    return {
      id: `grp:${node.key}`,
      header: node.value,
      columns: node.children.map((child) => mapColumnNode(child, valueDefs, sort)),
    };
  }
  // Leaf column combination: one value column per value-def.
  if (valueDefs.length === 1) {
    return {
      ...valueLeafColumn(node.key, 0, node.value, sort),
    };
  }
  return {
    id: `grp:${node.key}`,
    header: node.value,
    columns: valueDefs.map((vd, i) =>
      valueLeafColumn(node.key, i, vd.label ?? vd.field, sort),
    ),
  };
}

/**
 * Build the full `<Grid>` column set from a pivot model.
 *
 * @param model - The headless pivot model.
 * @returns Declarative `ColumnDef<PivotRow>[]` (leading row-dimension columns +
 *   nested value column groups + grand-total group).
 */
export function buildPivotColumns(
  model: PivotModel,
  sort?: PivotSortOpts,
): ColumnDef<PivotRow>[] {
  const { config, columnTree } = model;
  const rowFields = config.rows;
  const valueDefs = config.values;
  const firstRowField = rowFields[0];

  const out: ColumnDef<PivotRow>[] = [];

  // --- Leading row-dimension columns ---
  rowFields.forEach((field, depth) => {
    out.push({
      id: `dim:${field}`,
      header: field,
      accessorFn: (row) => row[field] ?? null,
      cell: (ctx) => {
        const row = ctx.row.original;
        // Synthetic rows: only the first dimension column carries the label.
        if (row.__kind === 'grandTotal') {
          return depth === 0 ? rowKindLabel(row, firstRowField) : '';
        }
        if (row.__kind === 'subtotal') {
          // Subtotal belongs to row.__depth; label sits in that depth's column.
          return depth === row.__depth ? rowKindLabel(row, firstRowField) : '';
        }
        // Data row: show the dimension value at this depth.
        return formatCellValue(ctx.getValue());
      },
    });
  });

  // --- Column-dimension value groups (nested headers) ---
  if (columnTree.length > 0) {
    for (const node of columnTree) {
      out.push(mapColumnNode(node, valueDefs, sort));
    }
  } else {
    // No column dimensions → a single implicit value group under the '' combo.
    if (valueDefs.length === 1) {
      out.push(valueLeafColumn('', 0, valueDefs[0].label ?? valueDefs[0].field, sort));
    } else {
      out.push({
        id: 'grp:values',
        header: 'Values',
        columns: valueDefs.map((vd, i) =>
          valueLeafColumn('', i, vd.label ?? vd.field, sort),
        ),
      });
    }
  }

  // --- Trailing grand-total column group (row grand-total) ---
  if (valueDefs.length === 1) {
    out.push(
      valueLeafColumn(GRAND_TOTAL_COLUMN_KEY, 0, 'Total', sort),
    );
  } else {
    out.push({
      id: 'grp:grandTotal',
      header: 'Total',
      columns: valueDefs.map((vd, i) =>
        valueLeafColumn(GRAND_TOTAL_COLUMN_KEY, i, vd.label ?? vd.field, sort),
      ),
    });
  }

  return out;
}
