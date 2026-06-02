/**
 * @topgrid/grid-pro-pivot — PivotGrid React component
 * MOD-GRID-18 / G-3 (render + column groups via <Grid> delegation)
 * MOD-GRID-18 / G-4 (grand-total + per-row-group subtotal rows)
 * MOD-GRID-18 / G-5 (pivotMode toggle + Pro license gate)
 *
 * PAT-001 wrapper: a headless transform (`usePivot`/`computePivot`) feeds a
 * grid-core `<Grid>`. Spike result = FULL `<Grid>` delegation — pivot output is a
 * flat `data` array of {@link PivotRow}s (synthetic subtotal/grand rows tagged via
 * `__kind`), and column dimensions become nested `ColumnDef.columns`. No own
 * `<table>`; virtualization is delegated to `<Grid enableVirtualization>` (C-001).
 */

import { useMemo, type JSX } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, type RowClassNameCallback } from '@topgrid/grid-core';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

import { computePivot } from './computePivot';
import { buildPivotColumns } from './buildPivotColumns';
import type { PivotConfig, PivotRow } from './types';

/**
 * Props for {@link PivotGrid}.
 *
 * @typeParam TData - Source row shape.
 */
export interface PivotGridProps<TData extends Record<string, unknown>> {
  /** Flat source rows. */
  data: TData[];
  /** Pivot configuration (row/column dimensions + value defs). */
  config: PivotConfig;
  /**
   * When `false`, the pivot transform is skipped entirely and `data` is rendered
   * as a normal grid using `passthroughColumns` (G-5). Default `true`.
   */
  pivotMode?: boolean;
  /**
   * Columns used when `pivotMode === false` (normal grid passthrough).
   * Ignored in pivot mode.
   */
  passthroughColumns?: ColumnDef<TData, unknown>[];
  /** Enable `<Grid>` virtualization (delegated — C-001, no react-virtual here). */
  enableVirtualization?: boolean;
  /** Outer wrapper className. */
  className?: string;
}

/** Tailwind emphasis applied to synthetic subtotal / grand-total rows. */
function pivotRowClassName(row: PivotRow): string {
  if (row.__kind === 'grandTotal') return 'font-semibold bg-gray-100';
  if (row.__kind === 'subtotal') return 'font-medium bg-gray-50';
  return '';
}

/**
 * `PivotGrid` — declarative 2-D pivot table over grid-core `<Grid>`.
 *
 * @example
 * ```tsx
 * <PivotGrid
 *   data={sales}
 *   config={{
 *     rows: ['region'],
 *     columns: ['quarter'],
 *     values: [{ field: 'sales', aggregationFn: 'sum' }],
 *   }}
 * />
 * ```
 */
export function PivotGrid<TData extends Record<string, unknown>>({
  data,
  config,
  pivotMode = true,
  passthroughColumns,
  enableVirtualization,
  className,
}: PivotGridProps<TData>): JSX.Element {
  const lic = useLicenseStatus();

  // G-1/G-4: headless pivot model (memoised). Skipped entirely when pivotMode=false.
  const model = useMemo(
    () => (pivotMode ? computePivot(data, config) : null),
    [pivotMode, data, config],
  );

  const pivotColumns = useMemo(
    () => (model ? buildPivotColumns(model) : []),
    [model],
  );

  const rootClassName = ['relative', className ?? ''].filter(Boolean).join(' ');

  // G-5: pivotMode=false → normal grid passthrough (NO pivot transform).
  if (!pivotMode) {
    return (
      <div className={rootClassName}>
        <Grid<TData>
          data={data}
          columns={passthroughColumns ?? []}
          {...(enableVirtualization !== undefined ? { enableVirtualization } : {})}
        />
        {lic.watermarkRequired && <Watermark required />}
      </div>
    );
  }

  const rowClassName: RowClassNameCallback<PivotRow> = (row) =>
    pivotRowClassName(row.original);

  return (
    <div className={rootClassName}>
      <Grid<PivotRow>
        data={model!.rows}
        columns={pivotColumns}
        rowClassName={rowClassName}
        {...(enableVirtualization !== undefined ? { enableVirtualization } : {})}
      />
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
