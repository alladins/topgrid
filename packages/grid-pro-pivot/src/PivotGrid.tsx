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

import { useMemo, useState, type JSX } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Grid, type RowClassNameCallback } from '@topgrid/grid-core';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

import { computePivot } from './computePivot';
import { buildPivotColumns } from './buildPivotColumns';
import { sortPivotRows, type PivotSortState } from './sortPivotRows';
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
  /**
   * Pivot 값 컬럼 정렬 활성 (MOD-GRID-31 G-1, default `false`). `true` 시 값 헤더가 클릭→그룹 내
   * 정렬(subtotal/grandTotal 앵커, grid-core enableSort 아님). 미지정=MOD-18 동작(정적 헤더).
   */
  enableSort?: boolean;
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
  enableSort,
  className,
}: PivotGridProps<TData>): JSX.Element {
  const lic = useLicenseStatus();

  // MOD-GRID-31 G-1: 정렬 state(값 leafKey + 방향). 클릭 cycle asc→desc→해제.
  const [sort, setSort] = useState<PivotSortState | null>(null);
  const onSort = (leafKey: string): void =>
    setSort((prev) => {
      if (!prev || prev.leafKey !== leafKey) return { leafKey, dir: 'asc' };
      if (prev.dir === 'asc') return { leafKey, dir: 'desc' };
      return null; // desc → 해제
    });

  // G-1/G-4: headless pivot model (memoised). Skipped entirely when pivotMode=false.
  const model = useMemo(
    () => (pivotMode ? computePivot(data, config) : null),
    [pivotMode, data, config],
  );

  const pivotColumns = useMemo(
    () =>
      model
        ? buildPivotColumns(model, enableSort === true ? { active: sort, onSort } : undefined)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, enableSort, sort],
  );

  // MOD-GRID-31 G-1: 정렬 활성+활성 정렬 시 그룹 내 재정렬(subtotal/grandTotal 앵커). 아니면 원본.
  const displayRows = useMemo(
    () => (model && enableSort === true && sort ? sortPivotRows(model, sort.leafKey, sort.dir) : model?.rows ?? []),
    [model, enableSort, sort],
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
        data={displayRows}
        columns={pivotColumns}
        rowClassName={rowClassName}
        {...(enableVirtualization !== undefined ? { enableVirtualization } : {})}
      />
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
